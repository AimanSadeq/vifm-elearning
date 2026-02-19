import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-heading text-6xl font-bold text-brand-600">404</h1>
        <h2 className="font-heading text-2xl font-bold">Page Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
