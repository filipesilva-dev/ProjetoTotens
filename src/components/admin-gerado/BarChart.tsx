import './BarChart.css';
export function BarChart({ values, highlight = [] }: { values: number[]; highlight?: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="bchart">
      {values.map((v, i) => (
        <div key={i} className={`bchart__bar ${highlight.includes(i) ? 'bchart__bar--hi' : ''}`}
          style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}
