
import React from 'react';
import { Rating } from '../types';

interface RatingGaugeProps {
  label: string;
  rating: Rating;
}

const ratingConfig: { [key in Rating]: { value: number; color: string; textColor: string } } = {
  '최우수': { value: 100, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
  '우수': { value: 80, color: 'bg-green-500', textColor: 'text-green-500' },
  '양호': { value: 60, color: 'bg-sky-500', textColor: 'text-sky-500' },
  '보통': { value: 40, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  '미흡': { value: 20, color: 'bg-orange-500', textColor: 'text-orange-500' },
  '열위': { value: 10, color: 'bg-red-500', textColor: 'text-red-500' },
};

const RatingGauge: React.FC<RatingGaugeProps> = ({ label, rating }) => {
  const { value, color, textColor } = ratingConfig[rating];
  const circumference = 2 * Math.PI * 40; // 2 * pi * radius
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center space-y-2 h-full">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-slate-200"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
          />
          {/* Progress circle */}
          <circle
            className={textColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="52" className={`text-xl font-bold ${textColor}`} textAnchor="middle" alignmentBaseline="middle">
            {rating}
          </text>
        </svg>
      </div>
      <p className="text-slate-600 font-semibold text-center">{label}</p>
    </div>
  );
};

export default RatingGauge;