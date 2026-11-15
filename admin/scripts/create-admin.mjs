#!/usr/bin/env node
/**
 * Create an admin account, or reset an existing admin's password.
 * There is no sign-up page: this script is the only way to make the first admin.
 *
 *   npm run create-admin
 *
 * It asks for username, name, email and password (typed hidden).
 * Reads MONGODB_URI from admin/.env.local (the npm script passes --env-file).
 *
 * For automation you can pass everything as environment variables instead:
 *   ADMIN_USERNAME, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Put it in admin/.env.local and run: npm run create-admin");
  process.exit(1);
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Print the question once, then swallow every echoed key.
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

const username = (process.env.ADMIN_USERNAME || (await ask("Username: "))).toLowerCase();
if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
  console.error("Username: 3-30 characters, letters, numbers, dot, dash or underscore.");
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
const admins = mongoose.connection.collection("admins");
await admins.createIndex({ username: 1 }, { unique: true });
const existing = await admins.findOne({ username });

let name = existing?.name;
let email = existing?.email;
if (!existing) {
  name = process.env.ADMIN_NAME || (await ask("Full name: "));
  email = (process.env.ADMIN_EMAIL || (await ask("Email: "))).toLowerCase();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Enter a name and a valid email address.");
    process.exit(1);
  }
} else {
  console.log(`Admin "${username}" exists. Setting a new password and signing them out everywhere.`);
}

const password = process.env.ADMIN_PASSWORD || (await ask("Password (min 12 characters): ", { hidden: true }));
if (password.length < 12) {
  console.error("The password must be at least 12 characters.");
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
  const again = await ask("Repeat password: ", { hidden: true });
  if (again !== password) {
    console.error("The passwords do not match.");
    process.exit(1);
  }
}

const hash = await bcrypt.hash(password, 12);
const now = new Date();

if (existing) {
  await admins.updateOne(
    { _id: existing._id },
    { $set: { password: hash, active: true, updated_at: now }, $inc: { token_version: 1 } },
  );
  console.log(`Password updated for "${username}".`);
} else {
  await admins.insertOne({
    username,
    name,
    email,
    password: hash,
    active: true,
    token_version: 0,
    created_by: "create-admin script",
    created_at: now,
    updated_at: now,
  });
  console.log(`Admin "${username}" created. Sign in at the admin panel /login.`);
}

await mongoose.disconnect();
