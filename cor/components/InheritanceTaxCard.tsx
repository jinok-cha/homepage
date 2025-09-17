



import React, { useState, useEffect } from 'react';
import Card from './Card';
import { calculateInheritanceTax } from '../utils/financialCalculations';

const formatEokwon = (value: number | undefined) => {
    if (value === null || value === undefined || !isFinite(value)) return '-';
    // Showing one decimal place for calculated values.
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 억원`;
}

const AssetInputRow: React.FC<{
    label: string;
    value: number; // in Eokwon
    onChange: (value: number) => void;
    isDebt?: boolean;
    disabled?: boolean;
}> = ({ label, value, onChange, isDebt = false, disabled = false }) => {
    const [displayValue, setDisplayValue] = useState(value.toLocaleString());

    useEffect(() => {
        setDisplayValue(value.toLocaleString());
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    const handleBlur = () => {
        const numValue = Number(displayValue.replace(/,/g, ''));
        const finalValue = isNaN(numValue) ? 0 : numValue;
        onChange(finalValue);
        setDisplayValue(finalValue.toLocaleString());
    };
    
    return (
        <div className="grid grid-cols-2 gap-4 items-center">
            <label className={`text-slate-600 ${isDebt ? 'text-red-600' : ''}`}>{label}</label>
            <div className="flex items-center">
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    className="w-full px-3 h-9 border border-slate-300 rounded-md text-sm bg-white text-slate-800 text-right focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:bg-slate-200 disabled:text-slate-500"
                />
                <span className="text-sm text-slate-700 ml-2">억원</span>
            </div>
        </div>
    );
};

interface InheritanceTaxCardProps {
  currentStockValuation: number; // in 만원
  financialAssets: number;
  setFinancialAssets: (value: number) => void;
  realEstate: number;
  setRealEstate: (value: number) => void;
  deemedAssets: number;
  setDeemedAssets: (value: number) => void;
  debt: number;
  setDebt: (value: number) => void;
  hasSpouse: boolean;
  setHasSpouse: (value: boolean) => void;
  numChildren: number;
  setNumChildren: (value: number) => void;
}


const InheritanceTaxCard: React.FC<InheritanceTaxCardProps> = ({ 
  currentStockValuation,
  financialAssets, setFinancialAssets,
  realEstate, setRealEstate,
  deemedAssets, setDeemedAssets,
  debt, setDebt,
  hasSpouse, setHasSpouse,
  numChildren, setNumChildren
}) => {
  const currentStockValuationEok = currentStockValuation / 10000;
  const otherAssets = financialAssets + realEstate + deemedAssets;
  const currentTotalInheritanceValue = currentStockValuationEok + otherAssets - debt;
  const currentTaxResult = calculateInheritanceTax(currentTotalInheritanceValue, financialAssets, hasSpouse, numChildren);

  return (
    <Card>
        <div className="bg-slate-50 p-4 rounded-lg border">
          <h4 className="text-md font-semibold text-slate-700 mb-4">상속세 계산 (현재 기준)</h4>

           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 text-sm gap-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="spouse-checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"/>
                        <label htmlFor="spouse-checkbox" className="text-slate-600 font-medium">배우자 유무</label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <label className="text-slate-600 font-medium">자녀 수</label>
                        <button onClick={() => setNumChildren(Math.max(0, numChildren - 1))} className="px-2 py-0.5 border rounded-md bg-white hover:bg-slate-100 transition-colors">-</button>
                        <span className="w-8 h-full flex items-center justify-center font-semibold text-slate-800">{numChildren}</span>
                        <button onClick={() => setNumChildren(numChildren + 1)} className="px-2 py-0.5 border rounded-md bg-white hover:bg-slate-100 transition-colors">+</button>
                    </div>
                </div>
            </div>

           <div className="space-y-3 text-sm">
              <AssetInputRow label="주식가치" value={Math.floor(currentStockValuationEok)} onChange={() => {}} disabled />
              <AssetInputRow label="금융자산" value={financialAssets} onChange={setFinancialAssets} />
              <AssetInputRow label="부동산" value={realEstate} onChange={setRealEstate} />
              <AssetInputRow label="간주상속재산" value={deemedAssets} onChange={setDeemedAssets} />
              <AssetInputRow label="채무" value={debt} onChange={setDebt} isDebt />
           </div>
           <div className="border-t my-4"></div>
           <div className="flex-1 space-y-2 text-sm p-4 bg-white rounded-md border">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">총 상속재산 가액</span>
                <span className="font-bold text-brand-blue">{formatEokwon(currentTotalInheritanceValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">금융재산공제</span>
                <span className="font-semibold">{formatEokwon(currentTaxResult.financialAssetDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">일괄공제/기타공제</span>
                <span className="font-semibold">{formatEokwon(currentTaxResult.flatRateOrHumanDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">배우자 공제</span>
                <span className="font-semibold">{formatEokwon(currentTaxResult.spouseDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">과세표준</span>
                <span className="font-semibold">{formatEokwon(currentTaxResult.taxableBase)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span className="font-bold text-slate-800">예상 상속세액</span>
                <span className="font-extrabold text-xl text-red-600">{formatEokwon(currentTaxResult.taxAmount)}</span>
              </div>
           </div>
        </div>
      <p className="text-xs text-slate-500 mt-4">* 본 계산은 상속세 및 증여세법에 따른 약식 계산이며, 실제 세액은 개별 상황에 따라 달라질 수 있습니다. (사전증여재산 등 미반영)</p>
    </Card>
  );
};

export default InheritanceTaxCard;