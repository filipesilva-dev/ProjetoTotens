import './BarChart.css';
export interface BarChartProps { values: number[]; highlight?: number[]; }
export function BarChart({ values, highlight = [] }: BarChartProps) {
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
