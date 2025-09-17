
import React from 'react';
import { DiagnosisMetric, Rating } from '../types';

interface DiagnosisDetailsProps {
  title: string;
  rating: Rating;
  metrics: DiagnosisMetric[];
}

const TrendArrow: React.FC<{ trend: 'up' | 'down' }> = ({ trend }) => {
  const isUp = trend === 'up';
  const color = isUp ? 'text-green-500' : 'text-red-500';
  const arrow = isUp ? '▲' : '▼';
  return <span className={`ml-1 ${color}`}>{arrow}</span>;
};

const FinancialDiagnosisDetailCard: React.FC<DiagnosisDetailsProps> = ({ title, rating, metrics }) => {
  const ratingConfig: { [key in Rating]: { textColor: string } } = {
    '최우수': { textColor: 'text-emerald-500' },
    '우수': { textColor: 'text-green-500' },
    '양호': { textColor: 'text-sky-500' },
    '보통': { textColor: 'text-yellow-500' },
    '미흡': { textColor: 'text-orange-500' },
    '열위': { textColor: 'text-red-500' },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-slate-700">{title}</h4>
        <span className={`font-bold ${ratingConfig[rating].textColor}`}>{rating}</span>
      </div>
      <ul className="space-y-2 text-sm flex-grow">
        {metrics.map((metric) => (
          <li key={metric.name} className="flex justify-between items-baseline">
            <span className="text-slate-600">{metric.name}</span>
            <div className="text-right">
              <span className="font-semibold text-slate-800">
                {metric.value.toLocaleString()}{metric.unit}
                <TrendArrow trend={metric.trend} />
              </span>
              <p className="text-xs text-slate-500">
                업종평균: {metric.average.toLocaleString()}{metric.unit}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FinancialDiagnosisDetailCard;