import './DurationLegend.css';

const SAMPLES = [2, 5, 10];

export function DurationLegend() {
  return (
    <div className="duration-legend">
      <div className="duration-legend__title">工数（日数）</div>
      <div className="duration-legend__items">
        {SAMPLES.map(d => (
          <div key={d} className="duration-legend__item">
            <div
              className="duration-legend__swatch"
              style={{ width: 80 + d * 5, height: Math.max(2, d / 3) }}
            />
            <span>{d}日</span>
          </div>
        ))}
      </div>
      <div className="duration-legend__item duration-legend__item--critical">
        <span className="duration-legend__dot" />
        <span>クリティカルパス</span>
      </div>
    </div>
  );
}
