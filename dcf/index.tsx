import React, { useState, useMemo, FC, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Helper Functions ---
const formatCurrency = (value: number, unit: string = "원") => {
  if (isNaN(value)) return `0 ${unit}`;
  return `${Math.round(value).toLocaleString()} ${unit}`;
};

const formatNumber = (value: number, decimals = 2) => {
  if (isNaN(value)) return "0.00";
  return value.toFixed(decimals);
};

const formatPercentage = (value: number) => {
  if (isNaN(value)) return "0.00 %";
  return `${(value * 100).toFixed(2)} %`;
};

const getLatestValue = (statement: any[], account: string | string[], year: string): number => {
  const accounts = Array.isArray(account) ? account : [account];
  let item = null;
  for (const acc of accounts) {
    item = statement.find(i => i['계정과목'] && i['계정과목'].trim() === acc);
    if (item) break;
  }
  return item && item[year] ? Number(item[year]) : 0;
};


const getValuesForYears = (statement: any[], account: string | string[], years: string[]): number[] => {
    const accounts = Array.isArray(account) ? account : [account];
    let item = null;
    for (const acc of accounts) {
        item = statement.find(i => i['계정과목'] && i['계정과목'].trim() === acc);
        if (item) break;
    }
    if (!item) return years.map(() => 0);
    return years.map(year => Number(item[year]) || 0);
}

const getSumOfValuesForYears = (statement: any[], accounts: string[], years: string[]): number[] => {
    const result = years.map(() => 0);
    accounts.forEach(account => {
        const item = statement.find(i => i['계정과목'] && i['계정과목'].trim() === account);
        if (item) {
            years.forEach((year, index) => {
                result[index] += Number(item[year]) || 0;
            });
        }
    });
    return result;
};

// --- Type Definitions ---
interface FinancialData {
  companyProfile: { "기업명": string };
  incomeStatement: any[];
  balanceSheet: any[];
  costOfGoodsManufactured?: any[];
}

interface PastRatios {
    revenueGrowthRates: number[];
    operatingMargins: number[];
    netMargins: number[];
    depreciationRates: number[];
    capexRates: number[];
    nwcRates: number[];
    interestRates: number[];
    avgRevenueGrowthRate: number;
    avgOperatingMargin: number;
    avgNetMargin: number;
    avgDepreciationRate: number;
    avgCapexRate: number;
    avgNwcRate: number;
    avgInterestRate: number;
}

const calculatePastRatios = (financialData: FinancialData | null, pastThreeYears: string[] | null): PastRatios | null => {
    if (!financialData || !pastThreeYears) return null;
    
    const allYears = [String(parseInt(pastThreeYears[0]) - 1), ...pastThreeYears];

    const allRevenues = getValuesForYears(financialData.incomeStatement, '매출액', allYears);
    const revenues = allRevenues.slice(1);
    const operatingIncomes = getValuesForYears(financialData.incomeStatement, '영업이익', pastThreeYears);
    const netIncomes = getValuesForYears(financialData.incomeStatement, '당기순이익', pastThreeYears);
    
    // Total Depreciation = from Income Statement + from Cost of Goods Manufactured
    const depreciationsIS = getValuesForYears(financialData.incomeStatement, '감가상각비', pastThreeYears);
    const depreciationsCOGM = financialData.costOfGoodsManufactured
        ? getValuesForYears(financialData.costOfGoodsManufactured, '감가상각비', pastThreeYears)
        : pastThreeYears.map(() => 0);
    const depreciations = depreciationsIS.map((v, i) => v + depreciationsCOGM[i]);
    
    const allTangibleAssets = getValuesForYears(financialData.balanceSheet, '유형자산', allYears);
    const capexes = pastThreeYears.map((_, i) => {
        const endingPPE = allTangibleAssets[i + 1];
        const beginningPPE = allTangibleAssets[i];
        const depreciationForYear = depreciations[i];
        return endingPPE - beginningPPE + depreciationForYear;
    });
    
    const receivables = getValuesForYears(financialData.balanceSheet, '매출채권', pastThreeYears);
    const inventories = getValuesForYears(financialData.balanceSheet, '재고자산', pastThreeYears);
    const payables = getValuesForYears(financialData.balanceSheet, '매입채무', pastThreeYears);
    const nwcs = receivables.map((r, i) => r + inventories[i] - payables[i]);
    
    const revenueGrowthRates = pastThreeYears.map((_, i) => {
        const prevRevenue = allRevenues[i];
        const currentRevenue = allRevenues[i + 1];
        return prevRevenue > 0 ? (currentRevenue - prevRevenue) / prevRevenue : 0;
    });

    const interestExpenses = getValuesForYears(financialData.incomeStatement, '이자비용', pastThreeYears);
    const totalDebts = getSumOfValuesForYears(financialData.balanceSheet, ['단기차입금', '사채', '장기차입금'], pastThreeYears);
    const interestRates = interestExpenses.map((expense, i) => totalDebts[i] > 0 ? expense / totalDebts[i] : 0);

    const calculateRate = (values: number[]) => values.map((v, i) => revenues[i] > 0 ? v / revenues[i] : 0);
    
    const operatingMargins = calculateRate(operatingIncomes);
    const netMargins = calculateRate(netIncomes);
    const depreciationRates = calculateRate(depreciations);
    const capexRates = calculateRate(capexes);
    const nwcRates = calculateRate(nwcs);

    const avg = (arr: number[]) => arr.filter(v => isFinite(v)).length > 0 ? arr.filter(v => isFinite(v)).reduce((a, b) => a + b, 0) / arr.filter(v => isFinite(v)).length : 0;

    return {
        revenueGrowthRates,
        operatingMargins,
        netMargins,
        depreciationRates,
        capexRates,
        nwcRates,
        interestRates,
        avgRevenueGrowthRate: avg(revenueGrowthRates),
        avgOperatingMargin: avg(operatingMargins),
        avgNetMargin: avg(netMargins),
        avgDepreciationRate: avg(depreciationRates),
        avgCapexRate: avg(capexRates),
        avgNwcRate: avg(nwcRates),
        avgInterestRate: avg(interestRates)
    };
}

const renderAnalysisText = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.trim() === '') return <div key={index} style={{ height: '0.5rem' }} />;

        if (line.startsWith('### ')) {
            return <h4 key={index}>{line.substring(4)}</h4>;
        }

        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        const content = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
        
        return <p key={index}>{content}</p>;
    });
};


// --- React Components ---
const App: FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');


  // --- DCF Assumptions State (Unit: 만원 for currency) ---
  const [baseRevenue, setBaseRevenue] = useState(30090000);
  const [growthRate, setGrowthRate] = useState(0.13);
  const [ebitMargin, setEbitMargin] = useState(0.15);
  const [taxRate, setTaxRate] = useState(0.25);
  const [depreciationRate, setDepreciationRate] = useState(0.13);
  const [capexRate, setCapexRate] = useState(0.15);
  const [nwcRate, setNwcRate] = useState(0.22);
  const [riskFreeRate, setRiskFreeRate] = useState(0.03);
  const [beta, setBeta] = useState(1.3);
  const [erp, setErp] = useState(0.09);
  const [costOfDebt, setCostOfDebt] = useState(0.03);
  const [marketCap, setMarketCap] = useState(4430000);
  const [totalDebt, setTotalDebt] = useState(198000);
  const [cashAndEquivalents, setCashAndEquivalents] = useState(1148000);
  const [terminalGrowthRate, setTerminalGrowthRate] = useState(0.015);
  const [sharesOutstanding, setSharesOutstanding] = useState(1);
  const [additionalCashLikeAssets, setAdditionalCashLikeAssets] = useState(0);
  
  // --- Local state for input fields to improve user experience ---
  const [inputValues, setInputValues] = useState({
    baseRevenue: Math.round(baseRevenue).toLocaleString(),
    growthRate: (growthRate * 100).toFixed(1),
    ebitMargin: (ebitMargin * 100).toFixed(1),
    taxRate: (taxRate * 100).toFixed(1),
    depreciationRate: (depreciationRate * 100).toFixed(1),
    capexRate: (capexRate * 100).toFixed(1),
    nwcRate: (nwcRate * 100).toFixed(1),
    riskFreeRate: (riskFreeRate * 100).toFixed(1),
    beta: String(beta),
    erp: (erp * 100).toFixed(1),
    costOfDebt: (costOfDebt * 100).toFixed(1),
    marketCap: Math.round(marketCap).toLocaleString(),
    totalDebt: Math.round(totalDebt).toLocaleString(),
    cashAndEquivalents: Math.round(cashAndEquivalents).toLocaleString(),
    terminalGrowthRate: (terminalGrowthRate * 100).toFixed(1),
    sharesOutstanding: String(sharesOutstanding),
    additionalCashLikeAssets: Math.round(additionalCashLikeAssets).toLocaleString(),
  });

  // --- AI Analysis State ---
  const [analysisText, setAnalysisText] = useState("");
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // --- PDF Saving State ---
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setApiKeyInput(savedApiKey);
    }
  }, []);

  useEffect(() => {
    setInputValues({
      baseRevenue: Math.round(baseRevenue).toLocaleString(),
      growthRate: (growthRate * 100).toFixed(1),
      ebitMargin: (ebitMargin * 100).toFixed(1),
      taxRate: (taxRate * 100).toFixed(1),
      depreciationRate: (depreciationRate * 100).toFixed(1),
      capexRate: (capexRate * 100).toFixed(1),
      nwcRate: (nwcRate * 100).toFixed(1),
      riskFreeRate: (riskFreeRate * 100).toFixed(1),
      beta: String(beta),
      erp: (erp * 100).toFixed(1),
      costOfDebt: (costOfDebt * 100).toFixed(1),
      marketCap: Math.round(marketCap).toLocaleString(),
      totalDebt: Math.round(totalDebt).toLocaleString(),
      cashAndEquivalents: Math.round(cashAndEquivalents).toLocaleString(),
      terminalGrowthRate: (terminalGrowthRate * 100).toFixed(1),
      sharesOutstanding: String(sharesOutstanding),
      additionalCashLikeAssets: Math.round(additionalCashLikeAssets).toLocaleString(),
    });
  }, [
    baseRevenue, growthRate, ebitMargin, taxRate, depreciationRate, 
    capexRate, nwcRate, terminalGrowthRate, riskFreeRate, beta, erp, 
    costOfDebt, marketCap, totalDebt, cashAndEquivalents, 
    sharesOutstanding, additionalCashLikeAssets
  ]);

  const handleInputChange = (field: keyof typeof inputValues, value: string) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
  };

  const handleInputBlur = (field: keyof typeof inputValues, type: 'formatted' | 'percent' | 'number') => {
    const value = inputValues[field];
    let numericValue;

    switch (type) {
      case 'percent':
        numericValue = Number(value) / 100;
        break;
      case 'formatted':
        numericValue = Number(String(value).replace(/,/g, ''));
        break;
      default: // 'number'
        numericValue = Number(value);
        break;
    }

    if (!isNaN(numericValue)) {
      const setters: Record<keyof typeof inputValues, (val: number) => void> = {
        baseRevenue: setBaseRevenue,
        growthRate: setGrowthRate,
        ebitMargin: setEbitMargin,
        taxRate: setTaxRate,
        depreciationRate: setDepreciationRate,
        capexRate: setCapexRate,
        nwcRate: setNwcRate,
        riskFreeRate: setRiskFreeRate,
        beta: setBeta,
        erp: setErp,
        costOfDebt: setCostOfDebt,
        marketCap: setMarketCap,
        totalDebt: setTotalDebt,
        cashAndEquivalents: setCashAndEquivalents,
        terminalGrowthRate: setTerminalGrowthRate,
        sharesOutstanding: setSharesOutstanding,
        additionalCashLikeAssets: setAdditionalCashLikeAssets,
      };
      setters[field](numericValue);
    } else {
        // Revert to the last valid value if input is not a number
        const originalNumericValues = {
            baseRevenue, growthRate, ebitMargin, taxRate, depreciationRate, capexRate, nwcRate,
            riskFreeRate, beta, erp, costOfDebt, marketCap, totalDebt, cashAndEquivalents,
            terminalGrowthRate, sharesOutstanding, additionalCashLikeAssets
        };
        const formatters: { [key: string]: (val: number) => string } = {
            percent: (val: number) => (val * 100).toFixed(1),
            formatted: (val: number) => Math.round(val).toLocaleString(),
            number: (val: number) => String(val)
        };
        setInputValues(prev => ({
            ...prev,
            [field]: formatters[type](originalNumericValues[field as keyof typeof originalNumericValues])
        }));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: keyof typeof inputValues, type: 'formatted' | 'percent' | 'number') => {
    if (e.key === 'Enter') {
      handleInputBlur(field, type);
      e.currentTarget.blur();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();


  const CURRENT_CASH_ACCOUNTS = ['현금및현금성자산', '단기예금', '단기매매증권', '단기대여금', '단기금융상품', '단기투자자산'];
  const NON_CURRENT_INVESTMENT_ACCOUNTS = ['투자자산'];
  const CASH_ACCOUNTS_FOR_VALUATION = [...CURRENT_CASH_ACCOUNTS, ...NON_CURRENT_INVESTMENT_ACCOUNTS];

  const pastThreeYears = useMemo(() => {
    if (!financialData) return null;
    const firstStatement = financialData.incomeStatement[0] || {};
    const years = Object.keys(firstStatement).filter(key => !isNaN(parseInt(key)));
    if (years.length === 0) return null;
    return years.sort().slice(-3);
  }, [financialData]);

  const handleLoadFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target ? e.target.result : null;
        if (typeof result !== 'string') {
            alert("파일을 읽을 수 없습니다.");
            return;
        }
        try {
          const rawData = JSON.parse(result);
          const data: FinancialData = {
            ...rawData,
            costOfGoodsManufactured: rawData.costOfGoodsManufactured || rawData['제조원가명세서'] || rawData['statementOfCostOfGoodsManufactured'],
          };
          
          if (!data.incomeStatement || !data.balanceSheet) {
              alert("JSON 파일에 'incomeStatement' 또는 'balanceSheet' 데이터가 없습니다.");
              return;
          }

          setFinancialData(data);
          
          if (data.incomeStatement.length === 0) {
              console.warn("손익계산서 데이터를 찾을 수 없습니다.");
              return;
          }
          const years = Object.keys(data.incomeStatement[0] || {}).filter(key => !isNaN(parseInt(key))).sort().slice(-3);
          if (!years || years.length === 0) {
              console.warn("재무 데이터에서 연도를 찾을 수 없습니다.");
              return;
          }
          const latestYear = years[years.length - 1];
          
          // Get values from detailed statements (unit: 천원)
          const latestRevenue = getLatestValue(data.incomeStatement, '매출액', latestYear);
          const latestEquity = getLatestValue(data.balanceSheet, '자본', latestYear);
          
          const latestShortTermDebt = getLatestValue(data.balanceSheet, '단기차입금', latestYear);
          const latestBonds = getLatestValue(data.balanceSheet, '사채', latestYear);
          const latestLongTermDebt = getLatestValue(data.balanceSheet, '장기차입금', latestYear);
          const latestTotalInterestBearingDebt = latestShortTermDebt + latestBonds + latestLongTermDebt;
          
          const latestCash = getSumOfValuesForYears(data.balanceSheet, CURRENT_CASH_ACCOUNTS, [latestYear])[0];
        
          // Convert from 천원 to 만원 (divide by 10)
          setBaseRevenue(Math.round(latestRevenue / 10));
          setMarketCap(Math.round(latestEquity / 10));
          setTotalDebt(Math.round(latestTotalInterestBearingDebt / 10));
          setCashAndEquivalents(Math.round(latestCash / 10));

          // Calculate past ratios and set assumptions
          const ratios = calculatePastRatios(data, years);
          if (ratios) {
            setGrowthRate(ratios.avgRevenueGrowthRate > 0 ? ratios.avgRevenueGrowthRate : 0.10);
            setEbitMargin(ratios.avgOperatingMargin > 0 ? ratios.avgOperatingMargin : 0.15);
            setDepreciationRate(ratios.avgDepreciationRate > 0 ? ratios.avgDepreciationRate : 0.13);
            setCapexRate(ratios.avgCapexRate > 0 ? ratios.avgCapexRate : 0.15);
            setNwcRate(ratios.avgNwcRate > 0 ? ratios.avgNwcRate : 0.22);
            setCostOfDebt(ratios.avgInterestRate > 0 ? ratios.avgInterestRate : 0.045);
          }
          
        } catch (error) {
          console.error("Failed to parse JSON file:", error);
          alert("유효하지 않은 JSON 파일입니다.");
        }
      };
      reader.readAsText(file);
    }
    // Reset file input to allow uploading the same file again
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
    localStorage.setItem('gemini-api-key', apiKeyInput);
    alert('API 키가 저장되었습니다.');
  };

  const { costOfEquity, afterTaxCostOfDebt, equityWeight, debtWeight, wacc } = useMemo(() => {
    const costOfEquity = riskFreeRate + beta * erp;
    const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);

    const effectiveMarketCap = marketCap > 0 ? marketCap : 1;
    const totalCapital = effectiveMarketCap + totalDebt;
    const equityWeight = totalCapital > 0 ? effectiveMarketCap / totalCapital : 0;
    const debtWeight = totalCapital > 0 ? totalDebt / totalCapital : 0;

    const wacc = (equityWeight * costOfEquity) + (debtWeight * afterTaxCostOfDebt);

    return { costOfEquity, afterTaxCostOfDebt, equityWeight, debtWeight, wacc };
  }, [riskFreeRate, beta, erp, marketCap, totalDebt, costOfDebt, taxRate]);

  const projections = useMemo(() => {
    const years = Array.from({ length: 5 }, (_, i) => ({ year: i + 1 }));
    const results = years.map(({year}) => {
      const revenue = baseRevenue * Math.pow(1 + growthRate, year);
      const ebit = revenue * ebitMargin;
      const nopat = ebit * (1 - taxRate);
      const depreciation = revenue * depreciationRate;
      const capex = revenue * capexRate;
      const prevRevenue = year === 1 ? baseRevenue : baseRevenue * Math.pow(1 + growthRate, year - 1);
      const nwcChange = (revenue - prevRevenue) * nwcRate;
      const fcff = nopat + depreciation - capex - nwcChange;
      
      return { year, revenue, ebit, nopat, depreciation, capex, nwcChange, fcff };
    });
    return results;
  }, [baseRevenue, growthRate, ebitMargin, taxRate, depreciationRate, capexRate, nwcRate]);
  
  const valuationDetails = useMemo(() => {
    const discountedProjections = projections.map(p => ({
      ...p,
      presentValue: p.fcff / Math.pow(1 + wacc, p.year)
    }));

    if (wacc <= terminalGrowthRate || discountedProjections.length < 5) {
      return {
        sumOfPvFcff: 0,
        lastFCFF: 0,
        terminalValue: Infinity,
        pvOfTerminalValue: Infinity,
        enterpriseValue: Infinity,
        equityValue: Infinity,
        intrinsicValue: Infinity,
      };
    }

    const sumOfPvFcff = discountedProjections.reduce((sum, p) => sum + p.presentValue, 0);
    const lastFCFF = discountedProjections[discountedProjections.length - 1].fcff;
    const terminalValue = (lastFCFF * (1 + terminalGrowthRate)) / (wacc - terminalGrowthRate);
    const pvOfTerminalValue = terminalValue / Math.pow(1 + wacc, discountedProjections.length);
    const enterpriseValue = sumOfPvFcff + pvOfTerminalValue;
    const totalCash = cashAndEquivalents + additionalCashLikeAssets;
    const netDebt = totalDebt - totalCash;
    const equityValue = enterpriseValue - netDebt;
    const intrinsicValue = sharesOutstanding > 0 ? (equityValue * 10000) / (sharesOutstanding * 10000) : 0;

    return {
      sumOfPvFcff,
      lastFCFF,
      terminalValue,
      pvOfTerminalValue,
      enterpriseValue,
      equityValue,
      intrinsicValue
    };
  }, [projections, terminalGrowthRate, wacc, totalDebt, cashAndEquivalents, sharesOutstanding, additionalCashLikeAssets]);

  const pastRatios = useMemo<PastRatios | null>(() => {
    return calculatePastRatios(financialData, pastThreeYears);
  }, [financialData, pastThreeYears]);

  const fullProjections = useMemo(() => {
        if (!financialData || !pastThreeYears || !pastRatios) return null;

        const latestYear = pastThreeYears[pastThreeYears.length - 1];
        const allRevenues = getValuesForYears(financialData.incomeStatement, '매출액', pastThreeYears);
        
        const avg = (arr: number[]) => arr.filter(isFinite).length > 0 ? arr.filter(isFinite).reduce((a, b) => a + b, 0) / arr.filter(isFinite).length : 0;
        
        const calcAvgRate = (account: string | string[], statement: any[], baseValues = allRevenues) => {
            const values = Array.isArray(account)
                ? getSumOfValuesForYears(statement, account, pastThreeYears)
                : getValuesForYears(statement, account, pastThreeYears);
            const rates = values.map((v, i) => baseValues[i] > 0 ? v / baseValues[i] : 0);
            return avg(rates);
        };

        // --- Income Statement Ratios ---
        const avgGrossMarginRate = calcAvgRate('매출총이익', financialData.incomeStatement);

        const rdValues = getValuesForYears(financialData.incomeStatement, '연구개발비', pastThreeYears);
        const sgaValues = getValuesForYears(financialData.incomeStatement, ['판매관리비', '판매비와관리비'], pastThreeYears);
        const opExValues = rdValues.map((v, i) => v + sgaValues[i]);
        const rdToOpExRates = rdValues.map((v, i) => opExValues[i] > 0 ? v / opExValues[i] : 0);
        const avgRdToOpExRate = avg(rdToOpExRates);

        const avgInterestIncomeRate = calcAvgRate('이자수익', financialData.incomeStatement);
        const avgOtherExpensesRate = calcAvgRate(['유형자산처분손실', '리스자산처분손실', '기타영업외비용', '기타비용'], financialData.incomeStatement);

        // --- Balance Sheet Ratios ---
        const ratioAR = calcAvgRate('매출채권', financialData.balanceSheet);
        const ratioInv = calcAvgRate('재고자산', financialData.balanceSheet);
        const ratioAP = calcAvgRate('매입채무', financialData.balanceSheet);

        // --- Initial Values for Projections (Latest Year) ---
        const latestCurrentAssets = getLatestValue(financialData.balanceSheet, '유동자산', latestYear);
        const latestCurrentCash = getSumOfValuesForYears(financialData.balanceSheet, CURRENT_CASH_ACCOUNTS, [latestYear])[0];
        const latestReceivables = getLatestValue(financialData.balanceSheet, '매출채권', latestYear);
        const latestInventories = getLatestValue(financialData.balanceSheet, '재고자산', latestYear);
        const latestOtherCurrentAssets = latestCurrentAssets - latestCurrentCash - latestReceivables - latestInventories;

        const latestCurrentLiabilities = getLatestValue(financialData.balanceSheet, '유동부채', latestYear);
        const latestPayables = getLatestValue(financialData.balanceSheet, '매입채무', latestYear);
        const latestShortTermDebtForProjection = getLatestValue(financialData.balanceSheet, '단기차입금', latestYear);
        const latestOtherCurrentLiabilities = latestCurrentLiabilities - latestPayables - latestShortTermDebtForProjection;

        const latestNonCurrentAssets = getLatestValue(financialData.balanceSheet, '비유동자산', latestYear);
        const latestTangibleAssets = getLatestValue(financialData.balanceSheet, '유형자산', latestYear);
        const latestNonCurrentInvestments = getSumOfValuesForYears(financialData.balanceSheet, NON_CURRENT_INVESTMENT_ACCOUNTS, [latestYear])[0];
        const latestOtherNonCurrentAssets = latestNonCurrentAssets - latestTangibleAssets - latestNonCurrentInvestments;


        const latestNonCurrentLiabilities = getLatestValue(financialData.balanceSheet, '비유동부채', latestYear);
        const latestBondsForProjection = getLatestValue(financialData.balanceSheet, '사채', latestYear);
        const latestLongTermDebtForProjection = getLatestValue(financialData.balanceSheet, '장기차입금', latestYear);
        const latestOtherNonCurrentLiabilities = latestNonCurrentLiabilities - latestBondsForProjection - latestLongTermDebtForProjection;


        let lastYearData: any = {
            revenue: baseRevenue,
            netPPE: getLatestValue(financialData.balanceSheet, '유형자산', latestYear) / 10,
            cash: cashAndEquivalents,
            totalDebt: totalDebt,
            ar: baseRevenue * ratioAR,
            inv: baseRevenue * ratioInv,
            ap: baseRevenue * ratioAP,
            otherCurrentAssets: latestOtherCurrentAssets / 10,
            otherNonCurrentAssets: latestOtherNonCurrentAssets / 10,
            otherCurrentLiabilities: latestOtherCurrentLiabilities / 10,
            otherNonCurrentLiabilities: latestOtherNonCurrentLiabilities / 10,
            capitalStock: getLatestValue(financialData.balanceSheet, '자본금', latestYear) / 10,
            retainedEarnings: getLatestValue(financialData.balanceSheet, '이익잉여금', latestYear) / 10,
            oci: getLatestValue(financialData.balanceSheet, '기타포괄손익누계액', latestYear) / 10,
        };

        const projectionYears = Array.from({ length: 5 }, (_, i) => i + 1);
        const results = projectionYears.map(year => {
            const currentYear: any = {};
            
            // --- Income Statement ---
            currentYear.revenue = lastYearData.revenue * (1 + growthRate);
            currentYear.grossProfit = currentYear.revenue * avgGrossMarginRate;
            currentYear.cogs = currentYear.revenue - currentYear.grossProfit;
            currentYear.ebit = currentYear.revenue * ebitMargin;
            const totalOperatingExpenses = currentYear.grossProfit - currentYear.ebit;
            currentYear.rd = totalOperatingExpenses * avgRdToOpExRate;
            currentYear.sga = totalOperatingExpenses * (1- avgRdToOpExRate);
            currentYear.interestIncome = currentYear.revenue * avgInterestIncomeRate;
            currentYear.interestExpense = lastYearData.totalDebt * costOfDebt;
            currentYear.otherExpenses = currentYear.revenue * avgOtherExpensesRate;
            currentYear.ebt = currentYear.ebit + currentYear.interestIncome - currentYear.interestExpense - currentYear.otherExpenses;
            currentYear.taxes = Math.max(0, currentYear.ebt * taxRate);
            currentYear.netIncome = currentYear.ebt - currentYear.taxes;

            // --- Cash Flow Items ---
            currentYear.depreciation = currentYear.revenue * depreciationRate;
            currentYear.capex = currentYear.revenue * capexRate;
            
            // --- Balance Sheet ---
            currentYear.ar = currentYear.revenue * ratioAR;
            currentYear.inv = currentYear.revenue * ratioInv;
            currentYear.otherCurrentAssets = lastYearData.otherCurrentAssets * (1 + growthRate);
            currentYear.netPPE = lastYearData.netPPE + currentYear.capex - currentYear.depreciation;
            currentYear.otherNonCurrentAssets = lastYearData.otherNonCurrentAssets * (1 + growthRate);

            currentYear.ap = currentYear.revenue * ratioAP;
            currentYear.otherCurrentLiabilities = lastYearData.otherCurrentLiabilities * (1 + growthRate);
            currentYear.totalDebt = totalDebt; 
            currentYear.otherNonCurrentLiabilities = lastYearData.otherNonCurrentLiabilities * (1 + growthRate);
            
            currentYear.capitalStock = lastYearData.capitalStock;
            currentYear.oci = lastYearData.oci;
            currentYear.retainedEarnings = lastYearData.retainedEarnings + currentYear.netIncome;
            currentYear.equity = currentYear.capitalStock + currentYear.retainedEarnings + currentYear.oci;

            const totalAssetsExCash = currentYear.ar + currentYear.inv + currentYear.otherCurrentAssets + currentYear.netPPE + currentYear.otherNonCurrentAssets;
            const totalLiabilities = currentYear.ap + currentYear.otherCurrentLiabilities + currentYear.totalDebt + currentYear.otherNonCurrentLiabilities;
            const totalLiabilitiesAndEquity = totalLiabilities + currentYear.equity;
            
            currentYear.cash = totalLiabilitiesAndEquity - totalAssetsExCash;
            currentYear.totalAssets = totalAssetsExCash + currentYear.cash;
            currentYear.check = currentYear.totalAssets - (totalLiabilities + currentYear.equity);

            // --- Cash Flow Statement ---
            const changeInOperatingAssets = (currentYear.ar + currentYear.inv) - (lastYearData.ar + lastYearData.inv);
            const changeInOperatingLiabilities = currentYear.ap - lastYearData.ap;
            const changeInOtherNonCurrentAssets = currentYear.otherNonCurrentAssets - lastYearData.otherNonCurrentAssets;
            const changeInOtherNonCurrentLiabilities = currentYear.otherNonCurrentLiabilities - lastYearData.otherNonCurrentLiabilities;
            
            currentYear.changeInOperatingAssets = changeInOperatingAssets;
            currentYear.changeInOperatingLiabilities = changeInOperatingLiabilities;
            currentYear.changeInOtherNonCurrentAssets = changeInOtherNonCurrentAssets;
            currentYear.changeInOtherNonCurrentLiabilities = changeInOtherNonCurrentLiabilities;

            currentYear.cfo = currentYear.netIncome + currentYear.depreciation - changeInOperatingAssets + changeInOperatingLiabilities - changeInOtherNonCurrentAssets + changeInOtherNonCurrentLiabilities;
            
            currentYear.cfi = -currentYear.capex;
            
            currentYear.changeInDebt = currentYear.totalDebt - lastYearData.totalDebt;
            currentYear.shareRepurchases = 0;
            currentYear.dividends = 0;
            currentYear.cff = currentYear.changeInDebt - currentYear.shareRepurchases - currentYear.dividends;
            
            currentYear.netChangeInCash = currentYear.cfo + currentYear.cfi + currentYear.cff;

            lastYearData = currentYear;
            return currentYear;
        });

        return results;
  }, [financialData, pastThreeYears, pastRatios, baseRevenue, growthRate, ebitMargin, taxRate, depreciationRate, capexRate, costOfDebt, totalDebt, cashAndEquivalents]);

  const sensitivityAnalysisData = useMemo(() => {
    const projectionYearsCount = projections.length;
    if (projectionYearsCount === 0) return null;
    
    const lastFCFF = projections[projectionYearsCount - 1].fcff;
    if (!isFinite(lastFCFF)) return null;

    const waccRange = [-0.01, -0.005, 0, 0.005, 0.01].map(d => wacc + d);
    const terminalGrowthRateRange = [-0.01, -0.005, 0, 0.005, 0.01].map(d => terminalGrowthRate + d);

    const results = waccRange.map(currentWacc => {
      const currentSumOfPvFcff = projections.reduce((sum, p) => sum + (p.fcff / Math.pow(1 + currentWacc, p.year)), 0);

      return terminalGrowthRateRange.map(currentTerminalGrowthRate => {
        if (currentWacc <= currentTerminalGrowthRate) {
          return null; // Invalid calculation
        }
        
        const terminalValue = (lastFCFF * (1 + currentTerminalGrowthRate)) / (currentWacc - currentTerminalGrowthRate);
        const pvOfTerminalValue = terminalValue / Math.pow(1 + currentWacc, projectionYearsCount);
        const enterpriseValue = currentSumOfPvFcff + pvOfTerminalValue;
        const totalCash = cashAndEquivalents + additionalCashLikeAssets;
        const netDebt = totalDebt - totalCash;
        const equityValue = enterpriseValue - netDebt;
        const intrinsicValue = sharesOutstanding > 0 ? (equityValue * 10000) / (sharesOutstanding * 10000) : 0;
        
        return intrinsicValue;
      });
    });

    return { waccRange, terminalGrowthRateRange, results };
  }, [projections, wacc, terminalGrowthRate, totalDebt, cashAndEquivalents, sharesOutstanding, additionalCashLikeAssets]);

  const DEBT_PREMIUMS = [
    { threshold: 0.0, premium: 0.0 },
    { threshold: 0.2, premium: 0.002 }, // D/E > 20%
    { threshold: 0.4, premium: 0.005 }, // D/E > 40%
    { threshold: 0.6, premium: 0.010 }, // D/E > 60%
    { threshold: 1.0, premium: 0.020 }, // D/E > 100%
    { threshold: 1.5, premium: 0.030 }, // D/E > 150%
    { threshold: 2.0, premium: 0.040 }, // D/E > 200%
    { threshold: 3.0, premium: 0.050 }, // D/E > 300%
    { threshold: 5.0, premium: 0.060 }, // D/E > 500%
  ];

  const optimalCapitalStructureData = useMemo(() => {
    if (!beta || !marketCap || !totalDebt || projections.length < 5) return null;

    // 1. Unlever Beta
    const currentDeRatio = totalDebt > 0 && marketCap > 0 ? totalDebt / marketCap : 0;
    const unleveredBeta = beta / (1 + (1 - taxRate) * currentDeRatio);
    
    // 2. Establish a baseline cost of debt for a zero-debt company
    const baseCostOfDebt = riskFreeRate + 0.01;

    const debtRatios = Array.from({ length: 10 }, (_, i) => i * 0.1); // 0% to 90%
    
    const results = debtRatios.map(debtRatio => {
        const equityRatio = 1 - debtRatio;
        const newDeRatio = equityRatio > 0.001 ? debtRatio / equityRatio : Infinity;

        // 3. Calculate new Cost of Debt by adding a premium based on D/E ratio
        const foundTier = [...DEBT_PREMIUMS].reverse().find(p => newDeRatio >= p.threshold);
        const premium = foundTier ? (foundTier.premium || 0) : 0;
        const newCostOfDebt = baseCostOfDebt + premium;
        const newAfterTaxCostOfDebt = newCostOfDebt * (1 - taxRate);

        // 4. Relever Beta and cap it at 2.0 for realism
        const newLeveredBeta = Math.min(2, unleveredBeta * (1 + (1 - taxRate) * newDeRatio));

        // 5. Recalculate Ke and WACC
        const newCostOfEquity = riskFreeRate + newLeveredBeta * erp;
        const newWacc = (newCostOfEquity * equityRatio) + (newAfterTaxCostOfDebt * debtRatio);

        // 6. Recalculate Enterprise Value with the new WACC
        if (newWacc <= terminalGrowthRate) {
             return { debtRatio, newLeveredBeta, newCostOfDebt, newAfterTaxCostOfDebt, newCostOfEquity, newWacc: -Infinity, newEnterpriseValue: -Infinity };
        }
        
        const discountedProjections = projections.map(p => ({
          ...p,
          presentValue: p.fcff / Math.pow(1 + newWacc, p.year)
        }));
        const sumOfPvFcff = discountedProjections.reduce((sum, p) => sum + p.presentValue, 0);
        const lastFCFF = projections.length > 0 ? projections[projections.length - 1].fcff : 0;
        const terminalValue = (lastFCFF * (1 + terminalGrowthRate)) / (newWacc - terminalGrowthRate);
        const pvOfTerminalValue = terminalValue / Math.pow(1 + newWacc, projections.length);
        const newEnterpriseValue = sumOfPvFcff + pvOfTerminalValue;

        return { debtRatio, newLeveredBeta, newCostOfDebt, newAfterTaxCostOfDebt, newCostOfEquity, newWacc, newEnterpriseValue };
    });

    let optimalIndex = -1;
    let minWacc = Infinity;
    results.forEach((res, index) => {
        if (isFinite(res.newWacc) && res.newWacc < minWacc) {
            minWacc = res.newWacc;
            optimalIndex = index;
        }
    });

    return { results, optimalIndex, unleveredBeta, baseCostOfDebt };
  }, [beta, marketCap, totalDebt, taxRate, riskFreeRate, erp, costOfDebt, projections, terminalGrowthRate]);

  const handleDownloadPdf = async () => {
    if (!financialData) return;
    
    const pdfButton = document.querySelector('.pdf-button');
    const fileLoadButton = document.querySelector('.file-load-button');
    const apiKeyGroup = document.querySelector('.api-key-group');
    const aiReportSection = document.getElementById('pdf-section-ai-analysis');

    const elementsToHide: HTMLElement[] = [];
    if (pdfButton) elementsToHide.push(pdfButton as HTMLElement);
    if (fileLoadButton) elementsToHide.push(fileLoadButton as HTMLElement);
    if (apiKeyGroup) elementsToHide.push(apiKeyGroup as HTMLElement);


    if (aiReportSection) {
        const genButton = aiReportSection.querySelector('.generate-button');
        const description = aiReportSection.querySelector('.description-text');
        if (genButton) elementsToHide.push(genButton as HTMLElement);
        if (description) elementsToHide.push(description as HTMLElement);
    }

    const analysisResultHeaders = document.querySelectorAll('.analysis-content > h3');
    analysisResultHeaders.forEach(header => {
        elementsToHide.push(header as HTMLElement);
    });

    setIsSavingPdf(true);
    elementsToHide.forEach(el => el.style.visibility = 'hidden');

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const A4_WIDTH = 210;
        const A4_HEIGHT = 297;
        const PADDING = 10;

        const allSections = [
            'pdf-section-past-is',
            'pdf-section-past-bs',
            'pdf-section-ratios-and-assumptions',
            ...(fullProjections ? ['pdf-section-projections-is', 'pdf-section-projections-bs', 'pdf-section-projections-cf', 'pdf-section-projections-fcff'] : []),
            'pdf-section-wacc',
            'pdf-section-terminal-value',
            'pdf-section-equity-and-sensitivity',
            ...(optimalCapitalStructureData ? ['pdf-section-optimal-capital'] : []),
            ...(analysisText ? ['pdf-section-ai-analysis'] : [])
        ];
        
        const paginatedSectionIds = ['pdf-section-ai-analysis'];
        
        for (let i = 0; i < allSections.length; i++) {
            const sectionId = allSections[i];
            const element = document.getElementById(sectionId);
            if (!element) continue;

            if (i > 0) {
                pdf.addPage();
            }

            if (paginatedSectionIds.includes(sectionId)) {
                // Smart pagination for long content
                const canvas = await html2canvas(element, { scale: 2, useCORS: true });
                const { width: imgWidth, height: imgHeight } = canvas;
                
                const contentWidth = A4_WIDTH - PADDING * 2;
                const contentHeight = A4_HEIGHT - PADDING * 2;
                const ratio = contentWidth / imgWidth;
                const pageHeightInPixels = contentHeight / ratio;

                // Get all paragraph and heading elements to avoid splitting them
                const contentBlocks = element.querySelectorAll('.analysis-result-text h4, .analysis-result-text p');
                const elementRect = element.getBoundingClientRect();
                const scaleFactor = 2; // scale passed to html2canvas
                const blockOffsets = Array.from(contentBlocks).map(block => {
                    const rect = block.getBoundingClientRect();
                    return {
                        top: (rect.top - elementRect.top) * scaleFactor,
                        bottom: (rect.bottom - elementRect.top) * scaleFactor,
                    };
                });

                let position = 0;
                let isFirstSliceOfSection = true;

                while (position < imgHeight) {
                    if (!isFirstSliceOfSection) {
                        pdf.addPage();
                    }
                    
                    let sliceHeight;
                    const potentialEnd = position + pageHeightInPixels;
                    
                    if (potentialEnd >= imgHeight) {
                        // Last page, so take the rest of the content
                        sliceHeight = imgHeight - position;
                    } else {
                        // Find the last block that fits COMPLETELY on the current page.
                        let lastFittingBlockBottom = position;
                        
                        for (const block of blockOffsets) {
                            // Check blocks that start on or after the current position
                            if (block.top >= position) {
                                // If the block fits entirely before the page break
                                if (block.bottom <= potentialEnd) {
                                    lastFittingBlockBottom = block.bottom;
                                } else {
                                    // This is the first block that doesn't fit, so we stop here.
                                    // The page break will occur before this block.
                                    break;
                                }
                            }
                        }

                        // If we found a block that fits, slice after it.
                        // Otherwise (e.g., a single block is taller than a page), just take the full page height.
                        if (lastFittingBlockBottom > position) {
                            sliceHeight = lastFittingBlockBottom - position;
                        } else {
                            sliceHeight = pageHeightInPixels;
                        }
                    }
                    
                    // Ensure sliceHeight is not zero to prevent infinite loops, and doesn't exceed bounds
                    sliceHeight = Math.max(1, Math.min(sliceHeight, imgHeight - position));

                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = imgWidth;
                    pageCanvas.height = sliceHeight;
                    const pageCtx = pageCanvas.getContext('2d');
                    if (pageCtx) {
                        pageCtx.drawImage(canvas, 0, position, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
                    }

                    const pageImgData = pageCanvas.toDataURL('image/png');
                    const pdfSliceHeight = sliceHeight * ratio;
                    
                    pdf.addImage(pageImgData, 'PNG', PADDING, PADDING, contentWidth, pdfSliceHeight);

                    position += sliceHeight;
                    isFirstSliceOfSection = false;
                }

            } else {
                // Original logic for non-paginated sections
                const canvas = await html2canvas(element, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const { width: imgWidth, height: imgHeight } = canvas;
                const ratio = imgWidth / imgHeight;

                const contentWidth = A4_WIDTH - PADDING * 2;
                const contentHeight = A4_HEIGHT - PADDING * 2;

                let pdfImgWidth = contentWidth;
                let pdfImgHeight = pdfImgWidth / ratio;

                if (pdfImgHeight > contentHeight) {
                    pdfImgHeight = contentHeight;
                    pdfImgWidth = pdfImgHeight * ratio;
                }

                const x = (A4_WIDTH - pdfImgWidth) / 2;
                const y = (A4_HEIGHT - pdfImgHeight) / 2;

                pdf.addImage(imgData, 'PNG', x, y, pdfImgWidth, pdfImgHeight);
            }
        }

        const companyName = financialData?.companyProfile["기업명"] || 'Company';
        pdf.save(`${companyName}_DCF_Analysis.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
        elementsToHide.forEach(el => el.style.visibility = 'visible');
        setIsSavingPdf(false);
    }
  };
  
  const generateCompanyAnalysis = async () => {
    if (!apiKey) {
        setAnalysisError("AI 분석을 사용하려면 먼저 Gemini API 키를 입력하고 저장해주세요.");
        return;
    }
    
    if (!financialData || !pastRatios || !valuationDetails || !pastThreeYears) {
        setAnalysisError("분석을 위한 데이터가 부족합니다.");
        return;
    }

    setIsGeneratingAnalysis(true);
    setAnalysisError(null);
    setAnalysisText("");

    try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
            당신은 전문 재무 분석가입니다. 아래 제공된 데이터를 바탕으로 '${financialData.companyProfile["기업명"]}'에 대한 심층적인 기업 분석 보고서를 한국어로 작성해주세요.

            보고서는 다음 구조를 따라야 합니다:
            1.  **기업 개요 및 과거 실적 분석**: 기업의 전반적인 상황과 지난 3년간의 재무 성과(매출 성장, 수익성 등)를 평가합니다.
            2.  **미래 현금흐름 추정 분석**: DCF 모델에 사용된 주요 가정(매출 성장률, 영업이익률 등)의 타당성을 개별적으로 검토합니다. 예를 들어, 매출 성장률 가정을 분석한 직후에 "가이드라인:"을 추가하고, 이어서 영업이익률 가정을 분석한 직후에 "가이드라인:"을 추가하는 방식으로 진행해주세요. 각 가이드라인에서는 해당 가정이 동종 업계 평균이나 현재 경제 상황에 비추어 적정한 수준인지에 대한 구체적인 조언을 제공하고, 추천하는 수치는 **굵은 글씨**로 강조해야 합니다.
            3.  **가치평가 요약**: 산출된 내재가치와 현재 기업가치를 비교하며, 가치평가 결과에 대한 해석을 제공합니다.
            4.  **종합 결론 및 주요 리스크**: 분석을 종합하여 투자 관점에서의 결론을 내리고, 잠재적인 주요 리스크 요인을 명시합니다.

            ---

            ### 주요 데이터

            **1. 기업명**: ${financialData.companyProfile["기업명"]}

            **2. 과거 3년 실적 (단위: 만원)**
            -   **매출액**: ${pastThreeYears.map(y => `${y}년: ${Math.round(getLatestValue(financialData.incomeStatement, '매출액', y) / 10).toLocaleString()}`).join(', ')}
            -   **영업이익**: ${pastThreeYears.map(y => `${y}년: ${Math.round(getLatestValue(financialData.incomeStatement, '영업이익', y) / 10).toLocaleString()}`).join(', ')}
            -   **과거 3년 평균 매출 성장률**: ${formatPercentage(pastRatios.avgRevenueGrowthRate)}
            -   **과거 3년 평균 영업이익률**: ${formatPercentage(pastRatios.avgOperatingMargin)}

            **3. DCF 주요 가정**
            -   **향후 5년 연평균 매출 성장률**: ${formatPercentage(growthRate)}
            -   **목표 영업이익률**: ${formatPercentage(ebitMargin)}
            -   **영구성장률**: ${formatPercentage(terminalGrowthRate)}
            -   **가중평균자본비용(WACC)**: ${formatPercentage(wacc)}

            **4. 가치평가 결과 (단위: 만원)**
            -   **기업가치(EV)**: ${isFinite(valuationDetails.enterpriseValue) ? Math.round(valuationDetails.enterpriseValue).toLocaleString() : '계산 불가'}
            -   **자기자본가치**: ${isFinite(valuationDetails.equityValue) ? Math.round(valuationDetails.equityValue).toLocaleString() : '계산 불가'}
            -   **주당 내재가치**: ${isFinite(valuationDetails.intrinsicValue) ? `${Math.round(valuationDetails.intrinsicValue).toLocaleString()} 원` : '계산 불가'}
            -   **현재 자기자본가치 (비교용)**: ${Math.round(marketCap).toLocaleString()}

            ---

            위 데이터를 바탕으로, 각 섹션에 맞춰 전문적이고 통찰력 있는 분석을 제공해주세요. 보고서는 명확하고 이해하기 쉬운 언어로 작성되어야 합니다. 별도의 서론이나 보고서 전체 제목 없이, 바로 첫 번째 섹션의 내용부터 시작해주세요. 각 섹션의 제목은 ### 으로 시작하는 마크다운 헤더로, 강조하고 싶은 부분은 **굵은 글씨**로 표시해주세요.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        setAnalysisText(response.text);

    } catch (error) {
        console.error("AI analysis generation failed:", error);
        setAnalysisError("AI 분석 보고서 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
        setIsGeneratingAnalysis(false);
    }
};

  return (
    <div className="container">
        <header>
            <div className="header-content">
                <div className="header-text">
                    <h1>{financialData ? `${financialData.companyProfile["기업명"]} DCF 가치평가` : '기업 DCF 가치평가 도구'}</h1>
                    <p>{financialData ? '아래 가정을 수정하여 기업의 내재가치를 분석하세요.' : '분석할 기업의 재무제표 JSON 파일을 불러오세요.'}</p>
                </div>
                 <div className="header-buttons">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                    />
                    <button className="file-load-button" onClick={handleLoadFileClick}>
                        JSON 파일 불러오기
                    </button>
                    <button className="pdf-button" onClick={handleDownloadPdf} disabled={isSavingPdf || !financialData}>
                        {isSavingPdf ? '저장 중...' : 'PDF로 저장'}
                    </button>
                    <div className="api-key-group">
                        <input
                            type="password"
                            className="api-key-input"
                            placeholder="Gemini API 키 입력"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                        />
                        <button className="api-key-save-button" onClick={handleSaveApiKey}>
                            키 저장
                        </button>
                    </div>
                </div>
            </div>
        </header>
        
        {financialData && pastThreeYears ? (() => {
          const { enterpriseValue, equityValue, intrinsicValue } = valuationDetails;
          const operatingIncomesForTable = getValuesForYears(financialData.incomeStatement, '영업이익', pastThreeYears);
          const depreciationsForTableIS = getValuesForYears(financialData.incomeStatement, '감가상각비', pastThreeYears);
          const depreciationsForTableCOGM = financialData.costOfGoodsManufactured
              ? getValuesForYears(financialData.costOfGoodsManufactured, '감가상각비', pastThreeYears)
              : pastThreeYears.map(() => 0);
          const depreciationsForTable = depreciationsForTableIS.map((v, i) => v + depreciationsForTableCOGM[i]);
          const ebitdasForTable = operatingIncomesForTable.map((v, i) => v + depreciationsForTable[i]);
          const otherExpensesForTable = getSumOfValuesForYears(financialData.incomeStatement, ['유형자산처분손실', '리스자산처분손실', '기타영업외비용', '기타비용'], pastThreeYears);
          const cashAndEqForTable = getSumOfValuesForYears(financialData.balanceSheet, CURRENT_CASH_ACCOUNTS, pastThreeYears);
          const receivablesForTable = getValuesForYears(financialData.balanceSheet, '매출채권', pastThreeYears);
          const inventoriesForTable = getValuesForYears(financialData.balanceSheet, '재고자산', pastThreeYears);
          const currentAssetsForTable = getValuesForYears(financialData.balanceSheet, '유동자산', pastThreeYears);
          const otherCurrentAssetsForTable = currentAssetsForTable.map((v, i) => v - cashAndEqForTable[i] - receivablesForTable[i] - inventoriesForTable[i]);
          const tangibleAssetsForTable = getValuesForYears(financialData.balanceSheet, '유형자산', pastThreeYears);
          const nonCurrentAssetsForTable = getValuesForYears(financialData.balanceSheet, '비유동자산', pastThreeYears);
          const nonCurrentInvestmentsForTable = getSumOfValuesForYears(financialData.balanceSheet, NON_CURRENT_INVESTMENT_ACCOUNTS, pastThreeYears);
          const otherNonCurrentAssetsForTable = nonCurrentAssetsForTable.map((v, i) => v - tangibleAssetsForTable[i] - nonCurrentInvestmentsForTable[i]);
          const totalAssetsForTable = getValuesForYears(financialData.balanceSheet, '자산', pastThreeYears);
          const payablesForTable = getValuesForYears(financialData.balanceSheet, '매입채무', pastThreeYears);
          const shortTermDebtForTable = getValuesForYears(financialData.balanceSheet, '단기차입금', pastThreeYears);
          const currentLiabilitiesForTable = getValuesForYears(financialData.balanceSheet, '유동부채', pastThreeYears);
          const otherCurrentLiabilitiesForTable = currentLiabilitiesForTable.map((v, i) => v - payablesForTable[i] - shortTermDebtForTable[i]);
          const longTermDebtForTable = getSumOfValuesForYears(financialData.balanceSheet, ['사채', '장기차입금'], pastThreeYears);
          const nonCurrentLiabilitiesForTable = getValuesForYears(financialData.balanceSheet, '비유동부채', pastThreeYears);
          const otherNonCurrentLiabilitiesForTable = nonCurrentLiabilitiesForTable.map((v, i) => v - longTermDebtForTable[i]);
          const totalLiabilitiesForTable = getValuesForYears(financialData.balanceSheet, '부채', pastThreeYears);
          const capitalStockForTable = getValuesForYears(financialData.balanceSheet, '자본금', pastThreeYears);
          const retainedEarningsForTable = getValuesForYears(financialData.balanceSheet, '이익잉여금', pastThreeYears);
          const ociForTable = getValuesForYears(financialData.balanceSheet, '기타포괄손익누계액', pastThreeYears);
          const totalEquityForTable = getValuesForYears(financialData.balanceSheet, '자본', pastThreeYears);
          const checkRowForTable = totalAssetsForTable.map((v, i) => v - (totalLiabilitiesForTable[i] + totalEquityForTable[i]));

          return (
            <>
                <div id="pdf-section-past-is" className="card">
                    <h2>주요 재무 현황 (과거 3년) - 손익계산서</h2>
                    <div className="table-container">
                        <table className="financial-table">
                            <thead>
                                <tr>
                                    <th>계정과목 (단위: 만원)</th>
                                    {pastThreeYears.map(year => <th key={year}>{year}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>매출액</td>
                                    {getValuesForYears(financialData.incomeStatement, '매출액', pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>매출원가</td>
                                    {getValuesForYears(financialData.incomeStatement, '매출원가', pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>매출총이익</td>
                                    {getValuesForYears(financialData.incomeStatement, '매출총이익', pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>연구개발비</td>
                                    {getValuesForYears(financialData.incomeStatement, '연구개발비', pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>판매관리비</td>
                                    {getValuesForYears(financialData.incomeStatement, ['판매관리비', '판매비와관리비'], pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>영업이익 (EBIT)</td>
                                    {operatingIncomesForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                 <tr>
                                    <td>이자수익</td>
                                    {getValuesForYears(financialData.incomeStatement, '이자수익', pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>이자비용</td>
                                    {getValuesForYears(financialData.incomeStatement, '이자비용', pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>기타비용</td>
                                    {otherExpensesForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>세전이익</td>
                                    {getValuesForYears(financialData.incomeStatement, ['세전이익', '법인세비용차감전순손익'], pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>세금</td>
                                    {getValuesForYears(financialData.incomeStatement, ['세금', '법인세비용'], pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>순이익</td>
                                    {getValuesForYears(financialData.incomeStatement, '당기순이익', pastThreeYears).map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>감가상각비 (판관비)</td>
                                    {depreciationsForTableIS.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                {financialData.costOfGoodsManufactured && depreciationsForTableCOGM.some(d => d !== 0) && (
                                   <tr>
                                        <td>감가상각비 (제조원가)</td>
                                        {depreciationsForTableCOGM.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                   </tr>
                                )}
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>총 감가상각비</td>
                                    {depreciationsForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>감가상각비 포함 영업이익 (EBITDA)</td>
                                    {ebitdasForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="pdf-section-past-bs" className="card">
                    <h2>주요 재무 현황 (과거 3년) - 재무상태표</h2>
                    <div className="table-container">
                        <table className="financial-table">
                            <thead>
                                <tr>
                                    <th>계정과목 (단위: 만원)</th>
                                    {pastThreeYears.map(year => <th key={year}>{year}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>현금및현금성자산</td>
                                    {cashAndEqForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>매출채권</td>
                                    {receivablesForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>재고자산</td>
                                    {inventoriesForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>기타 유동자산</td>
                                    {otherCurrentAssetsForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>유형자산</td>
                                    {tangibleAssetsForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>투자자산</td>
                                    {nonCurrentInvestmentsForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>기타 비유동자산</td>
                                    {otherNonCurrentAssetsForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>자산총계</td>
                                    {totalAssetsForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                
                                <tr style={{borderTop: '2px solid #e2e8f0'}}>
                                    <td>매입채무</td>
                                    {payablesForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>단기차입금</td>
                                    {shortTermDebtForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>기타 유동부채</td>
                                    {otherCurrentLiabilitiesForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>장기 부채</td>
                                    {longTermDebtForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>기타 비유동부채</td>
                                    {otherNonCurrentLiabilitiesForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>부채총계</td>
                                    {totalLiabilitiesForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>

                                <tr style={{borderTop: '2px solid #e2e8f0'}}>
                                    <td>자본금</td>
                                    {capitalStockForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>이익잉여금</td>
                                    {retainedEarningsForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr>
                                    <td>기타포괄손익</td>
                                    {ociForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                <tr style={{fontWeight: 'bold'}}>
                                    <td>자본총계</td>
                                    {totalEquityForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                                
                                <tr style={{borderTop: '2px solid #e2e8f0'}}>
                                    <td>체크</td>
                                    {checkRowForTable.map((v, i) => <td key={i}>{Math.round(v / 10).toLocaleString()}</td>)}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div id="pdf-section-ratios-and-assumptions">
                    {pastRatios && (
                        <div className="card">
                            <h2>과거 3년 주요 비율 분석</h2>
                            <div className="table-container">
                                <table className="financial-table">
                                    <thead>
                                        <tr>
                                            <th>비율 (매출 대비)</th>
                                            {pastThreeYears.map(year => <th key={year}>{year}</th>)}
                                            <th>평균</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>매출액 성장률 (%)</td>
                                            {pastRatios.revenueGrowthRates.map((r, i) => <td key={i}>{formatPercentage(r)}</td>)}
                                            <td>{formatPercentage(pastRatios.avgRevenueGrowthRate)}</td>
                                        </tr>
                                        <tr>
                                            <td>영업이익률 (%)</td>
                                            {pastRatios.operatingMargins.map((r, i) => <td key={i}>{formatPercentage(r)}</td>)}
                                            <td>{formatPercentage(pastRatios.avgOperatingMargin)}</td>
                                        </tr>
                                        <tr>
                                            <td>당기순이익률 (%)</td>
                                            {pastRatios.netMargins.map((r, i) => <td key={i}>{formatPercentage(r)}</td>)}
                                            <td>{formatPercentage(pastRatios.avgNetMargin)}</td>
                                        </tr>
                                        <tr>
                                            <td>감가상각비 (%)</td>
                                            {pastRatios.depreciationRates.map((r, i) => <td key={i}>{formatPercentage(r)}</td>)}
                                            <td>{formatPercentage(pastRatios.avgDepreciationRate)}</td>
                                        </tr>
                                        <tr>
                                            <td>자본적 지출 (CAPEX) (%)</td>
                                            {pastRatios.capexRates.map((r, i) => <td key={i}>{formatPercentage(r)}</td>)}
                                            <td>{formatPercentage(pastRatios.avgCapexRate)}</td>
                                        </tr>
                                        <tr>
                                            <td>순운전자본 (NWC) (%)</td>
                                            {pastRatios.nwcRates.map((r, i) => <td key={i}>{formatPercentage(r)}</td>)}
                                            <td>{formatPercentage(pastRatios.avgNwcRate)}</td>
                                        </tr>
                                        <tr>
                                            <td>이자비용 / 총부채 (%)</td>
                                            {pastRatios.interestRates.map((r, i) => <td key={i}>{formatPercentage(r)}</td>)}
                                            <td>{formatPercentage(pastRatios.avgInterestRate)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    <div className="card assumptions-card">
                        <h2>1. 현금흐름 추정 가정</h2>
                        <div className="input-group">
                            <div className="input-item">
                                <label>기준 매출액 (만원)</label>
                                <input type="text" inputMode="numeric" value={inputValues.baseRevenue} onChange={e => handleInputChange('baseRevenue', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('baseRevenue', 'formatted')} onKeyDown={e => handleInputKeyDown(e, 'baseRevenue', 'formatted')} />
                            </div>
                            <div className="input-item">
                                <label>연평균 매출 성장률 (%)</label>
                                <input type="number" step="0.1" value={inputValues.growthRate} onChange={e => handleInputChange('growthRate', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('growthRate', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'growthRate', 'percent')} />
                            </div>
                            <div className="input-item">
                                <label>영업이익률 (EBIT Margin) (%)</label>
                                <input type="number" step="0.1" value={inputValues.ebitMargin} onChange={e => handleInputChange('ebitMargin', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('ebitMargin', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'ebitMargin', 'percent')} />
                            </div>
                            <div className="input-item">
                                <label>법인세율 (%)</label>
                                <input type="number" step="0.1" value={inputValues.taxRate} onChange={e => handleInputChange('taxRate', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('taxRate', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'taxRate', 'percent')} />
                            </div>
                            <div className="input-item">
                                <label>감가상각비 (매출 대비 %)</label>
                                <input type="number" step="0.1" value={inputValues.depreciationRate} onChange={e => handleInputChange('depreciationRate', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('depreciationRate', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'depreciationRate', 'percent')} />
                            </div>
                            <div className="input-item">
                                <label>자본적 지출 (매출 대비 %)</label>
                                <input type="number" step="0.1" value={inputValues.capexRate} onChange={e => handleInputChange('capexRate', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('capexRate', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'capexRate', 'percent')} />
                            </div>
                            <div className="input-item">
                                <label>순운전자본 (매출 대비 %)</label>
                                <input type="number" step="0.1" value={inputValues.nwcRate} onChange={e => handleInputChange('nwcRate', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('nwcRate', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'nwcRate', 'percent')} />
                            </div>
                            <div className="input-item">
                                <label>현금성 투자자산 (추가) (만원)</label>
                                <input type="text" inputMode="numeric" value={inputValues.additionalCashLikeAssets} onChange={e => handleInputChange('additionalCashLikeAssets', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('additionalCashLikeAssets', 'formatted')} onKeyDown={e => handleInputKeyDown(e, 'additionalCashLikeAssets', 'formatted')} />
                                <p className="input-helper-text">자기자본가치 계산 시 현금에 합산됩니다.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {fullProjections && (
                    <>
                        <div id="pdf-section-projections-is" className="card">
                            <h2>미래 손익계산서 추정 (단위: 만원)</h2>
                            <div className="table-container">
                                <table className="financial-table">
                                    <thead>
                                        <tr>
                                            <th>계정과목</th>
                                            {fullProjections.map((p, i) => <th key={i}>Y+{i+1}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>매출액</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.revenue).toLocaleString()}</td>)}
                                        </tr>
                                         <tr>
                                            <td>매출원가</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.cogs).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>매출총이익</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.grossProfit).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>연구개발비</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.rd).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>판매관리비</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.sga).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>영업이익 (EBIT)</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.ebit).toLocaleString()}</td>)}
                                        </tr>
                                         <tr>
                                            <td>이자수익</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.interestIncome).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>이자비용</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.interestExpense).toLocaleString()}</td>)}
                                        </tr>
                                         <tr>
                                            <td>기타비용</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.otherExpenses).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>세전이익</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.ebt).toLocaleString()}</td>)}
                                        </tr>
                                         <tr>
                                            <td>세금</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.taxes).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>순이익</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.netIncome).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>감가상각비</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.depreciation).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>감가상각비 포함 영업이익 (EBITDA)</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.ebit + p.depreciation).toLocaleString()}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div id="pdf-section-projections-bs" className="card">
                            <h2>미래 재무상태표 추정 (단위: 만원)</h2>
                            <div className="table-container">
                                <table className="financial-table">
                                    <thead>
                                        <tr>
                                            <th>계정과목</th>
                                            {fullProjections.map((p, i) => <th key={i}>Y+{i+1}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>현금및현금성자산</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.cash).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>매출채권</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.ar).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>재고자산</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.inv).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>기타 유동자산</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.otherCurrentAssets).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>유형자산</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.netPPE).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>기타 비유동자산</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.otherNonCurrentAssets).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>자산총계</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.totalAssets).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{borderTop: '2px solid #e2e8f0'}}>
                                            <td>매입채무</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.ap).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>기타 유동부채</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.otherCurrentLiabilities).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>장기 부채</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.totalDebt).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>기타 비유동부채</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.otherNonCurrentLiabilities).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>부채총계</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.ap + p.otherCurrentLiabilities + p.totalDebt + p.otherNonCurrentLiabilities).toLocaleString()}</td>)}
                                        </tr>
                                         <tr style={{borderTop: '2px solid #e2e8f0'}}>
                                            <td>자본금</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.capitalStock).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>이익잉여금</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.retainedEarnings).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>기타포괄손익</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.oci).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>자본총계</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.equity).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{borderTop: '2px solid #e2e8f0'}}>
                                            <td>체크</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.check).toLocaleString()}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div id="pdf-section-projections-cf" className="card">
                            <h2>미래 현금흐름표 추정 (단위: 만원)</h2>
                             <div className="table-container">
                                <table className="financial-table">
                                    <thead>
                                        <tr>
                                            <th>계정과목</th>
                                            {fullProjections.map((p, i) => <th key={i}>Y+{i+1}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>순이익</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.netIncome).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>감가상각비</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.depreciation).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>운용자산의 감소(증가)</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(-p.changeInOperatingAssets).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>운용부채의 증가(감소)</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.changeInOperatingLiabilities).toLocaleString()}</td>)}
                                        </tr>
                                         <tr>
                                            <td>기타 비유동자산</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(-p.changeInOtherNonCurrentAssets).toLocaleString()}</td>)}
                                        </tr>
                                         <tr>
                                            <td>기타 비유동부채</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.changeInOtherNonCurrentLiabilities).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>영업활동현금</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.cfo).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{borderTop: '2px solid #e2e8f0'}}>
                                            <td>자본 지출</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(-p.capex).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>투자활동현금</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.cfi).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{borderTop: '2px solid #e2e8f0'}}>
                                            <td>장기부채</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.changeInDebt).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>자사주 매입</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(-p.shareRepurchases).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>배당금</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(-p.dividends).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>재무활동현금</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.cff).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold', borderTop: '2px solid #e2e8f0'}}>
                                            <td>현금순변동</td>
                                            {fullProjections.map((p, i) => <td key={i}>{Math.round(p.netChangeInCash).toLocaleString()}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div id="pdf-section-projections-fcff" className="card">
                            <h2>FCFF 추정 요약표</h2>
                            <div className="table-container">
                                <table className="financial-table">
                                    <thead>
                                        <tr>
                                            <th>항목 (단위: 만원)</th>
                                            {projections.map((p, i) => <th key={i}>Y+{i+1}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>매출액</td>
                                            {projections.map((p, i) => <td key={i}>{Math.round(p.revenue).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>EBIT (마진율 {formatPercentage(ebitMargin).slice(0, -1)})</td>
                                            {projections.map((p, i) => <td key={i}>{Math.round(p.ebit).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>(-) 세금 (세율 {formatPercentage(taxRate).slice(0, -1)})</td>
                                            {projections.map((p, i) => <td key={i}>{Math.round(p.ebit - p.nopat).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>NOPAT</td>
                                            {projections.map((p, i) => <td key={i}>{Math.round(p.nopat).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>(+) 감가상각비 (매출의 {formatPercentage(depreciationRate).slice(0, -1)})</td>
                                            {projections.map((p, i) => <td key={i}>{Math.round(p.depreciation).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>(-) CAPEX (매출의 {formatPercentage(capexRate).slice(0, -1)})</td>
                                            {projections.map((p, i) => <td key={i}>{Math.round(p.capex).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td>(-) 순운전자본 변동 (매출 증가분의 {formatPercentage(nwcRate).slice(0, -1)})</td>
                                            {projections.map((p, i) => <td key={i}>{Math.round(p.nwcChange).toLocaleString()}</td>)}
                                        </tr>
                                        <tr style={{fontWeight: 'bold'}}>
                                            <td>FCFF</td>
                                            {projections.map((p, i) => <td key={i}>{Math.round(p.fcff).toLocaleString()}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                <div id="pdf-section-wacc" className="card">
                    <h2>2. 할인율 (WACC) 산정</h2>
                    
                    <div className="wacc-section">
                        <h3>1. 자기자본비용 (Cost of Equity)</h3>
                        <div className="input-group">
                            <div className="input-item">
                                <label>무위험수익률 (Rf) (%)</label>
                                <input type="number" step="0.1" value={inputValues.riskFreeRate} onChange={e => handleInputChange('riskFreeRate', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('riskFreeRate', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'riskFreeRate', 'percent')} />
                            </div>
                            <div className="input-item">
                                <label>베타 (β)</label>
                                <input type="number" step="0.1" value={inputValues.beta} onChange={e => handleInputChange('beta', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('beta', 'number')} onKeyDown={e => handleInputKeyDown(e, 'beta', 'number')} />
                            </div>
                            <div className="input-item">
                                <label>주식위험프리미엄 (ERP) (%)</label>
                                <input type="number" step="0.1" value={inputValues.erp} onChange={e => handleInputChange('erp', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('erp', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'erp', 'percent')} />
                            </div>
                        </div>
                        <div className="calculation-step">
                            <div className="formula-container">
                                Ke = {formatPercentage(riskFreeRate)} + {beta} * {formatPercentage(erp)} = <strong>{formatPercentage(costOfEquity)}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="wacc-section">
                        <h3>2. 타인자본비용 (Cost of Debt)</h3>
                        <div className="input-group">
                            <div className="input-item">
                                <label>타인자본비용 (Kd) (%)</label>
                                <input type="number" step="0.1" value={inputValues.costOfDebt} onChange={e => handleInputChange('costOfDebt', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('costOfDebt', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'costOfDebt', 'percent')} />
                            </div>
                             <div className="input-item readonly">
                                <label>법인세율 (%)</label>
                                <input type="text" value={(taxRate * 100).toFixed(1)} readOnly />
                            </div>
                        </div>
                         <div className="calculation-step">
                            <div className="formula-container">
                                세후 Kd = {formatPercentage(costOfDebt)} * (1 - {formatPercentage(taxRate)}) = <strong>{formatPercentage(afterTaxCostOfDebt)}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="wacc-section">
                        <h3>3. 자본구조 (Capital Structure)</h3>
                         <div className="input-group-vertical">
                            <div className="input-row-with-calc">
                                <div className="input-item">
                                    <label>자기자본가치 (만원)</label>
                                    <input type="text" inputMode="numeric" value={inputValues.marketCap} onChange={e => handleInputChange('marketCap', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('marketCap', 'formatted')} onKeyDown={e => handleInputKeyDown(e, 'marketCap', 'formatted')} />
                                    <p className="input-helper-text">비상장기업은 '자본총계(순자산)'를 기본값으로 사용합니다.</p>
                                </div>
                                <p className="calculation-inline">
                                    자기자본비중 = {Math.round(marketCap).toLocaleString()} / ({Math.round(marketCap).toLocaleString()} + {Math.round(totalDebt).toLocaleString()}) = <strong>{formatPercentage(equityWeight)}</strong>
                                </p>
                            </div>
                            <div className="input-row-with-calc">
                                 <div className="input-item readonly">
                                    <label>총차입금 (만원)</label>
                                     <input type="text" value={inputValues.totalDebt} readOnly />
                                </div>
                                <p className="calculation-inline">
                                   타인자본비중 = {Math.round(totalDebt).toLocaleString()} / ({Math.round(marketCap).toLocaleString()} + {Math.round(totalDebt).toLocaleString()}) = <strong>{formatPercentage(debtWeight)}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="wacc-section">
                        <h3>4. 가중평균자본비용 (WACC)</h3>
                        <div className="calculation-step wacc-final">
                            <p className="formula">WACC = (자기자본비중 * Ke) + (타인자본비중 * 세후 Kd)</p>
                            <p className="calculation">
                                = ({formatPercentage(equityWeight)} * {formatPercentage(costOfEquity)}) + ({formatPercentage(debtWeight)} * {formatPercentage(afterTaxCostOfDebt)}) = <strong className="final-wacc-value">{formatPercentage(wacc)}</strong>
                            </p>
                        </div>
                    </div>
                </div>
                
                <div id="pdf-section-terminal-value" className="card">
                    <h2>3. 영구 성장가치 및 기업가치 산출</h2>
                     <div className="wacc-section">
                        <h3>1. 영구성장률 (Terminal Growth Rate) 가정</h3>
                        <p className="description-text">
                            본 분석에서는 한국의 장기 명목 GDP 성장률 전망치와 장기 인플레이션 목표치 등을 고려하여 <strong>{formatPercentage(0.015)}</strong>를 영구성장률로 가정합니다. 이 값은 기업이 장기적으로 지속 가능한 성장률을 의미하며, 분석의 중요한 가정 중 하나입니다.
                        </p>
                        <div className="input-item input-item--horizontal">
                            <label>영구성장률 (%)</label>
                            <input type="number" step="0.1" value={inputValues.terminalGrowthRate} onChange={e => handleInputChange('terminalGrowthRate', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('terminalGrowthRate', 'percent')} onKeyDown={e => handleInputKeyDown(e, 'terminalGrowthRate', 'percent')} />
                        </div>
                    </div>

                     <div className="wacc-section">
                        <h3>2. FCFF 추정치 요약</h3>
                        <div className="table-container">
                            <table className="financial-table">
                                <thead>
                                    <tr>
                                        <th>항목 (단위: 만원)</th>
                                        {projections.map((p, i) => <th key={i}>Y+{i+1}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>매출액</td>
                                        {projections.map((p, i) => <td key={i}>{Math.round(p.revenue).toLocaleString()}</td>)}
                                    </tr>
                                     <tr style={{fontWeight: 'bold'}}>
                                        <td>NOPAT</td>
                                        {projections.map((p, i) => <td key={i}>{Math.round(p.nopat).toLocaleString()}</td>)}
                                    </tr>
                                     <tr style={{fontWeight: 'bold'}}>
                                        <td>FCFF</td>
                                        {projections.map((p, i) => <td key={i}>{Math.round(p.fcff).toLocaleString()}</td>)}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="wacc-section">
                        <h3>3. 영구가치 (Terminal Value) 산정</h3>
                        <div className="calculation-step">
                            <p className="calculation">
                                영구가치 = {formatCurrency(valuationDetails.lastFCFF, "만원")} * (1 + {formatPercentage(terminalGrowthRate).replace(' ', '')}) / ({formatPercentage(wacc).replace(' ', '')} - {formatPercentage(terminalGrowthRate).replace(' ', '')})
                                = <strong>{isFinite(valuationDetails.terminalValue) ? formatCurrency(valuationDetails.terminalValue, "만원") : "계산 불가 (WACC <= g)"}</strong>
                            </p>
                        </div>
                    </div>
                    
                    <div className="wacc-section">
                        <h3>4. 기업가치 (Enterprise Value) 산출</h3>
                         <div className="enterprise-value-flow">
                            <div className="flow-item">
                                <h4>FCFF 현가 합계</h4>
                                <div className="value-box">
                                    {isFinite(valuationDetails.sumOfPvFcff) ? formatCurrency(valuationDetails.sumOfPvFcff, "만원") : "N/A"}
                                </div>
                            </div>
                            <div className="flow-operator">+</div>
                            <div className="flow-item">
                                <h4>영구가치 현가</h4>
                                <div className="value-box">
                                     {isFinite(valuationDetails.pvOfTerminalValue) ? formatCurrency(valuationDetails.pvOfTerminalValue, "만원") : "N/A"}
                                </div>
                            </div>
                            <div className="flow-operator">=</div>
                            <div className="flow-item result">
                                <h4>기업가치 (EV)</h4>
                                <div className="value-box">
                                    {isFinite(enterpriseValue) ? formatCurrency(enterpriseValue, "만원") : "계산 불가"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="pdf-section-equity-and-sensitivity">
                    <div className="card">
                        <h2>4. 자기자본가치 및 주당 내재가치</h2>
                        <div className="input-group">
                            <div className="input-item readonly">
                                <label>총 현금성자산 (만원)</label>
                                <input type="text" value={Math.round(cashAndEquivalents + additionalCashLikeAssets).toLocaleString()} readOnly />
                                <p className="input-helper-text">재무상태표 현금 + 현금성 투자자산</p>
                            </div>
                            <div className="input-item">
                                <label>총차입금 (만원)</label>
                                <input type="text" inputMode="numeric" value={inputValues.totalDebt} onChange={e => handleInputChange('totalDebt', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('totalDebt', 'formatted')} onKeyDown={e => handleInputKeyDown(e, 'totalDebt', 'formatted')} />
                            </div>
                            <div className="input-item">
                                <label>총 발행주식수 (만 주)</label>
                                <input type="number" step="0.1" value={inputValues.sharesOutstanding} onChange={e => handleInputChange('sharesOutstanding', e.target.value)} onFocus={handleFocus} onBlur={() => handleInputBlur('sharesOutstanding', 'number')} onKeyDown={e => handleInputKeyDown(e, 'sharesOutstanding', 'number')} />
                            </div>
                        </div>
                        
                        <div className="wacc-section">
                            <h3>자기자본가치 (Equity Value) 산출 과정</h3>
                            
                            <p className="formula-text">
                                자기자본가치 = 기업가치(EV) - 순부채 (총차입금 - (현금및현금성자산 + 현금성 투자자산))
                            </p>
                            <div className="calculation-step">
                                <p className="calculation" style={{textAlign: 'center'}}>
                                    = {isFinite(enterpriseValue) ? Math.round(enterpriseValue).toLocaleString() : "N/A"} - ({Math.round(totalDebt).toLocaleString()} - ({Math.round(cashAndEquivalents).toLocaleString()} + {Math.round(additionalCashLikeAssets).toLocaleString()}))
                                    = <strong className="final-wacc-value">{isFinite(equityValue) ? formatCurrency(equityValue, "만원") : "계산 불가"}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="final-results-grid">
                            <div className="final-result-item equity-value">
                                <h4>자기자본가치</h4>
                                <div className="value">{isFinite(equityValue) ? formatCurrency(equityValue, "만원") : "계산 불가"}</div>
                            </div>
                            <div className="final-result-item intrinsic-value">
                                <h4>주당 내재가치</h4>
                                <div className="value">{isFinite(intrinsicValue) ? formatCurrency(intrinsicValue, "원") : "계산 불가"}</div>
                            </div>
                        </div>
                    </div>

                    {sensitivityAnalysisData && (
                    <div className="card">
                        <h2>5. 민감도 분석 (주당 내재가치)</h2>
                        <p className="description-text" style={{marginBottom: '1rem'}}>WACC와 영구성장률(g)의 변화에 따라 주당 내재가치가 어떻게 변하는지 분석합니다.</p>
                        <div className="table-container">
                        <table className="sensitivity-table">
                            <thead>
                            <tr>
                                <th>↓ WACC / g →</th>
                                {sensitivityAnalysisData.terminalGrowthRateRange.map((g, i) => (
                                <th key={i}>{formatPercentage(g)}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {sensitivityAnalysisData.waccRange.map((currentWacc, rowIndex) => (
                                <tr key={rowIndex}>
                                <th>{formatPercentage(currentWacc)}</th>
                                {sensitivityAnalysisData.results[rowIndex].map((value, colIndex) => {
                                    const isBaseCase = rowIndex === 2 && colIndex === 2;
                                    return (
                                    <td key={colIndex} className={isBaseCase ? 'base-case' : ''}>
                                        {value === null || !isFinite(value) ? "N/A" : formatCurrency(value, "원")}
                                    </td>
                                    );
                                })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                    )}
                </div>


                {optimalCapitalStructureData && (
                  <div id="pdf-section-optimal-capital" className="card">
                    <h2>6. 최적 자본구조 분석</h2>
                    <p className="description-text" style={{marginBottom: '1rem'}}>
                        타인자본(부채) 비중 변화에 따른 WACC와 기업가치의 변동을 시뮬레이션하여, 기업가치를 극대화하는 최적의 자본구조를 탐색합니다. 
                        이 분석은 무부채 상태의 기업을 기준으로(무위험수익률 + 최소 신용 스프레드), 부채 비율이 높아질수록 '재무적 곤경 비용'을 프리미엄으로 더하여 타인자본비용(이자율)을 산정합니다.
                    </p>
                    <div className="formula-text" style={{ textAlign: 'center', lineHeight: '1.6', marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            기준 타인자본비용 (무부채) = 무위험수익률 + 기본 프리미엄
                        </p>
                        <p style={{ fontSize: '1.0em', color: 'var(--text-primary)', fontWeight: '500' }}>
                            = {formatPercentage(riskFreeRate).replace(' %', '%')} + 1.00% = <strong style={{ color: 'var(--accent-color)', fontSize: '1.1em' }}>{formatPercentage(optimalCapitalStructureData.baseCostOfDebt)}</strong>
                        </p>
                    </div>
                    <div className="formula-text" style={{ textAlign: 'center', lineHeight: '1.6' }}>
                        <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            무부채 베타 (βU) = 레버리지 베타 (βL) / [1 + (1 - 법인세율) * (총차입금 / 자기자본가치)]
                        </p>
                        <p style={{ fontSize: '1.0em', color: 'var(--text-primary)', fontWeight: '500' }}>
                            = {formatNumber(beta, 2)} / [1 + (1 - {formatPercentage(taxRate).replace(' %', '%')}) * ({Math.round(totalDebt).toLocaleString()} / {Math.round(marketCap).toLocaleString()})] = <strong style={{ color: 'var(--accent-color)', fontSize: '1.1em' }}>{formatNumber(optimalCapitalStructureData.unleveredBeta, 2)}</strong>
                        </p>
                         <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            (시뮬레이션 기준: 현재 가정 하에 계산된 기업의 순수 영업 리스크)
                        </p>
                    </div>
                    <div className="table-container">
                      <table className="sensitivity-table">
                        <thead>
                          <tr>
                            <th>타인자본비중</th>
                            <th>타인자본비용(Kd)</th>
                            <th>자기자본비용(Ke)</th>
                            <th>세후 타인자본비용</th>
                            <th>WACC</th>
                            <th>기업가치(EV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {optimalCapitalStructureData.results.map((row, index) => (
                            <tr key={index} className={index === optimalCapitalStructureData.optimalIndex ? 'optimal-row' : ''}>
                              <td>{formatPercentage(row.debtRatio)}</td>
                              <td>{formatPercentage(row.newCostOfDebt)}</td>
                              <td className="calculation-cell">
                                {formatPercentage(riskFreeRate).replace(/\s/g, '')} + {formatNumber(row.newLeveredBeta, 2)} * {formatPercentage(erp).replace(/\s/g, '')}
                                = <strong>{formatPercentage(row.newCostOfEquity)}</strong>
                              </td>
                              <td>{formatPercentage(row.newAfterTaxCostOfDebt)}</td>
                              <td>{formatPercentage(row.newWacc)}</td>
                              <td>{isFinite(row.newEnterpriseValue) ? formatCurrency(row.newEnterpriseValue, "만원") : "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div id="pdf-section-ai-analysis" className="card">
                    <h2>AI 기반 기업 분석 리포트</h2>
                    <p className="description-text">
                        {apiKey
                          ? "입력된 재무 데이터와 DCF 가정에 기반하여 AI가 생성한 기업 분석 리포트입니다. 아래 버튼을 클릭하여 분석을 시작하세요."
                          : "AI 분석을 사용하려면, 먼저 상단에 Gemini API 키를 입력하고 저장해주세요."
                        }
                    </p>
                    <button
                        className="generate-button"
                        onClick={generateCompanyAnalysis}
                        disabled={isGeneratingAnalysis || !apiKey}
                    >
                        {isGeneratingAnalysis ? '분석 중...' : (apiKey ? 'AI 리포트 생성' : 'API 키를 먼저 저장하세요')}
                    </button>

                    {isGeneratingAnalysis && (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>AI가 보고서를 작성하고 있습니다. 잠시만 기다려주세요...</p>
                        </div>
                    )}

                    {analysisError && <p className="error-message">{analysisError}</p>}

                    {analysisText && (
                        <div className="analysis-content">
                            <div className="analysis-result-text">
                                {renderAnalysisText(analysisText)}
                            </div>
                        </div>
                    )}
                </div>
            </>
          );
        })() : (
            <div className="placeholder-container card">
                <h2>분석 시작하기</h2>
                <p>상단의 'JSON 파일 불러오기' 버튼을 클릭하여 분석할 기업의 재무 데이터 파일을 선택해주세요.</p>
            </div>
        )}

        <footer>
            <p>본 DCF 모델은 교육 및 참고 목적으로 제공되며, 투자에 대한 법적 책임을 지지 않습니다.</p>
        </footer>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
