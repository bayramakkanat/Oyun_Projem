export default function StarField() {
  const stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
    });
  }
  return (
    <div className="stars">
      {stars.map((style, i) => (
        <div key={i} className="star" style={style}></div>
      ))}
    </div>
  );
}
