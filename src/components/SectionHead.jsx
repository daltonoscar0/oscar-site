export default function SectionHead({ n, title, children }) {
  return (
    <header className="shead">
      <span className="shead-n">{n}</span>
      <h2 className="shead-title">{title}</h2>
      {children && <div className="shead-side">{children}</div>}
    </header>
  );
}
