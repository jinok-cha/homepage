

import React, { useState } from 'react';
import Card from './Card';
import FinancialChart from './FinancialChart';
import { DetailedForecastDataRow, BarChartConfig } from '../types';
import { calculateInheritanceTax } from '../utils/financialCalculations';

const formatEokwon = (value: number | undefined) => {
    if (value === null || value === undefined || !isFinite(value)) return '-';
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 억원`;
}

const BoldBarLabel = (props: any) => {
  const { x, y, width, value, fill } = props;
  
  if (value === null || value === undefined || !isFinite(value)) return null;

  const formattedValue = value.toLocaleString(undefined, { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
  });
  
  return (
    <text x={x + width / 2} y={y} dy={-4} fill={fill} fontSize="14px" fontWeight="bold" textAnchor="middle">
      {formattedValue}
    </text>
  );
};


const RateToggle: React.FC<{
  label: string;
  rate: number;
  onRateChange: (rate: number) => void;
}> = ({ label, rate, onRateChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-slate-600 font-medium">{label}</label>
        <div className="flex items-center space-x-2">
            <button onClick={() => onRateChange(Math.max(0, rate - 0.5))} className="px-2 py-0.5 border rounded-md bg-white hover:bg-slate-100 transition-colors">-</button>
            <span className="w-16 text-center font-semibold text-slate-800">{rate.toFixed(1)} %</span>
            <button onClick={() => onRateChange(rate + 0.5)} className="px-2 py-0.5 border rounded-md bg-white hover:bg-slate-100 transition-colors">+</button>
        </div>
    </div>
);


interface FutureInheritanceTaxCardProps {
  detailedForecastData: DetailedForecastDataRow[];
  financialAssets: number;
  realEstate: number;
  deemedAssets: number;
  debt: number;
  hasSpouse: boolean;
  numChildren: number;
  financialAssetGrowthRate: number;
  setFinancialAssetGrowthRate: (rate: number) => void;
  realEstateGrowthRate: number;
  setRealEstateGrowthRate: (rate: number) => void;
  financialYears: string[];
}

const FutureInheritanceTaxCard: React.FC<FutureInheritanceTaxCardProps> = ({ 
  detailedForecastData,
  financialAssets,
  realEstate,
  deemedAssets,
  debt,
  hasSpouse,
  numChildren,
  financialAssetGrowthRate,
  setFinancialAssetGrowthRate,
  realEstateGrowthRate,
  setRealEstateGrowthRate,
  financialYears
}) => {
  const [showFutureDetails, setShowFutureDetails] = useState(false);
  const latestYear = financialYears.length > 0 ? Number(financialYears[financialYears.length - 1]) : new Date().getFullYear();

  const futureYears = [10, 20, 30];
  const futureSimulations = futureYears.map(year => {
    const yearStr = (latestYear + year).toString();
    const forecast = detailedForecastData.find(d => d.year === yearStr);
    
    const futureFinancialAssets = financialAssets * Math.pow(1 + financialAssetGrowthRate / 100, year);
    const futureRealEstate = realEstate * Math.pow(1 + realEstateGrowthRate / 100, year);
    const futureOtherAssets = futureFinancialAssets + futureRealEstate + deemedAssets;

    // Base Scenario
    const baseFutureStockValue = (forecast?.baseValuation ?? 0) / 10000;
    const baseFutureTotalInheritanceValue = baseFutureStockValue + futureOtherAssets - debt;
    const baseTaxResult = calculateInheritanceTax(baseFutureTotalInheritanceValue, futureFinancialAssets, hasSpouse, numChildren);

    // Adjusted Scenario
    const adjustedFutureStockValue = (forecast?.adjustedValuation ?? 0) / 10000;
    const adjustedFutureTotalInheritanceValue = adjustedFutureStockValue + futureOtherAssets - debt;
    const adjustedTaxResult = calculateInheritanceTax(adjustedFutureTotalInheritanceValue, futureFinancialAssets, hasSpouse, numChildren);
    
    return {
      yearLabel: `${year}년 후`,
      base: {
          stockValue: baseFutureStockValue,
          financialAssets: futureFinancialAssets,
          realEstate: futureRealEstate,
          totalValue: baseFutureTotalInheritanceValue,
          tax: baseTaxResult.taxAmount,
      },
      adjusted: {
          stockValue: adjustedFutureStockValue,
          financialAssets: futureFinancialAssets,
          realEstate: futureRealEstate,
          totalValue: adjustedFutureTotalInheritanceValue,
          tax: adjustedTaxResult.taxAmount,
      }
    };
  });

  const futureChartData = futureSimulations.map(sim => ({
    name: sim.yearLabel,
    '총 재산 (기본)': sim.base.totalValue,
    '총 재산 (적용시)': sim.adjusted.totalValue,
    '상속세 (기본)': sim.base.tax,
    '상속세 (적용시)': sim.adjusted.tax,
  }));

  const totalAssetsChartConfig: BarChartConfig = {
    data: futureChartData,
    chartType: 'bar',
    bars: [
      { dataKey: '총 재산 (기본)', name: '기본', fill: '#3b82f6', labelComponent: <BoldBarLabel /> },
      { dataKey: '총 재산 (적용시)', name: '적용시', fill: '#22c55e', labelComponent: <BoldBarLabel /> },
    ],
    unit: '억원', xAxisKey: 'name', height: 300,
    hideYAxis: true,
    hideGrid: true,
  };

  const taxAmountChartConfig: BarChartConfig = {
    data: futureChartData,
    chartType: 'bar',
    bars: [
      { dataKey: '상속세 (기본)', name: '기본', fill: '#3b82f6', labelComponent: <BoldBarLabel /> },
      { dataKey: '상속세 (적용시)', name: '적용시', fill: '#22c55e', labelComponent: <BoldBarLabel /> },
    ],
    unit: '억원', xAxisKey: 'name', height: 300,
    hideYAxis: true,
    hideGrid: true,
  };

  return (
    <Card>
      <div className="bg-slate-50 p-4 rounded-lg border">
        <h4 className="text-md font-semibold text-slate-700 mb-4">상속세 시뮬레이션 (미래 기준)</h4>
        
        <div className="space-y-3 text-sm mb-4 p-3 bg-white rounded-md border no-print">
          <RateToggle label="금융자산 연평균 상승률" rate={financialAssetGrowthRate} onRateChange={setFinancialAssetGrowthRate} />
          <RateToggle label="부동산 연평균 상승률" rate={realEstateGrowthRate} onRateChange={setRealEstateGrowthRate} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <h5 className="font-semibold text-center text-slate-600 mb-2">총 상속재산 비교</h5>
                <div className="h-[300px]"><FinancialChart config={totalAssetsChartConfig} /></div>
            </div>
            <div>
                <h5 className="font-semibold text-center text-slate-600 mb-2">예상 상속세 비교</h5>
                <div className="h-[300px]"><FinancialChart config={taxAmountChartConfig} /></div>
            </div>
        </div>

        <div className="mt-4">
          <button onClick={() => setShowFutureDetails(!showFutureDetails)} className="w-full text-left p-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue no-print" aria-expanded={showFutureDetails}>
            {showFutureDetails ? '▲ 상세 계산 과정 숨기기' : '▼ 상세 계산 과정 보기'}
          </button>
          {showFutureDetails && (
            <div className="mt-2 w-full overflow-x-auto">
              <table className="min-w-full text-xs bg-white border border-slate-200">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-2 border-b font-semibold text-left align-middle" rowSpan={2}>항목</th>
                    {futureSimulations.map(sim => (
                      <th key={sim.yearLabel} className="p-2 border-b font-semibold text-center align-middle" colSpan={2}>{sim.yearLabel}</th>
                    ))}
                  </tr>
                  <tr>
                    {futureSimulations.map(sim => (
                      <React.Fragment key={sim.yearLabel}>
                        <th className="p-2 border-b font-semibold text-right align-middle">기본</th>
                        <th className="p-2 border-b font-semibold text-right align-middle">적용시</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="hover:bg-slate-50"><td className="p-2 border-b font-medium align-middle">예상 주식가치</td>{futureSimulations.map(sim => <><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.base.stockValue)}</td><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.adjusted.stockValue)}</td></>)}</tr>
                  <tr className="hover:bg-slate-50"><td className="p-2 border-b font-medium align-middle">예상 금융자산</td>{futureSimulations.map(sim => <><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.base.financialAssets)}</td><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.adjusted.financialAssets)}</td></>)}</tr>
                  <tr className="hover:bg-slate-50"><td className="p-2 border-b font-medium align-middle">예상 부동산</td>{futureSimulations.map(sim => <><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.base.realEstate)}</td><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.adjusted.realEstate)}</td></>)}</tr>
                  <tr className="bg-slate-50 font-bold"><td className="p-2 border-b align-middle">총 상속재산</td>{futureSimulations.map(sim => <><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.base.totalValue)}</td><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.adjusted.totalValue)}</td></>)}</tr>
                  <tr className="bg-red-50 font-extrabold text-red-700"><td className="p-2 border-b align-middle">예상 상속세액</td>{futureSimulations.map(sim => <><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.base.tax)}</td><td className="p-2 border-b text-right align-middle">{formatEokwon(sim.adjusted.tax)}</td></>)}</tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4">* 본 계산은 상속세 및 증여세법에 따른 약식 계산이며, 실제 세액은 개별 상황에 따라 달라질 수 있습니다. (사전증여재산 등 미반영)</p>
    </Card>
  );
};

export default FutureInheritanceTaxCard;