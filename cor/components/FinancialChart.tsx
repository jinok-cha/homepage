import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  RadarChart,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from 'recharts';
import { FinancialChartConfig } from '../types';

interface FinancialChartProps {
  config: FinancialChartConfig;
  baseYearForTooltip?: number;
}

const formatYAxis = (value: number, unit?: string) => {
    if (unit === '백만원') {
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        if (value <= -1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toString();
    }
    if (unit === '억원') {
        return `${value.toLocaleString()}억`;
    }
    if (unit === '%') {
        return `${value}%`;
    }
    if (unit === '원') {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${Math.round(value / 1000)}K`;
        return value.toLocaleString();
    }
    return value.toLocaleString();
};


const CustomTooltip = ({ active, payload, label, unit, baseYear }: any) => {
  if (active && payload && payload.length) {
    let displayLabel = label;
    if (unit === '억원' && !isNaN(Number(label)) && baseYear) {
      const year = Number(label);
      if (year > baseYear) {
        const yearsLater = year - baseYear;
        displayLabel = `${yearsLater}년후`;
      }
    }

    return (
      <div className="bg-white/80 backdrop-blur-sm p-2 border border-slate-300 rounded-md shadow-lg">
        <p className="font-bold text-slate-700">{displayLabel}</p>
        {payload.map((pld: any) => {
          // For the transformed bar chart, pld.name is "value", and the `label` prop of the tooltip has the correct category name.
          // For other charts, pld.name is the correct series name ("매출액", etc.) and label is the x-axis value ("2024").
          const name = pld.name === 'value' && payload.length === 1 ? label : pld.name;
          let value = pld.value;
          
          if (unit === '억원') {
            value = Math.round(value);
          }
          return (
             <div key={pld.dataKey} style={{ color: pld.color || pld.payload.fill }}>
                {name}: {value.toLocaleString()}{unit ? ` ${unit}` : ''}
             </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const BarValueLabel = (props: any) => {
  const { x, y, width, value, fill } = props;
  
  if (value === null || value === undefined) return null;

  const formattedValue = Math.round(value).toLocaleString();
  
  return (
    <text x={x + width / 2} y={y} dy={-4} fill={fill || '#334155'} fontSize="12px" textAnchor="middle">
      {formattedValue}
    </text>
  );
};

const CenteredWhiteBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === null || value === undefined || height < 20) {
        return null;
    }
    const formattedValue = Math.round(value).toLocaleString();
    return (
        <text x={x + width / 2} y={y + height / 2} fill="#FFFFFF" fontSize="13px" textAnchor="middle" dominantBaseline="middle">
            {formattedValue}
        </text>
    );
};

const CustomizedXAxisTick = (props: any) => {
    const { x, y, payload, data } = props;
    if (!data) return null;

    const dataEntry = data.find((entry: any) => entry.name === payload.value);
    const color = dataEntry ? dataEntry.fill : '#64748b';

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill={color} fontSize={12}>
                {payload.value}
            </text>
        </g>
    );
};

const CustomizedLineLabel = (props: any) => {
  const { x, y, value, labelPosition, color, unit } = props;

  if (value === null || value === undefined) return null;
  
  if (typeof value !== 'number' || !isFinite(value)) return null;
  
  let formattedValue;
  if (unit === '억원') {
    formattedValue = `${Math.round(value)}`;
  } else {
    formattedValue = `${value.toFixed(1)}${unit || ''}`;
  }

  const yOffset = labelPosition === 'bottom' ? 15 : -8;

  return (
    <text x={x} y={y} dy={yOffset} fill={color} fontSize={12} textAnchor="middle" fontWeight="bold">
      {formattedValue}
    </text>
  );
};


const FinancialChart: React.FC<FinancialChartProps> = ({ config, baseYearForTooltip }) => {
    const renderChart = () => {
        switch (config.chartType) {
            case 'bar':
                 // Special handling for single-entry bar charts to display categories on X-axis
                if (config.data.length === 1 && config.xAxisKey === 'name') {
                    const singleDataPoint = config.data[0];
                    const transformedData = config.bars.map(bar => ({
                        name: bar.name || bar.dataKey,
                        value: singleDataPoint[bar.dataKey] as number,
                        fill: bar.fill,
                    }));

                    return (
                        <BarChart data={transformedData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                            <XAxis dataKey="name" tick={<CustomizedXAxisTick data={transformedData} />} interval={0} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip unit={config.unit} baseYear={baseYearForTooltip}/>} cursor={{ fill: 'rgba(200,200,200,0.1)' }}/>
                            <Bar dataKey="value" label={<CenteredWhiteBarLabel />} radius={[4, 4, 0, 0]}>
                                {transformedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    );
                }
                
                // Default bar chart rendering
                return (
                    <BarChart data={config.data} margin={{ top: 20, right: 20, left: config.hideYAxis ? -20 : 10, bottom: 5 }}>
                        {!config.hideGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
                        <XAxis dataKey={config.xAxisKey || 'year'} tick={{ fill: '#64748b', fontSize: 12 }} />
                        {!config.hideYAxis && <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatYAxis(value, config.unit)} />}
                        <Tooltip content={<CustomTooltip unit={config.unit} baseYear={baseYearForTooltip}/>} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        {/* FIX: Use bar.name for legend if available, otherwise fall back to bar.dataKey */}
                        {config.bars.map(bar => (
                            <Bar 
                                key={bar.dataKey} 
                                dataKey={bar.dataKey} 
                                name={bar.name || bar.dataKey} 
                                fill={bar.fill} 
                                radius={[4, 4, 0, 0]} 
                                stackId={bar.stackId} 
                                // FIX: The type of bar.labelComponent is too generic for cloneElement to infer props. Cast the props object to 'any' to allow adding the 'fill' property.
                                label={bar.labelComponent !== undefined ? React.cloneElement(bar.labelComponent, { fill: bar.fill } as any) : (bar.stackId ? false : <BarValueLabel />)} 
                            />
                        ))}
                    </BarChart>
                );
            case 'line':
                const showLabels = config.showDataLabels !== false;
                return (
                    <LineChart data={config.data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                        {!config.hideYAxis && <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatYAxis(value, config.unit)} />}
                        <Tooltip content={<CustomTooltip unit={config.unit} baseYear={baseYearForTooltip}/>} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        {config.lines.map(line => (
                            <Line 
                                key={line.dataKey} 
                                type="monotone" 
                                dataKey={line.dataKey} 
                                name={line.dataKey} 
                                stroke={line.stroke} 
                                strokeWidth={2} 
                                dot={{ r: 4 }} 
                                activeDot={{ r: 6 }} 
                                isAnimationActive={false}
                                label={showLabels ? <CustomizedLineLabel labelPosition={line.labelPosition} color={line.stroke} unit={config.unit} /> : undefined}
                            />
                        ))}
                    </LineChart>
                );
            case 'combo':
                return (
                     <ComposedChart data={config.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={config.xAxisKey || 'year'} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatYAxis(value, config.unit)} />
                        <Tooltip content={<CustomTooltip unit={config.unit} baseYear={baseYearForTooltip}/>} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        {/* FIX: Use bar.name for legend if available, otherwise fall back to bar.dataKey */}
                        {config.bars.map(bar => (
                            <Bar key={bar.dataKey} dataKey={bar.dataKey} name={bar.name || bar.dataKey} fill={bar.fill} radius={[4, 4, 0, 0]} />
                        ))}
                        {config.lines.map(line => (
                            <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} name={line.dataKey} stroke={line.stroke} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        ))}
                    </ComposedChart>
                );
            case 'radar':
                 return (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={config.data}>
                        <PolarGrid />
                        {/* FIX: The 'fill' property should be passed inside the 'tick' object to style the axis labels. */}
                        <PolarAngleAxis dataKey={config.polarKey} tick={{ fontSize: 12, fill: "#334155" }} />
                        {/* FIX: An invalid 'fill' property was likely passed to PolarRadiusAxis. The fix is to enable the ticks (which makes the tickFormatter functional) and move the fill property into the 'tick' object for correct styling. */}
                        <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 1000']} tickFormatter={(value) => formatYAxis(value)} tick={{ fill: 'transparent' }} axisLine={false} />
                        <Tooltip content={<CustomTooltip unit={'백만원'} baseYear={baseYearForTooltip}/>} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        {config.radars.map(radar => (
                            <Radar key={radar.dataKey} name={radar.name} dataKey={radar.dataKey} stroke={radar.stroke} fill={radar.fill} fillOpacity={0.3} />
                        ))}
                    </RadarChart>
                );
            default:
                return <div>Invalid chart type</div>;
        }
    };

    return <ResponsiveContainer width="100%" height={config.height || 270}>{renderChart()}</ResponsiveContainer>;
};

export default FinancialChart;