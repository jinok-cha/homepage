import React from 'react';
import Card from './Card';
import { FinancialStatementRow } from '../types';

interface FinancialStatementCardProps {
  title: string;
  data: FinancialStatementRow[];
  incomeStatementData?: FinancialStatementRow[];
  showEmptyRows: boolean;
  hiddenRows: Set<string>;
  onToggleRowVisibility: (accountName: string) => void;
}

const FinancialStatementCard: React.FC<FinancialStatementCardProps> = ({ 
  title, 
  data, 
  incomeStatementData, 
  showEmptyRows, 
  hiddenRows,
  onToggleRowVisibility
}) => {

  const years = data.length > 0 ? Object.keys(data[0]).filter(key => !isNaN(Number(key))) as (keyof FinancialStatementRow)[] : [];
  years.sort();

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    // Value is already in '만원', just format it.
    return Math.round(value).toLocaleString();
  };
  
  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined || !isFinite(value)) return '-';
    return `${value.toFixed(1)}%`;
  }

  // Simple table for Cash Flow Statement
  const renderSimpleTable = () => (
    <table className="min-w-full text-sm financial-statement-table-print">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-2 text-left font-semibold text-slate-600 align-middle">계정과목</th>
          {years.map(year => (
            <th key={year} className="p-2 text-right font-semibold text-slate-600 align-middle">{year}</th>
          ))}
        </tr>
      </thead>
      <tbody className="text-slate-700">
        {data.map((row, index) => (
          <tr key={index} className={`border-t border-slate-200 ${row.isHeader ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
            <td className={`p-2 whitespace-pre align-middle ${row.isHeader ? 'font-bold' : ''}`}>{row['계정과목']}</td>
            {years.map(year => (
              <td key={year} className={`p-2 text-right align-middle ${row.isHeader ? 'font-bold' : ''}`}>
                {formatNumber(row[year] as number | null)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  
  const getAlignmentClass = (accountName: string): string => {
    if (typeof accountName !== 'string') return 'text-left';
    const indent = accountName.search(/\S|$/);
    if (indent === 0) {
      return 'text-left';
    }
    if (indent === 2) {
      return 'text-left pl-2';
    }
     if (indent === 4) {
      return 'text-left pl-4';
    }
     if (indent === 6) {
      return 'text-left pl-6';
    }
    return 'text-left';
  };

  // Detailed table for other statements
  const renderDetailedTable = () => {
    const assetTotalsRow = title === '재무상태표' ? data.find(row => row && typeof row['계정과목'] === 'string' && row['계정과목'].trim() === '자산') : null;
    const salesTotalsRow = (title === '손익계산서') 
        ? data.find(row => row && typeof row['계정과목'] === 'string' && row['계정과목'].trim() === '매출액') 
        : (title === '제조원가명세서' && incomeStatementData) 
          ? incomeStatementData.find(row => row && typeof row['계정과목'] === 'string' && row['계정과목'].trim() === '매출액') 
          : null;
    
    const displayedData = showEmptyRows
      ? data
      : data.filter(row => {
          if (!row) return false;
          // An empty row is one where all year values are null, undefined, or 0.
          // We want to KEEP rows that have at least one non-zero value.
          const hasValue = years.some(year => {
              const value = (row as any)[year];
              return value !== null && value !== undefined && value !== 0;
          });
          return hasValue;
        });

    const dataToRender = displayedData.filter(row => row && row['계정과목'] && !hiddenRows.has(row['계정과목']));

    const clickableHeaderAccounts = new Set([
      '무형자산',
      '기타비유동자산',
      '자본잉여금',
      '기타포괄손익누계액',
      '기타자본',
    ]);

    return (
      <table className="min-w-full text-sm financial-statement-table-print table-fixed">
        <thead className="bg-slate-50">
          <tr>
            <th rowSpan={2} className="p-2 text-left font-semibold text-slate-600 border-b border-slate-300 align-middle w-44">계정과목</th>
            {years.map((year, yearIndex) => (
              <th key={year} colSpan={yearIndex === 0 ? 2 : 3} className="p-2 text-center font-semibold text-slate-600 border-b border-l border-slate-300 align-middle">{year}</th>
            ))}
          </tr>
          <tr>
            {years.map((year, yearIndex) => (
                <React.Fragment key={year}>
                    <th className="p-2 text-right font-medium text-slate-500 border-b border-l border-slate-300 align-middle w-20">금액</th>
                    <th className="p-2 text-right font-medium text-slate-500 border-b border-slate-300 align-middle w-20">비율</th>
                    {yearIndex > 0 && <th className="p-2 text-right font-medium text-slate-500 border-b border-slate-300 align-middle w-20">증감율</th>}
                </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-700">
            {dataToRender.map((row, index) => {
              if (!row) return null; // Add safety check for row
              const accountName = row['계정과목'];
              const alignmentClass = getAlignmentClass(accountName);
              const isClickableToHide = !row.isHeader || (row.isHeader && clickableHeaderAccounts.has(accountName.trim()));
              
              return (
                 <tr key={index} className={`border-t border-slate-200 ${row.isHeader ? 'bg-slate-50' : ''}`}>
                    <td 
                      className={`p-2 whitespace-pre align-middle ${row.isHeader ? 'font-bold' : ''} ${alignmentClass} ${isClickableToHide ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                      onClick={isClickableToHide ? () => onToggleRowVisibility(accountName) : undefined}
                    >
                      {accountName}
                    </td>
                    {years.map((year, yearIndex) => {
                        const currentValue = (row as any)[year] as number | null;
                        
                        const totalValue = assetTotalsRow 
                          ? assetTotalsRow[year as keyof FinancialStatementRow] as number | null
                          : salesTotalsRow 
                              ? salesTotalsRow[year as keyof FinancialStatementRow] as number | null
                              : null;
                        
                        const ratio = totalValue && currentValue ? (currentValue / totalValue) * 100 : null;

                        let growth = null;
                        if (yearIndex > 0) {
                            const prevYear = years[yearIndex - 1];
                            const prevValue = prevYear ? (row as any)[prevYear] as number | null : null;
                            if (currentValue !== null && prevValue !== null && prevValue !== 0) {
                                growth = ((currentValue - prevValue) / Math.abs(prevValue)) * 100;
                            }
                        }
                        
                        return (
                             <React.Fragment key={year}>
                                <td className={`p-2 text-right border-l border-slate-200 align-middle ${row.isHeader ? 'font-bold' : ''}`}>
                                  {formatNumber(currentValue)}
                                </td>
                                <td className="p-2 text-right text-slate-500 align-middle">
                                  {formatPercentage(ratio)}
                                </td>
                                {yearIndex > 0 && (
                                    <td className="p-2 text-right text-slate-500 align-middle">
                                        {formatPercentage(growth)}
                                    </td>
                                )}
                            </React.Fragment>
                        )
                    })}
                 </tr>
              )
            })}
        </tbody>
      </table>
    )
  }

  const headerControls = (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-slate-500 font-normal">(단위 : 만원)</span>
    </div>
  );

  return (
    <Card title={title} headerRight={headerControls}>
      <div className="overflow-x-auto">
        {title === '현금흐름표' ? renderSimpleTable() : renderDetailedTable()}
      </div>
    </Card>
  );
};

export default FinancialStatementCard;
