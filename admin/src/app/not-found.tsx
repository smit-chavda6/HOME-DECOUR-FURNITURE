import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-4 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Page not found</h1>
        <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4 hover:text-accent">
          Back to the dashboard
        </Link>
      </div>
    </main>
  );
}
