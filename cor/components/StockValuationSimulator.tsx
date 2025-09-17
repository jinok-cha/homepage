

import React, { useState, useEffect } from 'react';
import FinancialChart from './FinancialChart';
import { LineChartConfig, DetailedForecastDataRow, ChartLine, Shareholder } from '../types';
import ValuationCalculationTable from './ValuationCalculationTable';

interface SimulatorProps {
    numberOfShares: number;
    severancePayTotal?: number;
    salaryIncreaseAmount: string;
    onSalaryIncreaseAmountChange: (value: string) => void;
    salaryIncreaseStartPeriod: string;
    onSalaryIncreaseStartPeriodChange: (value: string) => void;
    salaryIncreaseEndPeriod: string;
    onSalaryIncreaseEndPeriodChange: (value: string) => void;
    isRealEstateHeavy: boolean;
    shareholders: Shareholder[];
    retirementPeriod: string;
    onRetirementPeriodChange: (value: string) => void;
    isCeoSalaryIncrease: boolean;
    onIsCeoSalaryIncreaseChange: (checked: boolean) => void;
    insuranceAmount: string;
    onInsuranceAmountChange: (value: string) => void;
    insuranceStartPeriod: string;
    onInsuranceStartPeriodChange: (value: string) => void;
    insuranceEndPeriod: string;
    onInsuranceEndPeriodChange: (value: string) => void;
    salesGrowthRate: number;
    onSalesGrowthRateChange: (value: number) => void;
    netProfitMarginRate: number;
    onNetProfitMarginRateChange: (value: number) => void;
    dividendAmount: string;
    onDividendAmountChange: (value: string) => void;
    dividendStartPeriod: string;
    onDividendStartPeriodChange: (value: string) => void;
    dividendEndPeriod: string;
    onDividendEndPeriodChange: (value: string) => void;
    financialYears: string[];
    detailedForecastData: DetailedForecastDataRow[];
}

const NumericInput: React.FC<{
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    className?: string;
}> = ({ value, onChange, disabled = false, className = '' }) => (
    <input 
        type="text"
        inputMode="numeric"
        value={value} 
        onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
        onFocus={e => { if (!disabled && e.target.value === '0') onChange(''); }}
        onBlur={e => { if (!disabled && e.target.value === '') onChange('0'); }}
        disabled={disabled}
        className={`w-full px-3 h-9 border border-slate-500 rounded-md text-sm bg-slate-700 text-white text-right focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:bg-slate-200 disabled:text-slate-500 ${className}`}
    />
);

const StockValuationSimulator: React.FC<SimulatorProps> = ({
    shareholders,
    severancePayTotal,
    salaryIncreaseAmount,
    onSalaryIncreaseAmountChange,
    salaryIncreaseStartPeriod,
    onSalaryIncreaseStartPeriodChange,
    salaryIncreaseEndPeriod,
    onSalaryIncreaseEndPeriodChange,
    retirementPeriod,
    onRetirementPeriodChange,
    isCeoSalaryIncrease,
    onIsCeoSalaryIncreaseChange,
    insuranceAmount,
    onInsuranceAmountChange,
    insuranceStartPeriod,
    onInsuranceStartPeriodChange,
    insuranceEndPeriod,
    onInsuranceEndPeriodChange,
    salesGrowthRate,
    onSalesGrowthRateChange,
    netProfitMarginRate,
    onNetProfitMarginRateChange,
    dividendAmount,
    onDividendAmountChange,
    dividendStartPeriod,
    onDividendStartPeriodChange,
    dividendEndPeriod,
    onDividendEndPeriodChange,
    financialYears,
    detailedForecastData,
}) => {
    const [lineChartData, setLineChartData] = useState<LineChartConfig | null>(null);
    const [simulatedValuation, setSimulatedValuation] = useState(0);
    const [simulatedValuationWithFactors, setSimulatedValuationWithFactors] = useState(0);

    const lastHistoricalYear = financialYears.length > 0 ? financialYears[financialYears.length - 1] : String(new Date().getFullYear() - 1);
    const forecastStartYear = Number(lastHistoricalYear) + 1;

    useEffect(() => {
        if (!detailedForecastData || detailedForecastData.length === 0 || financialYears.length === 0) {
            setLineChartData(null);
            return;
        }

        // Start chart from the last historical year.
        const chartDataSource = detailedForecastData.slice(financialYears.length - 1);

        // Set the displayed valuation for the first forecast year
        if (chartDataSource.length > 1) {
            const firstYearForecastData = chartDataSource[1]; // The first forecast data is the second item in the slice
            setSimulatedValuation(firstYearForecastData.baseValuation ?? 0);
            setSimulatedValuationWithFactors(firstYearForecastData.adjustedValuation ?? 0);
        } else {
            setSimulatedValuation(0);
            setSimulatedValuationWithFactors(0);
        }

        // Check for borrowed-name shareholder
        const borrowedNameShareholder = shareholders.find(s => s.relationship === '타인주주');
        const borrowedNameStake = borrowedNameShareholder ? (borrowedNameShareholder.stake ?? 0) / 100 : 0;

        const finalChartData = chartDataSource.map(d => ({
            year: d.year,
            '주식가치': d.baseValuation ?? 0,
            '비용/배당 적용시': d.adjustedValuation ?? 0,
            ...(borrowedNameShareholder && { '차명주식': (d.adjustedValuation ?? 0) * borrowedNameStake }),
        }));
        
        if (finalChartData.length > 0) {
            const factorsApplied = finalChartData.some(d => d['주식가치'] !== d['비용/배당 적용시']);

            const chartLines: ChartLine[] = [
                { dataKey: '주식가치', stroke: '#3b82f6', labelPosition: 'top' },
            ];

            if (factorsApplied) {
                chartLines.push({ dataKey: '비용/배당 적용시', stroke: '#22c55e', labelPosition: 'bottom' });
            }
            if (borrowedNameShareholder) {
                chartLines.push({ dataKey: '차명주식', stroke: '#ef4444', labelPosition: 'bottom' });
            }

            const forecastDataInEok = finalChartData.map(d => {
                const dataInEok: any = {
                    year: d.year,
                    '주식가치': d['주식가치'] / 10000,
                    '비용/배당 적용시': d['비용/배당 적용시'] / 10000,
                };
                if (borrowedNameShareholder && (d as any)['차명주식'] !== undefined) {
                    dataInEok['차명주식'] = (d as any)['차명주식'] / 10000;
                }
                return dataInEok;
            });

            const newLineChartData: LineChartConfig = {
                data: forecastDataInEok,
                chartType: 'line',
                lines: chartLines,
                unit: '억원',
                height: 405,
            };
            setLineChartData(newLineChartData);
        } else {
            setLineChartData(null);
        }

    }, [detailedForecastData, shareholders, financialYears]);


    return (
        <div className="flex flex-col h-full space-y-4">
            <div>
                <div className="text-sm text-slate-600 mb-4 space-y-1">
                    <p>향후 성장률과 수익률을 조정하여 미래의 주식 가치를 예측합니다.</p>
                    <p><strong><span className="text-brand-blue">{forecastStartYear}년 예상 주식가치 (기본):</span></strong> <span className="font-bold text-brand-blue text-lg">{Math.round(simulatedValuation / 10000).toLocaleString()}억원</span></p>
                    <p><strong><span className="text-red-500">{forecastStartYear}년 예상 주식가치 (적용):</span></strong> <span className="font-bold text-red-500 text-lg">{Math.round(simulatedValuationWithFactors / 10000).toLocaleString()}억원</span></p>
                </div>
                <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label htmlFor="salesGrowth" className="block text-sm font-medium text-slate-700 mb-1">
                                연평균 매출액 상승률
                            </label>
                            <div className="flex items-center space-x-3">
                                <input 
                                    id="salesGrowth" 
                                    type="range" 
                                    min="-10" 
                                    max="20" 
                                    step="0.5"
                                    value={salesGrowthRate} 
                                    onChange={(e) => onSalesGrowthRateChange(Number(e.target.value))} 
                                    onDoubleClick={() => onSalesGrowthRateChange(0)}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-blue" 
                                />
                                <span className="font-semibold text-slate-700 w-14 text-right">{salesGrowthRate.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="profitMargin" className="block text-sm font-medium text-slate-700 mb-1">
                                연평균 당기순이익률
                            </label>
                            <div className="flex items-center space-x-3">
                                <input 
                                    id="profitMargin" 
                                    type="range" 
                                    min="-10" 
                                    max="20" 
                                    step="0.5"
                                    value={netProfitMarginRate} 
                                    onChange={(e) => onNetProfitMarginRateChange(Number(e.target.value))} 
                                    onDoubleClick={() => onNetProfitMarginRateChange(0)}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-secondary" 
                                />
                                <span className="font-semibold text-slate-700 w-14 text-right">{netProfitMarginRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex-grow">
                {lineChartData ? <FinancialChart config={lineChartData} baseYearForTooltip={Number(lastHistoricalYear)} /> : <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>}
            </div>

            <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-3">추가 비용 및 자산 감소 시나리오</h4>
                 <div className="space-y-3">
                     <div className="grid grid-cols-11 gap-x-2 items-center text-xs text-slate-500 font-semibold mb-1 text-center">
                        <span className="col-span-4 text-left">항목</span>
                        <span className="col-span-2">적용 시작</span>
                        <span className="col-span-2">적용 종료</span>
                        <span className="col-span-3">금액</span>
                     </div>
                    
                    <div className="grid grid-cols-11 gap-x-2">
                        <div className="col-span-4 flex items-center h-full"><label className="text-sm text-slate-600 font-medium">배당 지급</label></div>
                        <div className="flex items-center space-x-1 col-span-2">
                            <NumericInput value={dividendStartPeriod} onChange={onDividendStartPeriodChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">년</span></div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-2">
                            <NumericInput value={dividendEndPeriod} onChange={onDividendEndPeriodChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">년</span></div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-3">
                            <NumericInput value={dividendAmount} onChange={onDividendAmountChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">만원</span></div>
                        </div>
                    </div>
                     <div className="grid grid-cols-11 gap-x-2">
                        <div className="col-span-4 flex items-center h-full"><label className="text-sm text-slate-600 font-medium">대표이사 퇴직시점</label></div>
                        <div className="flex items-center space-x-1 col-span-2">
                            <NumericInput value={retirementPeriod} onChange={onRetirementPeriodChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">년</span></div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-2">
                            <NumericInput value={''} onChange={() => {}} disabled={true} className="bg-slate-50 border-slate-200" />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-400">년</span></div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-3">
                            <NumericInput value={(severancePayTotal ?? 0).toLocaleString()} onChange={() => {}} disabled={true} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">만원</span></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-11 gap-x-2">
                        <div className="col-span-4 flex items-center justify-between h-full">
                           <label htmlFor="ceoSalaryIncreaseCheckbox" className="text-sm text-slate-600 font-medium">급여 인상</label>
                            <div className="flex items-center space-x-1 pr-2">
                                <input
                                    type="checkbox"
                                    id="ceoSalaryIncreaseCheckbox"
                                    checked={isCeoSalaryIncrease}
                                    onChange={(e) => onIsCeoSalaryIncreaseChange(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                                />
                                <label htmlFor="ceoSalaryIncreaseCheckbox" className="text-xs text-slate-500 cursor-pointer">대표이사</label>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-2">
                            <NumericInput value={salaryIncreaseStartPeriod} onChange={onSalaryIncreaseStartPeriodChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">년</span></div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-2">
                            <NumericInput value={salaryIncreaseEndPeriod} onChange={onSalaryIncreaseEndPeriodChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">년</span></div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-3">
                            <NumericInput value={salaryIncreaseAmount} onChange={onSalaryIncreaseAmountChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">만원</span></div>
                        </div>
                    </div>
                     <div className="grid grid-cols-11 gap-x-2">
                        <div className="col-span-4 flex items-center h-full"><label className="text-sm text-slate-600 font-medium">정기보험 가입</label></div>
                        <div className="flex items-center space-x-1 col-span-2">
                            <NumericInput value={insuranceStartPeriod} onChange={onInsuranceStartPeriodChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">년</span></div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-2">
                            <NumericInput value={insuranceEndPeriod} onChange={onInsuranceEndPeriodChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">년</span></div>
                        </div>
                        <div className="flex items-center space-x-1 col-span-3">
                            <NumericInput value={insuranceAmount} onChange={onInsuranceAmountChange} />
                            <div className="w-8 flex items-center justify-start"><span className="text-sm text-slate-700">만원</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <ValuationCalculationTable data={detailedForecastData} />
            </div>
        </div>
    );
};

export default StockValuationSimulator;