import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-mono)",
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
        }}
      >
        404
      </p>
      <h1 style={{ marginBottom: "8px" }}>Not found.</h1>
      <Link
        href="/"
        style={{
          color: "var(--accent)",
          fontFamily: "var(--font-dm-mono)",
          fontSize: "11px",
          letterSpacing: "0.04em",
        }}
      >
        ← Back to the commons
      </Link>
    </div>
  );
}
