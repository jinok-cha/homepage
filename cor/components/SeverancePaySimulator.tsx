

import React, { useState, useEffect } from 'react';

// Re-usable input field sub-component
const InputField: React.FC<{label: string, value: string, onChange: (v: string) => void, unit: string, note?: string}> = 
    ({ label, value, onChange, unit, note }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <div className="flex items-center">
            <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
                onFocus={e => { if (e.target.value === '0') onChange(''); }}
                onBlur={e => { if (e.target.value === '') onChange('0'); }}
                className="w-full px-3 h-9 border border-slate-500 rounded-md text-sm bg-slate-700 text-white text-right focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
            />
            <span className="text-sm text-slate-700 ml-2 min-w-[2rem]">{unit}</span>
            {note && <span className="text-xs text-slate-500 ml-2 whitespace-nowrap">{note}</span>}
        </div>
    </div>
);

interface SeverancePaySimulatorProps {
  avgSalary: string;
  setAvgSalary: (value: string) => void;
  currentYearsOfService: string;
  setCurrentYearsOfService: (value: string) => void;
  multiplier: string;
  setMultiplier: (value: string) => void;
  severancePayTotal: number;
}

const SeverancePaySimulator: React.FC<SeverancePaySimulatorProps> = ({ 
    avgSalary,
    setAvgSalary,
    currentYearsOfService,
    setCurrentYearsOfService,
    multiplier,
    setMultiplier,
    severancePayTotal,
 }) => {

    return (
        <div className="space-y-4">
            <h4 className="text-md font-semibold text-slate-700">대표이사 퇴직금</h4>
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
                <InputField 
                    label="3년 평균연봉" 
                    value={avgSalary} 
                    onChange={setAvgSalary} 
                    unit="만원"
                />
                <InputField 
                    label="현재 근속년수" 
                    value={currentYearsOfService} 
                    onChange={setCurrentYearsOfService} 
                    unit="년"
                />
                <InputField label="지급배수" value={multiplier} onChange={setMultiplier} unit="배" />
            </div>
            <div className="mt-4 pt-4 border-t text-right">
                <p className="text-md text-slate-700">예상 퇴직금액: 
                    <span className="font-bold text-lg text-red-500 ml-2">{severancePayTotal.toLocaleString()}</span> 만원
                </p>
            </div>
        </div>
    );
};

export default SeverancePaySimulator;