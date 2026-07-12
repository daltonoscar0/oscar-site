import now from "../data/now.json";

export default function NowBlock() {
  return (
    <section>
      <h2 className="section-label">Now</h2>
      <ul className="now-list">
        {now.items.map((item) => (
          <li key={item.key}>
            <span className="now-key">{item.key}</span>
            {Array.isArray(item.value) ? (
              <ul className="now-sublist">
                {item.value.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            ) : (
              <span>{item.value}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
