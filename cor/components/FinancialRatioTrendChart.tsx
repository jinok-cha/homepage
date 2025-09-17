
import React from 'react';
import Card from './Card';
import FinancialChart from './FinancialChart';
import { LineChartConfig } from '../types';

interface FinancialRatioTrendChartProps {
  title: string;
  config: LineChartConfig;
}

const FinancialRatioTrendChart: React.FC<FinancialRatioTrendChartProps> = ({ title, config }) => {
  return (
    <Card title={`${title} 비율 추이`}>
      <FinancialChart config={config} />
    </Card>
  );
};

export default FinancialRatioTrendChart;
