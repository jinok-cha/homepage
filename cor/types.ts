

export interface CompanyProfile {
    기업명: string;
    영문기업명: string;
    사업자번호: string;
    대표자명: string;
    설립년월: string;
    기업규모: string;
    주소: string;
    신용등급: string;
    주요제품: string;
}

export interface Executive {
  name: string;
  title: string;
  tenure: string;
  relationship:string;
  annualSalary?: number;
}

export interface Shareholder {
  name: string;
  stake?: number;
  relationship: string;
  shares?: number;
}

export interface RelatedCompany {
  name: string;
  business: string;
  relationship: string;
  totalAssets: number;
  revenue: number;
  netIncome: number;
}


export interface FinancialYearData {
    year: string;
    [key: string]: string | number;
}

export interface ChartBar {
    dataKey: string;
    // FIX: Add optional name property for custom legend labels.
    name?: string;
    fill: string;
    stackId?: string;
    labelComponent?: React.ReactElement;
}

export interface ChartLine {
    dataKey: string;
    stroke: string;
    labelPosition?: 'top' | 'bottom';
}

export interface ChartRadar {
    name: string;
    dataKey: string;
    stroke: string;
    fill: string;
}

export interface BarChartConfig {
    data: any[];
    chartType: 'bar';
    bars: ChartBar[];
    unit?: string;
    xAxisKey?: string;
    height?: number;
    hideYAxis?: boolean;
    hideGrid?: boolean;
}

export interface LineChartConfig {
    data: any[];
    chartType: 'line';
    lines: ChartLine[];
    unit?: string;
    hideYAxis?: boolean;
    showDataLabels?: boolean;
    height?: number;
}

export interface RadarChartConfig {
    data: { metric: string; [key: string]: string | number }[];
    chartType: 'radar';
    radars: ChartRadar[];
    polarKey: string;
    height?: number;
}

export interface ComboChartConfig {
    data: any[];
    chartType: 'combo';
    bars: ChartBar[];
    lines: ChartLine[];
    unit?: string;
    unit2?: string;
    xAxisKey?: string;
    height?: number;
}

export interface DiagnosisMetric {
  name: string;
  value: number;
  average: number;
  unit: string;
  trend: 'up' | 'down';
}


export type FinancialChartConfig = BarChartConfig | LineChartConfig | RadarChartConfig | ComboChartConfig;

export type Rating = '최우수' | '우수' | '양호' | '보통' | '미흡' | '열위';

export interface DetailedForecastDataRow {
  year: string;
  baseSales: number;
  baseNetIncome: number;
  baseNetAssets: number;
  baseValuation: number | null;
  costs: number;
  dividends: number;
  adjustedNetIncome: number;
  adjustedNetAssets: number;
  adjustedValuation: number | null;
}

export interface FinancialStatementRow {
    '계정과목': string;
    isHeader?: boolean;
    [key: string]: string | number | boolean | null | undefined;
}

export interface FinancialRatioMetric {
  name: string;
  values: { year: string; value: number | null }[];
  unit: string;
}