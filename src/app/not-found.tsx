import Link from "next/link";

export default function RootNotFound() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", color: "#1e40af" }}>
          404
        </h1>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
          Page Not Found
        </h2>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#1e40af",
            color: "white",
            borderRadius: "0.375rem",
            textDecoration: "none",
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
