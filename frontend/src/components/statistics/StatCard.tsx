import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  bgType?: 'gray' | 'orange' | 'green';
  valueColor?: string;
}

export function StatCard({
  title,
  value,
  unit,
  bgType = 'gray',
  valueColor,
}: StatCardProps): React.JSX.Element {
  const bgClass = `summary-card bg-${bgType}`;

  return (
    <div className={bgClass}>
      <span className="card-title">{title}</span>
      <h2 className="card-value" style={valueColor ? { color: valueColor } : undefined}>
        {value} {unit && <span className="unit">{unit}</span>}
      </h2>
    </div>
  );
}
