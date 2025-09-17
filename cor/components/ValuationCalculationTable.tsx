



import React, { useState } from 'react';
import { DetailedForecastDataRow } from '../types';

interface ValuationCalculationTableProps {
  data: DetailedForecastDataRow[];
}

const ValuationCalculationTable: React.FC<ValuationCalculationTableProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!data || data.length === 0) {
    return null;
  }

  const formatEokwon = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return '-';
    }
    return (value / 10000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center text-left p-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue no-print"
        aria-expanded={isOpen}
      >
        {isOpen ? '▲ 상세 계산 과정 숨기기' : '▼ 상세 계산 과정 보기'}
      </button>
      {isOpen && (
        <div className="mt-2 w-full overflow-x-auto">
          <table className="min-w-full text-xs bg-white border border-slate-200">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-2 border-b font-semibold text-center align-middle" rowSpan={2}>연도</th>
                <th className="p-2 border-b font-semibold text-center align-middle" colSpan={4}>기본 시나리오</th>
                <th className="p-2 border-b font-semibold text-center align-middle" colSpan={2}>조정 항목</th>
                <th className="p-2 border-b font-semibold text-center align-middle" colSpan={3}>비용/배당 적용시</th>
              </tr>
              <tr>
                <th className="p-2 border-b font-semibold text-right align-middle">매출액</th>
                <th className="p-2 border-b font-semibold text-right align-middle">순이익</th>
                <th className="p-2 border-b font-semibold text-right align-middle">순자산</th>
                <th className="p-2 border-b font-semibold text-right align-middle">주식가치</th>
                <th className="p-2 border-b font-semibold text-right align-middle">비용</th>
                <th className="p-2 border-b font-semibold text-right align-middle">배당</th>
                <th className="p-2 border-b font-semibold text-right align-middle">조정 순이익</th>
                <th className="p-2 border-b font-semibold text-right align-middle">조정 순자산</th>
                <th className="p-2 border-b font-semibold text-right align-middle">최종 주식가치</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {data.map((row) => (
                <tr key={row.year} className="hover:bg-slate-50">
                  <td className="p-2 border-b text-center font-medium align-middle">{row.year}</td>
                  <td className="p-2 border-b text-right align-middle">{formatEokwon(row.baseSales)}</td>
                  <td className="p-2 border-b text-right align-middle">{formatEokwon(row.baseNetIncome)}</td>
                  <td className="p-2 border-b text-right align-middle">{formatEokwon(row.baseNetAssets)}</td>
                  <td className="p-2 border-b text-right font-semibold text-blue-600 align-middle">{formatEokwon(row.baseValuation)}</td>
                  <td className="p-2 border-b text-right text-orange-600 align-middle">({formatEokwon(row.costs)})</td>
                  <td className="p-2 border-b text-right text-orange-600 align-middle">({formatEokwon(row.dividends)})</td>
                  <td className="p-2 border-b text-right align-middle">{formatEokwon(row.adjustedNetIncome)}</td>
                  <td className="p-2 border-b text-right align-middle">{formatEokwon(row.adjustedNetAssets)}</td>
                  <td className="p-2 border-b text-right font-semibold text-red-600 align-middle">{formatEokwon(row.adjustedValuation)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 text-slate-500">
                <tr>
                    <td colSpan={10} className="p-2 text-center">단위: 억원</td>
                </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default ValuationCalculationTable;