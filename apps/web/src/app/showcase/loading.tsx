export default function ShowcaseLoading() {
  return (
    <div
      className="sx-root"
      data-testid="showcase-loading"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "rgb(24 22 20)",
        color: "rgb(212 201 186)",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      <p style={{ margin: 0, letterSpacing: "0.04em", fontSize: "0.95rem" }}>Loading specimens…</p>
    </div>
  );
}
