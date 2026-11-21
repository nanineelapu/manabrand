"use client";

/** Last-resort screen if the whole app fails to render (it replaces the root layout, so it brings its own <html>). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#000", color: "#fff", display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>ManaBrand</h1>
          <p style={{ opacity: 0.7, margin: "12px 0 20px" }}>Something went wrong on our side. Please try again.</p>
          <button onClick={reset} style={{ background: "#e0247a", color: "#fff", border: 0, borderRadius: 12, padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
