import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as initialDataRaw from './constants/companyData';
import { calculateFinancialRatios, calculateStockValuation } from './utils/financialCalculations';
import Header from './components/Header';
import Footer from './components/Footer';
import InfoCard from './components/InfoCard';
import Card from './components/Card';
import FinancialChart from './components/FinancialChart';
import RatingGauge from './components/RatingGauge';
import StockValuationSimulator from './components/StockValuationSimulator';
import SeverancePaySimulator from './components/SeverancePaySimulator';
import FinancialStatementCard from './components/FinancialStatementCard';
import CombinedRatioCard from './components/CombinedRatioCard';
import InheritanceTaxCard from './components/InheritanceTaxCard';
import FutureInheritanceTaxCard from './components/ExecutiveInfoCard';
import { BarChartConfig, LineChartConfig, ComboChartConfig, Executive, Shareholder, RadarChartConfig, DetailedForecastDataRow, FinancialYearData, FinancialStatementRow } from './types';

// Processing initial data to treat units as '백만원' and convert to '만원' for consistency.
const initialData = (() => {
    const data = JSON.parse(JSON.stringify(initialDataRaw));
    const keysToProcess = [
        'summaryBalanceSheet', 'summaryIncomeStatement', 'summaryCashFlow',
        'balanceSheet', 'incomeStatement', 'statementOfCostOfGoodsManufactured', 'cashFlowStatement'
    ];
    keysToProcess.forEach(key => {
        if (Array.isArray(data[key])) {
            data[key] = data[key].map((row: any) => {
                const newRow = { ...row };
                for (const prop in newRow) {
                    if (typeof newRow[prop] === 'number' && prop !== 'year' && !prop.includes('stake') && !prop.includes('shares')) {
                        newRow[prop] *= 100; // 백만원 -> 만원
                    }
                }
                return newRow;
            });
        }
    });
    return data;
})();


// Helper to safely get a value from summary data arrays
// FIX: Refactored to improve type inference by checking for the existence of `yearData` before accessing its properties. This resolves a potential type error where `yearData[field]` was not being correctly narrowed to `number`.
const getSummaryValueByYear = (summaryData: FinancialYearData[], year: string | null, field: string): number | null => {
    if (!Array.isArray(summaryData) || year === null) {
        return null;
    }
    const yearData = summaryData.find(d => d && typeof d === 'object' && d.year === year);
    if (yearData) {
        const value = yearData[field];
        if (typeof value === 'number') {
            return value;
        }
    }
    return null;
};

const App: React.FC = () => {
    // Main state for all company data, sanitized on initial load.
    const [allData, setAllData] = useState<any>(initialData);
    
    // Destructure data from the main state object for easier access.
    // Provide default empty arrays to prevent crashes if data is malformed.
    const { 
        companyProfile, 
        summaryBalanceSheet = [], 
        summaryIncomeStatement = [], 
        industryComparisonData = [],
        relatedCompanies = [],
        balanceSheet = [],
        incomeStatement = [],
        cashFlowStatement = [],
        statementOfCostOfGoodsManufactured = []
    } = allData;

    const financialYears = useMemo(() => {
        if (!balanceSheet || balanceSheet.length === 0) {
            return [];
        }
        const yearSet = new Set<string>();
        balanceSheet.forEach(row => {
            Object.keys(row).forEach(key => {
                if (!isNaN(Number(key))) {
                    yearSet.add(key);
                }
            });
        });
        return Array.from(yearSet).sort();
    }, [balanceSheet]);

    const [expectedNetIncome, setExpectedNetIncome] = useState<string>('');
    const [expectedDividend, setExpectedDividend] = useState<string>('');
    const [isRealEstateHeavy, setIsRealEstateHeavy] = useState(false);
    
    const [executivesData, setExecutivesData] = useState<Executive[]>(allData.executives || []);
    const [shareholdersData, setShareholdersData] = useState<Shareholder[]>(allData.shareholders || []);

    const [activeStatement, setActiveStatement] = useState('balanceSheet');
    const [showEmptyFinancialStatementRows, setShowEmptyFinancialStatementRows] = useState(true);
    const [hiddenStatementRows, setHiddenStatementRows] = useState<{ [key: string]: Set<string> }>({
        balanceSheet: new Set(),
        incomeStatement: new Set(),
        costOfGoods: new Set(),
        cashFlow: new Set(),
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfRenderMode, setPdfRenderMode] = useState(false);

    useEffect(() => {
        setExecutivesData(allData.executives || []);
        setShareholdersData(allData.shareholders || []);
    }, [allData]);
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result;
                    if (typeof content === 'string') {
                        const jsonData = JSON.parse(content);
                        if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
                            // Scale down financial statement values.
                             const keysToProcess = [
                                'summaryBalanceSheet', 'summaryIncomeStatement', 'summaryCashFlow',
                                'balanceSheet', 'incomeStatement', 'statementOfCostOfGoodsManufactured', 'cashFlowStatement'
                            ];
                            
                            keysToProcess.forEach(key => {
                                if (Array.isArray(jsonData[key])) {
                                    jsonData[key] = jsonData[key].map((row: any) => {
                                        const newRow = { ...row };
                                        for (const prop in newRow) {
                                            if (typeof newRow[prop] === 'number' && prop !== 'year' && !prop.includes('stake') && !prop.includes('shares')) {
                                                newRow[prop] /= 10; // 천원 -> 만원
                                            }
                                        }
                                        return newRow;
                                    });
                                }
                            });

                            setAllData(jsonData);
                            alert("데이터를 성공적으로 불러왔습니다.");
                        } else {
                            throw new Error("JSON 파일은 단일 객체를 포함해야 합니다.");
                        }
                    }
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("유효하지 않은 JSON 파일입니다. 파일 형식을 확인해주세요.");
                } finally {
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        }
    };

    const handleDataDownload = () => {
        try {
            const dataToDownload = { ...allData, executives: executivesData, shareholders: shareholdersData };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(dataToDownload, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = "company-data.json";
            link.click();
        } catch (error) {
            console.error("Error generating JSON for download:", error);
            alert("데이터를 다운로드하는 중 오류가 발생했습니다.");
        }
    };

    const handlePdfSave = () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setPdfRenderMode(true);
    };

    useEffect(() => {
        const generatePdf = async () => {
            const reportElements = document.querySelectorAll('.print-section') as NodeListOf<HTMLElement>;
            if (reportElements.length === 0) {
                setIsGenerating(false);
                setPdfRenderMode(false);
                return;
            }

            const pageWidth = 210;
            const pageHeight = 297;
            const topMargin = 5; // 0.5cm in mm
            const bottomMargin = 20;
            const horizontalMargin = 5; // 0.5cm in mm
            
            const contentWidth = pageWidth - (horizontalMargin * 2);
            
            const doc = new jsPDF('p', 'mm', 'a4');
            let yPosition = topMargin;

            for (const element of Array.from(reportElements)) {
                const noPrintElements = element.querySelectorAll('.no-print') as NodeListOf<HTMLElement>;
                noPrintElements.forEach(el => el.style.display = 'none');

                try {
                    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = canvas.width;
                    const imgHeight = canvas.height;
                    const scaledHeight = (imgHeight * contentWidth) / imgWidth;

                    if (yPosition + scaledHeight > pageHeight - bottomMargin && yPosition > topMargin) {
                        doc.addPage();
                        yPosition = topMargin;
                    }

                    doc.addImage(imgData, 'PNG', horizontalMargin, yPosition, contentWidth, scaledHeight);
                    yPosition += scaledHeight + 10;

                } catch (error) {
                    console.error("Error generating canvas for element:", element, error);
                } finally {
                    noPrintElements.forEach(el => el.style.display = '');
                }
            }
            
            const today = new Date();
            const year = today.getFullYear().toString().slice(-2);
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const dateString = `${year}${month}${day}`;

            const companyName = companyProfile?.기업명 || '기업';
            const filename = `${companyName}_기업종합보고서_${dateString}.pdf`;

            doc.save(filename);
            
            setIsGenerating(false);
            setPdfRenderMode(false);
        };

        if (pdfRenderMode) {
            setTimeout(generatePdf, 100);
        }
    }, [pdfRenderMode, companyProfile]);

    // Correctly recalculate financial ratios when underlying data changes.
    const financialRatiosData = useMemo(() => calculateFinancialRatios(balanceSheet, incomeStatement, financialYears), [balanceSheet, incomeStatement, financialYears]);

    const safeParseInt = (value: string | number) => parseInt(String(value).replace(/,/g, ''), 10);
    const safeParseFloat = (value: string | number) => parseFloat(String(value).replace(/,/g, ''));

    const handleExecutiveChange = (index: number, field: keyof Executive, value: string | number) => {
        const updatedExecutives = [...executivesData];
        const executiveToUpdate = { ...updatedExecutives[index] };
        
        if (field === 'annualSalary') {
            const numValue = safeParseInt(value);
            (executiveToUpdate as any)[field] = isNaN(numValue) ? undefined : numValue;
        } else {
            (executiveToUpdate as any)[field] = value;
        }

        updatedExecutives[index] = executiveToUpdate;
        setExecutivesData(updatedExecutives);
    };

    const handleAddExecutive = () => {
        setExecutivesData(prev => [...prev, { name: '', title: '', tenure: '', relationship: '' }]);
    };

    const handleShareholderChange = (index: number, field: keyof Shareholder, value: string | number) => {
        const updatedShareholders = [...shareholdersData];
        const shareholderToUpdate = { ...updatedShareholders[index] };
        
        if (field === 'shares') {
             const numValue = safeParseInt(value);
            (shareholderToUpdate as any)[field] = isNaN(numValue) ? undefined : numValue;
        } else if (field === 'stake') {
            const numValue = safeParseFloat(value);
            (shareholderToUpdate as any)[field] = isNaN(numValue) ? undefined : numValue;
        } else {
            (shareholderToUpdate as any)[field] = value;
        }
        
        updatedShareholders[index] = shareholderToUpdate;
        setShareholdersData(updatedShareholders);
    };

    const handleAddShareholder = () => {
        setShareholdersData(prev => [...prev, { name: '', relationship: '', shares: undefined, stake: undefined }]);
    };

    const handleHideStatementRow = (statementKey: string, accountName: string) => {
        setHiddenStatementRows(prev => ({
            ...prev,
            [statementKey]: new Set(prev[statementKey]).add(accountName)
        }));
    };

    const handleToggleAndResetHiddenRows = () => {
        if (!showEmptyFinancialStatementRows) {
            setHiddenStatementRows(prev => ({
                ...prev,
                [activeStatement]: new Set(),
            }));
        }
        setShowEmptyFinancialStatementRows(prev => !prev);
    };

    const [avgSalary, setAvgSalary] = useState<string>('12000');
    const [currentYearsOfService, setCurrentYearsOfService] = useState<string>('7');
    const [multiplier, setMultiplier] = useState<string>('3');
    const [salaryIncreaseAmount, setSalaryIncreaseAmount] = useState<string>('0');
    const [salaryIncreaseStartPeriod, setSalaryIncreaseStartPeriod] = useState<string>('0');
    const [salaryIncreaseEndPeriod, setSalaryIncreaseEndPeriod] = useState<string>('0');
    const [isCeoSalaryIncrease, setIsCeoSalaryIncrease] = useState<boolean>(false);
    const [retirementPeriod, setRetirementPeriod] = useState<string>('10');
    const [insuranceAmount, setInsuranceAmount] = useState<string>('0');
    const [insuranceStartPeriod, setInsuranceStartPeriod] = useState<string>('0');
    const [insuranceEndPeriod, setInsuranceEndPeriod] = useState<string>('0');

    const [salesGrowthRate, setSalesGrowthRate] = useState(0);
    const [netProfitMarginRate, setNetProfitMarginRate] = useState(0);
    const [dividendAmount, setDividendAmount] = useState('0');
    const [dividendStartPeriod, setDividendStartPeriod] = useState('0');
    const [dividendEndPeriod, setDividendEndPeriod] = useState('0');

    const [financialAssets, setFinancialAssets] = useState(0);
    const [realEstate, setRealEstate] = useState(0);
    const [deemedAssets, setDeemedAssets] = useState(0);
    const [debt, setDebt] = useState(0);
    const [hasSpouse, setHasSpouse] = useState(true);
    const [numChildren, setNumChildren] = useState(1);
    const [financialAssetGrowthRate, setFinancialAssetGrowthRate] = useState(2.0);
    const [realEstateGrowthRate, setRealEstateGrowthRate] = useState(3.0);

    const { severancePayTotal, severancePayForCard } = useMemo(() => {
        const salaryNum = Number(avgSalary) || 0;
        const currentYearsNum = Number(currentYearsOfService) || 0;
        const multiplierNum = Number(multiplier) || 0;
        const retirementPeriodNum = Number(retirementPeriod) || 0;
        const salaryIncreaseAmountNum = Number(salaryIncreaseAmount) || 0;

        const calculatedPayForCard = salaryNum * 0.1 * currentYearsNum * multiplierNum;
        const finalPayForCard = Math.round(calculatedPayForCard);

        const adjustedAvgSalary = isCeoSalaryIncrease ? salaryNum + salaryIncreaseAmountNum : salaryNum;
        const finalYearsOfService = currentYearsNum + retirementPeriodNum;
        const calculatedPayForSimulation = adjustedAvgSalary * 0.1 * finalYearsOfService * multiplierNum;
        const finalPayForSimulation = Math.round(calculatedPayForSimulation);

        return { severancePayForCard: finalPayForCard, severancePayTotal: finalPayForSimulation };
    }, [avgSalary, currentYearsOfService, multiplier, retirementPeriod, salaryIncreaseAmount, isCeoSalaryIncrease]);

    // Helper to safely get a value from detailed financial statements
    const getDetailedValueByYear = (statement: FinancialStatementRow[], account: string, year: string | null): number | null => {
        if (!Array.isArray(statement) || year === null) {
            return null;
        }
        const row = statement.find(r => r && typeof r['계정과목'] === 'string' && r['계정과목'].trim() === account);
        if (row) {
            const value = row[year];
            if (typeof value === 'number') {
                return value;
            }
        }
        return null;
    };
    
    const { totalFinalValuation, totalNetIncomeValue, totalNetAssetValue } = useMemo(() => {
        if (financialYears.length < 3) return { totalFinalValuation: 0, totalNetIncomeValue: 0, totalNetAssetValue: 0 };
        const latestYear = financialYears[financialYears.length - 1];
        const prevYear1 = financialYears[financialYears.length - 2];
        const prevYear2 = financialYears[financialYears.length - 3];

        const netAssetValue = getDetailedValueByYear(balanceSheet, '자본', latestYear) ?? 0;
        const netIncomeLatest = getDetailedValueByYear(incomeStatement, '당기순이익', latestYear) ?? 0;
        const netIncomePrev1 = getDetailedValueByYear(incomeStatement, '당기순이익', prevYear1) ?? 0;
        const netIncomePrev2 = getDetailedValueByYear(incomeStatement, '당기순이익', prevYear2) ?? 0;

        const weightedAvgNetIncome = (netIncomeLatest * 3 + netIncomePrev1 * 2 + netIncomePrev2 * 1) / 6;
        let netIncomeValue = Math.round(weightedAvgNetIncome / 0.10);
        if (netIncomeValue < 0) netIncomeValue = 0;

        const weights = isRealEstateHeavy ? { income: 2, asset: 3 } : { income: 3, asset: 2 };
        let finalValuation = Math.round(((netIncomeValue * weights.income) + (netAssetValue * weights.asset)) / 5);
        if (finalValuation < 0) finalValuation = 0;

        const eightyPercentNetAsset = Math.round(netAssetValue * 0.8);
        if (finalValuation < eightyPercentNetAsset) {
            finalValuation = eightyPercentNetAsset;
        }

        return { totalFinalValuation: finalValuation, totalNetIncomeValue: netIncomeValue, totalNetAssetValue: netAssetValue };
    }, [incomeStatement, balanceSheet, isRealEstateHeavy, financialYears]);
    
    const combinedFinancialData = useMemo(() => summaryBalanceSheet.map(bs => {
        const isData = summaryIncomeStatement.find(is => is.year === bs.year);
        return { ...bs, ...isData };
    }), [summaryBalanceSheet, summaryIncomeStatement]);

    const financialPerformanceData: ComboChartConfig = {
        data: combinedFinancialData.map(d => ({
            ...d,
            자산총계: (d.자산총계 as number) / 100, // to 백만원 for chart
            자본총계: (d.자본총계 as number) / 100, // to 백만원 for chart
            매출액: (d.매출액 as number) / 100, // to 백만원 for chart
            영업이익: (d.영업이익 as number) / 100, // to 백만원 for chart
        })),
        chartType: 'combo',
        bars: [
            { dataKey: '자산총계', fill: '#3b82f6' },
            { dataKey: '자본총계', fill: '#22c55e' }
        ],
        lines: [
            { dataKey: '매출액', stroke: '#f97316' },
            { dataKey: '영업이익', stroke: '#a855f7' }
        ],
        unit: '백만원',
    };
    
    const industryRadarChartConfig: RadarChartConfig = {
        data: industryComparisonData.map(d => ({
            ...d,
            company: (d.company as number) * 100, // to 만원
            average: (d.average as number) * 100, // to 만원
            top25: (d.top25 as number) * 100, // to 만원
        })),
        chartType: 'radar',
        polarKey: 'metric',
        radars: [
            { name: '조회기업', dataKey: 'company', stroke: '#3b82f6', fill: '#3b82f6' },
            { name: '업계평균', dataKey: 'average', stroke: '#22c55e', fill: '#22c55e' },
            { name: '상위25%', dataKey: 'top25', stroke: '#a855f7', fill: '#a855f7' },
        ],
    };

    const stockValuationChartData: BarChartConfig = {
        data: [{
            name: '주식가치',
            '순손익가치': totalNetIncomeValue / 10000,
            '순자산가치': totalNetAssetValue / 10000,
            '주식가치': totalFinalValuation / 10000,
        }],
        chartType: 'bar',
        bars: [
            { dataKey: '순자산가치', fill: '#82ca9d' },
            { dataKey: '순손익가치', fill: '#8884d8' },
            { dataKey: '주식가치', fill: '#ffc658' },
        ],
        unit: '억원',
        xAxisKey: 'name'
    };

    const { simulatedFinalValuation, simulationChartData } = useMemo(() => {
        const expectedNetIncomeNumManwon = safeParseInt(expectedNetIncome) || 0;
        const expectedDividendNumManwon = safeParseInt(expectedDividend) || 0;
        
        const latestYear = financialYears.length > 0 ? financialYears[financialYears.length - 1] : null;
        const prevYear1 = financialYears.length > 1 ? financialYears[financialYears.length - 2] : null;

        const netIncomeLatest = latestYear ? getDetailedValueByYear(incomeStatement, '당기순이익', latestYear) ?? 0 : 0;
        const netIncomePrev1 = prevYear1 ? getDetailedValueByYear(incomeStatement, '당기순이익', prevYear1) ?? 0 : 0;
        
        const simulatedWeightedAvgNetIncome = (expectedNetIncomeNumManwon * 3 + netIncomeLatest * 2 + netIncomePrev1 * 1) / 6;
        let simulatedNetIncomeValue = Math.round(simulatedWeightedAvgNetIncome / 0.10);
        if (simulatedNetIncomeValue < 0) simulatedNetIncomeValue = 0;

        const simulatedNetAssetValue = totalNetAssetValue + expectedNetIncomeNumManwon - expectedDividendNumManwon;
        
        const weights = isRealEstateHeavy ? { income: 2, asset: 3 } : { income: 3, asset: 2 };
        let finalValuation = Math.round(((simulatedNetIncomeValue * weights.income) + (simulatedNetAssetValue * weights.asset)) / 5);
        if (finalValuation < 0) finalValuation = 0;
        
        const simulatedEightyPercentNetAsset = Math.round(simulatedNetAssetValue * 0.8);
        if (finalValuation < simulatedEightyPercentNetAsset) {
            finalValuation = simulatedEightyPercentNetAsset;
        }
        
        const forecastYear = latestYear ? Number(latestYear) + 1 : new Date().getFullYear();

        const chartData: BarChartConfig = {
            data: [{
                name: `${forecastYear}년 예상가치`,
                '순손익가치': (simulatedNetIncomeValue > 0 ? simulatedNetIncomeValue : 0) / 10000,
                '순자산가치': (simulatedNetAssetValue > 0 ? simulatedNetAssetValue : 0) / 10000,
                '주식가치': (finalValuation > 0 ? finalValuation : 0) / 10000,
            }],
            chartType: 'bar',
            bars: [
                { dataKey: '순자산가치', fill: '#82ca9d' },
                { dataKey: '순손익가치', fill: '#8884d8' },
                { dataKey: '주식가치', fill: '#ffc658' },
            ],
            unit: '억원',
            xAxisKey: 'name'
        };

        return { simulatedFinalValuation: finalValuation, simulationChartData: chartData };
    }, [expectedNetIncome, expectedDividend, incomeStatement, totalNetAssetValue, isRealEstateHeavy, financialYears]);
    
    
    const formatNumber = (value: string) => {
        if (value.trim() === '') return '';
        const num = parseInt(value.replace(/,/g, ''), 10);
        return isNaN(num) ? '' : num.toLocaleString();
    };

    // Safe formatting helper for display
    const formatSummaryValueForDisplay = (value: number | null) => {
        if (value === null) return '-';
        return Math.round(value).toLocaleString();
    };

    const formatEokwonForDisplay = (value: number | null) => {
        if (value === null) return '-';
        const valueInEok = value / 10000;
        return valueInEok.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    const showSimulationChart = expectedNetIncome.trim() !== '' || expectedDividend.trim() !== '';

    const transformDataForChart = (metrics: any[]): any[] => {
      if (!metrics || metrics.length === 0) {
        return [];
      }
    
      const dataByYear: { [year: string]: { year: string, [key: string]: any } } = {};

      for (const metric of metrics) {
        for (const dataPoint of metric.values) {
            const { year, value } = dataPoint;
            if (!dataByYear[year]) {
                dataByYear[year] = { year };
            }
            if (metric.name === '이자보상배수' && typeof value === 'number') {
                dataByYear[year][metric.name] = value * 100;
            } else {
                dataByYear[year][metric.name] = value;
            }
        }
      }
    
      const chartData = Object.values(dataByYear).sort((a, b) => a.year.localeCompare(b.year));
      
      return chartData;
    };
    
    const stabilityChartData = transformDataForChart(financialRatiosData.stability);
    const ratioLineColors = ['#3b82f6', '#22c55e', '#ef4444'];

    const stabilityChartConfig: LineChartConfig = {
        data: stabilityChartData,
        chartType: 'line',
        lines: financialRatiosData.stability.map((m, i) => ({ dataKey: m.name, stroke: ratioLineColors[i % ratioLineColors.length] })),
        unit: '%',
        hideYAxis: true,
        showDataLabels: false,
    };
    const profitabilityChartConfig: LineChartConfig = {
        data: transformDataForChart(financialRatiosData.profitability),
        chartType: 'line',
        lines: financialRatiosData.profitability.map((m, i) => ({ dataKey: m.name, stroke: ratioLineColors[i % ratioLineColors.length] })),
        unit: '%',
        hideYAxis: true,
        showDataLabels: false,
    };
    const activityChartConfig: LineChartConfig = {
        data: transformDataForChart(financialRatiosData.activity),
        chartType: 'line',
        lines: financialRatiosData.activity.map((m, i) => ({ dataKey: m.name, stroke: ratioLineColors[i % ratioLineColors.length] })),
        unit: '회',
        hideYAxis: true,
        showDataLabels: false,
    };
    const growthChartConfig: LineChartConfig = {
        data: transformDataForChart(financialRatiosData.growth),
        chartType: 'line',
        lines: financialRatiosData.growth.map((m, i) => ({ dataKey: m.name, stroke: ratioLineColors[i % ratioLineColors.length] })),
        unit: '%',
        hideYAxis: true,
        showDataLabels: false,
    };

    const detailedForecastData = useMemo<DetailedForecastDataRow[]>(() => {
        if (financialYears.length === 0) return [];
        const ensureNumber = (val: any) => (typeof val === 'number' && isFinite(val) ? val : 0);
        
        const dividendStartPeriodNum = ensureNumber(safeParseInt(dividendStartPeriod));
        const dividendEndPeriodNum = ensureNumber(safeParseInt(dividendEndPeriod));
        const salaryIncreaseStartPeriodNum = ensureNumber(safeParseInt(salaryIncreaseStartPeriod));
        const salaryIncreaseEndPeriodNum = ensureNumber(safeParseInt(salaryIncreaseEndPeriod));
        const insuranceStartPeriodNum = ensureNumber(safeParseInt(insuranceStartPeriod));
        const insuranceEndPeriodNum = ensureNumber(safeParseInt(insuranceEndPeriod));
        const retirementPeriodNum = ensureNumber(safeParseInt(retirementPeriod));
        
        const dividendAmountNum = ensureNumber(safeParseInt(dividendAmount));
        const salaryIncreaseAmountNum = ensureNumber(safeParseInt(salaryIncreaseAmount));
        const insuranceAmountNum = ensureNumber(safeParseInt(insuranceAmount));

        const sales: { [year: string]: number } = {};
        const netIncomes: { [year: string]: number } = {};
        const netAssets: { [year: string]: number } = {};
        
        const netIncomesWithFactors: { [year: string]: number } = {};
        const netAssetsWithFactors: { [year: string]: number } = {};

        financialYears.forEach(year => {
            sales[year] = ensureNumber(getDetailedValueByYear(incomeStatement, '매출액', year));
            const netIncome = ensureNumber(getDetailedValueByYear(incomeStatement, '당기순이익', year));
            netIncomes[year] = netIncome;
            netIncomesWithFactors[year] = netIncome;
            const netAsset = ensureNumber(getDetailedValueByYear(balanceSheet, '자본', year));
            netAssets[year] = netAsset;
            netAssetsWithFactors[year] = netAsset;
        });
        
        const detailedData: DetailedForecastDataRow[] = [];

        const historicalYears = [...financialYears].sort();
        historicalYears.forEach(year => {
            const baseSales = ensureNumber(getDetailedValueByYear(incomeStatement, '매출액', year));
            const netIncome = ensureNumber(getDetailedValueByYear(incomeStatement, '당기순이익', year));
            const netAssetValue = ensureNumber(getDetailedValueByYear(balanceSheet, '자본', year));

            const valuationResult = calculateStockValuation(netIncomes, netAssets, Number(year), isRealEstateHeavy);
            const finalValuation = valuationResult ? valuationResult.finalValuation : null;

            detailedData.push({
                year: year,
                baseSales: baseSales,
                baseNetIncome: netIncome,
                baseNetAssets: netAssetValue,
                baseValuation: finalValuation,
                costs: 0,
                dividends: 0,
                adjustedNetIncome: netIncome,
                adjustedNetAssets: netAssetValue,
                adjustedValuation: finalValuation,
            });
        });
        
        const latestYearNum = Number(financialYears[financialYears.length - 1]);

        for (let i = 0; i < 30; i++) {
            const currentYear = latestYearNum + 1 + i;
            const prevYear = currentYear - 1;
            
            const prevYearSales = ensureNumber(sales[prevYear.toString()]);
            const currentSales = prevYearSales * (1 + salesGrowthRate / 100);
            const currentNetIncome = currentSales * (netProfitMarginRate / 100);
            
            sales[currentYear.toString()] = currentSales;
            netIncomes[currentYear.toString()] = currentNetIncome;
            
            const prevYearNetAssets = ensureNumber(netAssets[prevYear.toString()]);
            const currentNetAssets = prevYearNetAssets + currentNetIncome;
            netAssets[currentYear.toString()] = currentNetAssets;
            
            const baseValuation = calculateStockValuation(netIncomes, netAssets, currentYear, isRealEstateHeavy);
            if (!baseValuation) continue;
            
            const isSalaryIncreaseYear = salaryIncreaseStartPeriodNum > 0 && i >= salaryIncreaseStartPeriodNum - 1 && (salaryIncreaseEndPeriodNum === 0 || i < salaryIncreaseEndPeriodNum);
            const salaryIncreaseForYear = isSalaryIncreaseYear ? salaryIncreaseAmountNum : 0;

            const isInsuranceYear = insuranceStartPeriodNum > 0 && i >= insuranceStartPeriodNum - 1 && (insuranceEndPeriodNum === 0 || i < insuranceEndPeriodNum);
            const insuranceForYear = isInsuranceYear ? insuranceAmountNum : 0;

            const severancePayTotalInManwon = ensureNumber(severancePayTotal);
            const hasSeverancePay = severancePayTotal !== undefined && severancePayTotal > 0;
            
            const severanceLumpSumForYear = (hasSeverancePay && retirementPeriodNum > 0 && i === retirementPeriodNum - 1)
                ? severancePayTotalInManwon
                : 0;

            const costsForYear = salaryIncreaseForYear + insuranceForYear + severanceLumpSumForYear;
            
            const isDividendYear = dividendStartPeriodNum > 0 && i >= dividendStartPeriodNum - 1 && (dividendEndPeriodNum === 0 || i < dividendEndPeriodNum);
            const dividendsForYear = isDividendYear ? dividendAmountNum : 0;

            let adjustedNetIncome = currentNetIncome - costsForYear;
            netIncomesWithFactors[currentYear.toString()] = adjustedNetIncome;

            const prevYearNetAssetsWithFactors = ensureNumber(netAssetsWithFactors[prevYear.toString()]);
            let adjustedNetAssets = prevYearNetAssetsWithFactors + adjustedNetIncome - dividendsForYear;
            netAssetsWithFactors[currentYear.toString()] = adjustedNetAssets;

            const factorValuation = calculateStockValuation(netIncomesWithFactors, netAssetsWithFactors, currentYear, isRealEstateHeavy);
            if (!factorValuation) continue;

            detailedData.push({
              year: String(currentYear),
              baseSales: currentSales,
              baseNetIncome: currentNetIncome,
              baseNetAssets: currentNetAssets,
              baseValuation: baseValuation.finalValuation,
              costs: costsForYear,
              dividends: dividendsForYear,
              adjustedNetIncome: adjustedNetIncome,
              adjustedNetAssets: adjustedNetAssets,
              adjustedValuation: factorValuation.finalValuation,
            });
        }
        return detailedData;
    }, [
        salesGrowthRate, netProfitMarginRate, incomeStatement, balanceSheet,
        dividendAmount, dividendStartPeriod, dividendEndPeriod,
        salaryIncreaseAmount, salaryIncreaseStartPeriod, salaryIncreaseEndPeriod,
        insuranceAmount, insuranceStartPeriod, insuranceEndPeriod,
        severancePayTotal, isRealEstateHeavy, retirementPeriod, financialYears
    ]);

    const latestYear = financialYears.length > 0 ? financialYears[financialYears.length - 1] : null;

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
            {isGenerating && (
                <div className="no-print fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <p className="text-xl font-semibold text-slate-700">PDF 생성 중...</p>
                        <p className="text-sm text-slate-500 mt-2">잠시만 기다려 주세요.</p>
                    </div>
                </div>
            )}
            <Header 
                onPdfSave={handlePdfSave} 
                isGenerating={isGenerating} 
                onDataLoad={handleFileUpload}
                onDataDownload={handleDataDownload}
            />
            <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
                  <>
                    <div className="print-section">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">기업 개요 및 주요 현황</h2>
                        <InfoCard
                            profile={companyProfile}
                            executives={executivesData}
                            shareholders={shareholdersData}
                            relatedCompanies={relatedCompanies}
                            onExecutiveChange={handleExecutiveChange}
                            onShareholderChange={handleShareholderChange}
                            onAddExecutive={handleAddExecutive}
                            onAddShareholder={handleAddShareholder}
                        />
                    </div>

                    {pdfRenderMode ? (
                        <>
                            <div className="mt-8 print-section print-break-before">
                                <div className="mt-6">
                                    <FinancialStatementCard title="재무상태표" data={balanceSheet} showEmptyRows={showEmptyFinancialStatementRows} hiddenRows={hiddenStatementRows.balanceSheet} onToggleRowVisibility={()=>{}} />
                                </div>
                            </div>
                            <div className="mt-8 print-section">
                                <div className="mt-6">
                                    <FinancialStatementCard title="손익계산서" data={incomeStatement} showEmptyRows={showEmptyFinancialStatementRows} hiddenRows={hiddenStatementRows.incomeStatement} onToggleRowVisibility={()=>{}} />
                                </div>
                            </div>
                            <div className="mt-8 print-section">
                                <div className="mt-6">
                                    <FinancialStatementCard title="제조원가명세서" data={statementOfCostOfGoodsManufactured} incomeStatementData={incomeStatement} showEmptyRows={showEmptyFinancialStatementRows} hiddenRows={hiddenStatementRows.costOfGoods} onToggleRowVisibility={()=>{}} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="mt-8 print-section print-break-before">
                            <h2 className="text-2xl font-bold text-slate-700 mb-4">재무제표 요약</h2>
                            <div className="mt-6">
                                <div className="flex justify-between items-center flex-wrap gap-2 mb-4 no-print">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries({
                                            balanceSheet: '재무상태표',
                                            incomeStatement: '손익계산서',
                                            costOfGoods: '제조원가명세서',
                                            cashFlow: '현금흐름표',
                                        }).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveStatement(key)}
                                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                                                    activeStatement === key
                                                        ? 'bg-brand-blue text-white shadow-md'
                                                        : 'bg-white text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    {activeStatement !== 'cashFlow' && (
                                        <button
                                          onClick={handleToggleAndResetHiddenRows}
                                          className="px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue"
                                          aria-live="polite"
                                        >
                                          {showEmptyFinancialStatementRows ? '값 없는 항목 숨기기' : '숨긴 항목 모두 보기'}
                                        </button>
                                    )}
                                </div>
                                <div>
                                    {activeStatement === 'balanceSheet' && <FinancialStatementCard title="재무상태표" data={balanceSheet} showEmptyRows={showEmptyFinancialStatementRows} hiddenRows={hiddenStatementRows.balanceSheet} onToggleRowVisibility={(name) => handleHideStatementRow('balanceSheet', name)} />}
                                    {activeStatement === 'incomeStatement' && <FinancialStatementCard title="손익계산서" data={incomeStatement} showEmptyRows={showEmptyFinancialStatementRows} hiddenRows={hiddenStatementRows.incomeStatement} onToggleRowVisibility={(name) => handleHideStatementRow('incomeStatement', name)} />}
                                    {activeStatement === 'costOfGoods' && <FinancialStatementCard title="제조원가명세서" data={statementOfCostOfGoodsManufactured} incomeStatementData={incomeStatement} showEmptyRows={showEmptyFinancialStatementRows} hiddenRows={hiddenStatementRows.costOfGoods} onToggleRowVisibility={(name) => handleHideStatementRow('costOfGoods', name)} />}
                                    {activeStatement === 'cashFlow' && <FinancialStatementCard title="현금흐름표" data={cashFlowStatement} showEmptyRows={showEmptyFinancialStatementRows} hiddenRows={hiddenStatementRows.cashFlow} onToggleRowVisibility={(name) => handleHideStatementRow('cashFlow', name)} />}
                                </div>
                            </div>
                        </div>
                    )}


                    <div className="mt-8 print-section print-break-before">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">재무진단</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CombinedRatioCard title="안정성" chartConfig={stabilityChartConfig} metrics={financialRatiosData.stability} />
                            <CombinedRatioCard title="수익성" chartConfig={profitabilityChartConfig} metrics={financialRatiosData.profitability} />
                            <CombinedRatioCard title="활동성" chartConfig={activityChartConfig} metrics={financialRatiosData.activity} />
                            <CombinedRatioCard title="성장성" chartConfig={growthChartConfig} metrics={financialRatiosData.growth} />
                        </div>
                    </div>

                    <div className="mt-8 print-section print-break-before">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">경영성과 및 퇴직금 설계</h2>
                        <Card className="bg-slate-50 border border-slate-200 shadow-inner">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card title="재무제표 요약">
                                    <FinancialChart config={financialPerformanceData} />
                                </Card>
                                <Card title="동종업계 경영규모 비교">
                                    <FinancialChart config={industryRadarChartConfig} />
                                </Card>
                                <div className="lg:col-span-2">
                                    <Card>
                                        <SeverancePaySimulator 
                                            avgSalary={avgSalary}
                                            setAvgSalary={setAvgSalary}
                                            currentYearsOfService={currentYearsOfService}
                                            setCurrentYearsOfService={setCurrentYearsOfService}
                                            multiplier={multiplier}
                                            setMultiplier={setMultiplier}
                                            severancePayTotal={severancePayForCard}
                                        />
                                    </Card>
                                </div>
                            </div>
                        </Card>
                    </div>
                    
                    <div className="mt-8 print-section print-break-before">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">비상장주식평가</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <Card title="상증법상 주식가치 평가 (비상장)">
                                <div className="text-sm text-slate-600 mb-4 space-y-2">
                                    <p>비상장주식의 가치는 순손익가치와 순자산가치를 <span className="font-bold text-brand-blue">{isRealEstateHeavy ? '2:3' : '3:2'}</span>으로 가중평균하여 계산됩니다. (상속세 및 증여세법)</p>
                                    <p className="text-xs text-slate-500">* 단, 평가액이 순자산가치의 80%에 미달하는 경우 순자산가치의 80%를 최종가치로 합니다.</p>
                                    
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                        <label htmlFor="realEstateSwitch" className="text-sm font-medium text-slate-700 pr-4">부동산과다보유 법인 (가중치 변경)</label>
                                        <button
                                            id="realEstateSwitch"
                                            onClick={() => setIsRealEstateHeavy(!isRealEstateHeavy)}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue ${isRealEstateHeavy ? 'bg-brand-blue' : 'bg-slate-300'}`}
                                            aria-pressed={isRealEstateHeavy}
                                        >
                                            <span
                                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isRealEstateHeavy ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mt-3">
                                        <h4 className="font-semibold text-slate-600 mb-1">계산 근거 데이터</h4>
                                        {latestYear && <p><strong>• 직전년도 순자산 ({latestYear}):</strong> {formatSummaryValueForDisplay(getDetailedValueByYear(balanceSheet, '자본', latestYear))} 만원</p>}
                                        <div className="flex items-center mt-1">
                                            <strong className="flex-shrink-0">• 직전 3년 당기순이익:</strong>
                                            <span className="ml-2 text-slate-500">
                                                {financialYears.slice(-3).reverse().map(year => (
                                                    `${year}년: ${formatSummaryValueForDisplay(getDetailedValueByYear(incomeStatement, '당기순이익', year))} 만원`
                                                )).join(', ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <div className="space-y-1">
                                            <p><strong>순자산가치 ({latestYear}):</strong> <span className="font-bold">{formatEokwonForDisplay(totalNetAssetValue)} 억원</span></p>
                                            <p><strong>순손익가치 (가중평균):</strong> <span className="font-bold">{formatEokwonForDisplay(totalNetIncomeValue)} 억원</span></p>
                                        </div>
                                        <div className="text-right pl-4">
                                            <p className="text-lg font-semibold text-brand-blue whitespace-nowrap">
                                                최종 주식가치 (현재):
                                                <span className="font-bold text-xl ml-2">
                                                    {formatEokwonForDisplay(totalFinalValuation)} 억원
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <FinancialChart config={stockValuationChartData} />
                                
                                <div className="mt-6 border-t pt-4">
                                    <h4 className="text-md font-semibold text-slate-700 mb-3">{latestYear ? `${Number(latestYear) + 1}년` : ''} 예상 주식가치</h4>
                                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                            <label htmlFor="expectedDividend" className="text-sm font-medium text-slate-600">{latestYear ? `${Number(latestYear) + 1}년` : ''} 예상 배당금</label>
                                            <div className="flex items-center">
                                                <input
                                                    id="expectedDividend"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="예: 30000"
                                                    value={formatNumber(expectedDividend)}
                                                    onChange={e => setExpectedDividend(e.target.value)}
                                                    className="w-full px-3 h-9 border border-slate-500 rounded-md text-sm bg-slate-700 text-white text-right focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                                                />
                                                <span className="text-sm text-slate-700 ml-2">만원</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                            <label htmlFor="expectedNetIncome" className="text-sm font-medium text-slate-600">{latestYear ? `${Number(latestYear) + 1}년` : ''} 예상 당기순이익</label>
                                            <div className="flex items-center">
                                                <input
                                                    id="expectedNetIncome"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder={latestYear ? `${latestYear}년: ${formatSummaryValueForDisplay(getDetailedValueByYear(incomeStatement, '당기순이익', latestYear))}` : ''}
                                                    value={formatNumber(expectedNetIncome)}
                                                    onChange={e => setExpectedNetIncome(e.target.value)}
                                                    className="w-full px-3 h-9 border border-slate-500 rounded-md text-sm bg-slate-700 text-white text-right focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                                                />
                                                <span className="text-sm text-slate-700 ml-2">만원</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                    {(showSimulationChart && simulationChartData) ? (
                                        <FinancialChart config={simulationChartData} />
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg border">
                                        <p>{latestYear ? `${Number(latestYear) + 1}년` : ''} 예상치를 입력하세요.</p>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                    
                    <div className="mt-8 print-section print-break-before">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">주식가치 시뮬레이션</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <Card title="향후 30년간 주식가치">
                                <StockValuationSimulator 
                                    financialYears={financialYears}
                                    numberOfShares={10000}
                                    severancePayTotal={severancePayTotal}
                                    salaryIncreaseAmount={salaryIncreaseAmount}
                                    onSalaryIncreaseAmountChange={setSalaryIncreaseAmount}
                                    salaryIncreaseStartPeriod={salaryIncreaseStartPeriod}
                                    onSalaryIncreaseStartPeriodChange={setSalaryIncreaseStartPeriod}
                                    salaryIncreaseEndPeriod={salaryIncreaseEndPeriod}
                                    onSalaryIncreaseEndPeriodChange={setSalaryIncreaseEndPeriod}
                                    isRealEstateHeavy={isRealEstateHeavy}
                                    shareholders={shareholdersData}
                                    retirementPeriod={retirementPeriod}
                                    onRetirementPeriodChange={setRetirementPeriod}
                                    isCeoSalaryIncrease={isCeoSalaryIncrease}
                                    onIsCeoSalaryIncreaseChange={setIsCeoSalaryIncrease}
                                    insuranceAmount={insuranceAmount}
                                    onInsuranceAmountChange={setInsuranceAmount}
                                    insuranceStartPeriod={insuranceStartPeriod}
                                    onInsuranceStartPeriodChange={setInsuranceStartPeriod}
                                    insuranceEndPeriod={insuranceEndPeriod}
                                    onInsuranceEndPeriodChange={setInsuranceEndPeriod}
                                    salesGrowthRate={salesGrowthRate}
                                    onSalesGrowthRateChange={setSalesGrowthRate}
                                    netProfitMarginRate={netProfitMarginRate}
                                    onNetProfitMarginRateChange={setNetProfitMarginRate}
                                    dividendAmount={dividendAmount}
                                    onDividendAmountChange={setDividendAmount}
                                    dividendStartPeriod={dividendStartPeriod}
                                    onDividendStartPeriodChange={setDividendStartPeriod}
                                    dividendEndPeriod={dividendEndPeriod}
                                    onDividendEndPeriodChange={setDividendEndPeriod}
                                    detailedForecastData={detailedForecastData}
                                />
                            </Card>
                        </div>
                    </div>

                    <div className="mt-8 print-section print-break-before">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">상속세 계산</h2>
                        <InheritanceTaxCard 
                            currentStockValuation={totalFinalValuation}
                            financialAssets={financialAssets}
                            setFinancialAssets={setFinancialAssets}
                            realEstate={realEstate}
                            setRealEstate={setRealEstate}
                            deemedAssets={deemedAssets}
                            setDeemedAssets={setDeemedAssets}
                            debt={debt}
                            setDebt={setDebt}
                            hasSpouse={hasSpouse}
                            setHasSpouse={setHasSpouse}
                            numChildren={numChildren}
                            setNumChildren={setNumChildren}
                        />
                    </div>

                    <div className="mt-8 print-section">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">상속세 시뮬레이션</h2>
                        <FutureInheritanceTaxCard
                            detailedForecastData={detailedForecastData}
                            financialAssets={financialAssets}
                            realEstate={realEstate}
                            deemedAssets={deemedAssets}
                            debt={debt}
                            hasSpouse={hasSpouse}
                            numChildren={numChildren}
                            financialAssetGrowthRate={financialAssetGrowthRate}
                            setFinancialAssetGrowthRate={setFinancialAssetGrowthRate}
                            realEstateGrowthRate={realEstateGrowthRate}
                            setRealEstateGrowthRate={setRealEstateGrowthRate}
                            financialYears={financialYears}
                        />
                    </div>
                  </>
            </main>
            <button
                onClick={handlePdfSave}
                disabled={isGenerating}
                className="no-print fixed bottom-8 right-8 bg-brand-blue text-white font-semibold rounded-full py-3 px-5 shadow-lg hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-transform duration-200 hover:scale-105 z-50 disabled:bg-slate-400 disabled:cursor-not-allowed"
                aria-label="보고서 PDF로 저장"
            >
                {isGenerating ? '생성 중...' : 'PDF 저장'}
            </button>
            <Footer />
        </div>
    );
};

export default App;