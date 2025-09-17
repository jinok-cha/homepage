
import { FinancialStatementRow, FinancialRatioMetric } from '../types';

// Helper to safely get a numerical value from financial statements
const getValue = (data: FinancialStatementRow[], account: string, year: string): number | null => {
    const row = data.find(r => r && typeof r['계정과목'] === 'string' && r['계정과목'].trim() === account);
    if (!row) {
        return null;
    }
    const value = (row as any)[year];
    return typeof value === 'number' ? value : null;
};

// Helper to calculate growth rate
const calculateGrowth = (current: number | null, previous: number | null): number | null => {
    if (current === null || previous === null || previous === 0) {
        return null;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
};

// Main calculation function
export const calculateFinancialRatios = (
    balanceSheet: FinancialStatementRow[], 
    incomeStatement: FinancialStatementRow[],
    years: string[]
) => {
    const stability: FinancialRatioMetric[] = [
        { name: '부채비율', values: [], unit: '%' },
        { name: '이자보상배수', values: [], unit: '배' },
        { name: '차입금의존도', values: [], unit: '%' },
    ];
    const profitability: FinancialRatioMetric[] = [
        { name: '영업이익률', values: [], unit: '%' },
        { name: 'ROE', values: [], unit: '%' },
        { name: 'ROIC', values: [], unit: '%' },
    ];
    const activity: FinancialRatioMetric[] = [
        { name: '매출채권회전율', values: [], unit: '회' },
        { name: '재고자산회전율', values: [], unit: '회' },
        { name: '총자본회전율', values: [], unit: '회' },
    ];
    const growth: FinancialRatioMetric[] = [
        { name: '총자산증가율', values: [], unit: '%' },
        { name: '매출액증가율', values: [], unit: '%' },
        { name: '순이익증가율', values: [], unit: '%' },
    ];

    years.forEach((year, index) => {
        // --- Get raw data for the year ---
        const totalAssets = getValue(balanceSheet, '자산', year);
        const totalLiabilities = getValue(balanceSheet, '부채', year);
        const totalEquity = getValue(balanceSheet, '자본', year);
        const shortTermBorrowings = getValue(balanceSheet, '단기차입금', year) ?? 0;
        const longTermBorrowings = getValue(balanceSheet, '장기차입금', year) ?? 0;
        const bonds = getValue(balanceSheet, '사채', year) ?? 0;
        const totalBorrowings = shortTermBorrowings + longTermBorrowings + bonds;
        const cashAndEquivalents = getValue(balanceSheet, '현금및현금성자산', year);
        const accountsReceivable = getValue(balanceSheet, '매출채권', year);
        const inventory = getValue(balanceSheet, '재고자산', year);

        const sales = getValue(incomeStatement, '매출액', year);
        const costOfGoodsSold = getValue(incomeStatement, '매출원가', year);
        const operatingIncome = getValue(incomeStatement, '영업이익', year);
        const netIncome = getValue(incomeStatement, '당기순이익', year);
        const interestExpense = getValue(incomeStatement, '이자비용', year);
        const incomeBeforeTax = getValue(incomeStatement, '법인세비용차감전순손익', year);
        const taxExpense = getValue(incomeStatement, '법인세비용', year);

        // --- Calculate ratios ---
        
        // Stability
        const debtToEquity = (totalLiabilities !== null && totalEquity !== null && totalEquity !== 0) ? (totalLiabilities / totalEquity) * 100 : null;
        const interestCoverage = (operatingIncome !== null && interestExpense !== null && interestExpense !== 0) ? (operatingIncome / interestExpense) : null;
        const debtDependency = (totalAssets !== null && totalAssets !== 0) ? (totalBorrowings / totalAssets) * 100 : null;
        
        stability[0].values.push({ year, value: debtToEquity });
        stability[1].values.push({ year, value: interestCoverage });
        stability[2].values.push({ year, value: debtDependency });

        // Profitability
        const operatingMargin = (sales !== null && sales !== 0 && operatingIncome !== null) ? (operatingIncome / sales) * 100 : null;
        const roe = (netIncome !== null && totalEquity !== null && totalEquity !== 0) ? (netIncome / totalEquity) * 100 : null;
        
        const taxRate = (incomeBeforeTax !== null && incomeBeforeTax > 0 && taxExpense !== null) ? taxExpense / incomeBeforeTax : 0;
        const nopat = operatingIncome !== null ? operatingIncome * (1 - taxRate) : null;
        const investedCapital = (totalEquity !== null && cashAndEquivalents !== null) ? (totalEquity + totalBorrowings - cashAndEquivalents) : null;
        const roic = (nopat !== null && investedCapital !== null && investedCapital !== 0) ? (nopat / investedCapital) * 100 : null;
        
        profitability[0].values.push({ year, value: operatingMargin });
        profitability[1].values.push({ year, value: roe });
        profitability[2].values.push({ year, value: roic });
        
        // Activity
        const receivablesTurnover = (sales !== null && accountsReceivable !== null && accountsReceivable !== 0) ? (sales / accountsReceivable) : null;
        const inventoryTurnover = (costOfGoodsSold !== null && inventory !== null && inventory !== 0) ? (costOfGoodsSold / inventory) : null;
        const totalAssetTurnover = (sales !== null && totalAssets !== null && totalAssets !== 0) ? (sales / totalAssets) : null;

        activity[0].values.push({ year, value: receivablesTurnover });
        activity[1].values.push({ year, value: inventoryTurnover });
        activity[2].values.push({ year, value: totalAssetTurnover });

        // Growth
        let totalAssetGrowth: number | null = null;
        let salesGrowth: number | null = null;
        let netIncomeGrowth: number | null = null;

        if (index > 0) {
            const prevYear = years[index - 1];
            const prevTotalAssets = getValue(balanceSheet, '자산', prevYear);
            totalAssetGrowth = calculateGrowth(totalAssets, prevTotalAssets);

            const prevSales = getValue(incomeStatement, '매출액', prevYear);
            salesGrowth = calculateGrowth(sales, prevSales);

            const prevNetIncome = getValue(incomeStatement, '당기순이익', prevYear);
            netIncomeGrowth = calculateGrowth(netIncome, prevNetIncome);
        }
        
        growth[0].values.push({ year, value: totalAssetGrowth });
        growth[1].values.push({ year, value: salesGrowth });
        growth[2].values.push({ year, value: netIncomeGrowth });
    });

    return { stability, profitability, activity, growth };
};


export const calculateStockValuation = (
    incomes: { [k: string]: number }, 
    assets: { [k: string]: number }, 
    year: number, 
    isRealEstateHeavy: boolean
): { finalValuation: number; netIncomeValue: number; netAssetValue: number } | null => {
    const yearStr = year.toString();
    const prevYear1Str = (year - 1).toString();
    const prevYear2Str = (year - 2).toString();

    const netIncomeY1 = incomes[yearStr];
    const netIncomeY2 = incomes[prevYear1Str];
    const netIncomeY3 = incomes[prevYear2Str];
    
    const netAssetCurrent = assets[yearStr];

    if (netIncomeY1 === undefined || netIncomeY2 === undefined || netIncomeY3 === undefined || netAssetCurrent === undefined) {
        return null;
    }

    const weightedAvgNetIncome = (netIncomeY1 * 3 + netIncomeY2 * 2 + netIncomeY3 * 1) / 6;
    let netIncomeValue = Math.round(weightedAvgNetIncome / 0.10);
    if (netIncomeValue < 0) netIncomeValue = 0;
    
    const netAssetValue = Math.round(netAssetCurrent);
    
    const weights = isRealEstateHeavy ? { income: 2, asset: 3 } : { income: 3, asset: 2 };
    let finalValuation = Math.round(((netIncomeValue * weights.income) + (netAssetValue * weights.asset)) / 5);
    if (finalValuation < 0) finalValuation = 0;

    const eightyPercentOfNetAssetValue = Math.round(netAssetValue * 0.8);
    if (finalValuation < eightyPercentOfNetAssetValue) {
        finalValuation = eightyPercentOfNetAssetValue;
    }

    return { finalValuation, netIncomeValue, netAssetValue };
}

// All values in '억원'
export const calculateInheritanceTax = (
    totalAssetValueEok: number, // in 억원
    financialAssetsEok: number, // in 억원
    hasSpouse: boolean,
    numChildren: number
) => {
    // Convert '억원' to '원' for tax calculation
    const valueInWon = totalAssetValueEok * 100000000;

    // --- Deduction Calculation (공제액 계산) ---
    
    // Financial asset deduction (금융재산 상속공제)
    const financialAssetsInWon = financialAssetsEok * 100000000;
    let calculatedDeduction = 0;
    if (financialAssetsInWon <= 20000000) {
        // 순금융재산가액이 2천만원 이하: 순금융재산가액 전액 공제
        calculatedDeduction = financialAssetsInWon;
    } else {
        // 순금융재산가액이 2천만원 초과: 순금융재산가액의 20%와 2천만원 중 큰 금액
        calculatedDeduction = Math.max(financialAssetsInWon * 0.2, 20000000);
    }
    // 공제액은 2억원을 초과할 수 없음
    const financialAssetDeduction = Math.min(calculatedDeduction, 200000000);


    // Basic deduction (기초공제 2억) + other human deductions (자녀 1인당 5천만)
    const humanDeductions = 200000000 + (numChildren * 50000000);
    // Flat-rate deduction (일괄공제 5억)
    const flatRateDeduction = 500000000;
    // Choose the larger of the two
    const flatRateOrHumanDeduction = Math.max(humanDeductions, flatRateDeduction);
    
    // Spouse deduction (배우자공제) based on Inheritance Tax Act
    let spouseDeduction = 0;
    if (hasSpouse) {
        // 배우자 법정 상속분 계산 (배우자 1.5 : 자녀 1)
        const spouseLegalInheritance = valueInWon * (1.5 / (1.5 + numChildren));
        // 배우자 공제액은 최소 5억, 최대 30억
        spouseDeduction = Math.max(500000000, Math.min(spouseLegalInheritance, 3000000000));
    }
    
    const totalDeduction = flatRateOrHumanDeduction + spouseDeduction + financialAssetDeduction;

    const taxableBase = valueInWon - totalDeduction;

    if (taxableBase <= 0) {
        return { 
            taxAmount: 0, 
            taxableBase: 0, 
            totalDeduction: totalDeduction / 100000000,
            flatRateOrHumanDeduction: flatRateOrHumanDeduction / 100000000,
            spouseDeduction: spouseDeduction / 100000000,
            financialAssetDeduction: financialAssetDeduction / 100000000,
        };
    }

    let taxAmount = 0;
    
    // Progressive tax rates (단위: 원)
    if (taxableBase <= 100000000) { // 1억 이하
        taxAmount = taxableBase * 0.10;
    } else if (taxableBase <= 500000000) { // 5억 이하
        taxAmount = taxableBase * 0.20 - 10000000;
    } else if (taxableBase <= 1000000000) { // 10억 이하
        taxAmount = taxableBase * 0.30 - 60000000;
    } else if (taxableBase <= 3000000000) { // 30억 초과
        taxAmount = taxableBase * 0.40 - 160000000;
    } else { // 30억 초과
        taxAmount = taxableBase * 0.50 - 460000000;
    }
    
    // Convert back to '억원'
    return { 
      taxAmount: taxAmount / 100000000, 
      taxableBase: taxableBase / 100000000,
      totalDeduction: totalDeduction / 100000000,
      flatRateOrHumanDeduction: flatRateOrHumanDeduction / 100000000,
      spouseDeduction: spouseDeduction / 100000000,
      financialAssetDeduction: financialAssetDeduction / 100000000,
    };
};