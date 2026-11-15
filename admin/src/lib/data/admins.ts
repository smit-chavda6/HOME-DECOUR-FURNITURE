import "server-only";
import { connectDb } from "@/lib/db";
import { Admin, Audit } from "@/lib/models/admin";

export async function getAdmins() {
  await connectDb();
  const docs = await Admin.find().sort({ created_at: 1 }).select("-password").lean();
  return docs.map((a) => ({
    id: String(a._id),
    username: a.username,
    name: a.name,
    email: a.email,
    active: a.active !== false,
    lastLoginAt: a.last_login_at ? new Date(a.last_login_at).toISOString() : null,
    lastLoginIp: a.last_login_ip ?? "",
  }));
}

export async function getAuditLog(limit = 60) {
  await connectDb();
  const docs = await Audit.find().sort({ at: -1 }).limit(limit).lean();
  return docs.map((d) => ({
    id: String(d._id),
    at: new Date(d.at ?? Date.now()).toISOString(),
    username: d.username ?? "",
    action: d.action,
    target: d.target ?? "",
    ip: d.ip ?? "",
  }));
}
