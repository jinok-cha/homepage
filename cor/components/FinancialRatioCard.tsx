

import React, { useState } from 'react';
import Card from './Card';

interface Metric {
  name: string;
  values: { year: string; value: number | null }[];
  unit: string;
}

interface FinancialRatioCardProps {
  title: string;
  metrics: Metric[];
}

const FinancialRatioCard: React.FC<FinancialRatioCardProps> = ({ title, metrics }) => {
    const [hideEmpty, setHideEmpty] = useState(false);
    
    if (!metrics || metrics.length === 0) {
        return <Card title={title}><div className="text-slate-500">데이터가 없습니다.</div></Card>;
    }
    
    const years = metrics[0]?.values.map(v => v.year) ?? [];

    const formatValue = (value: number | null, unit: string) => {
        if (value === null || value === undefined || !isFinite(value)) return '-';
        const displayUnit = unit.trim() === '%' ? unit : ` ${unit}`;
        return `${value.toFixed(2)}${displayUnit}`;
    };

    const filteredMetrics = hideEmpty
        ? metrics.filter(metric => metric.values.some(v => v.value !== null))
        : metrics;

    const headerRight = (
      <button
        onClick={() => setHideEmpty(!hideEmpty)}
        className="px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue no-print"
      >
        {hideEmpty ? '모든 항목 보기' : '값 없는 항목 숨기기'}
      </button>
    );

    return (
        <Card title={title} headerRight={headerRight}>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="border-b-2 border-slate-200">
                        <tr className="text-left text-xs text-slate-500">
                            <th className="p-2 font-semibold">지표</th>
                            {years.map(year => (
                                <th key={year} className="p-2 font-semibold text-right">{year}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {filteredMetrics.map(metric => (
                            <tr key={metric.name} className="border-t border-slate-200">
                                <td className="p-2 font-medium">{metric.name}</td>
                                {metric.values.map(dataPoint => (
                                    <td key={dataPoint.year} className="p-2 text-right tabular-nums">
                                        {formatValue(dataPoint.value, metric.unit)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default FinancialRatioCard;