

import React from 'react';
import { CompanyProfile, Executive, Shareholder, RelatedCompany } from '../types';
import Card from './Card';

// This is a helper component, previously in ExecutiveInfoCard.tsx
const EditableCell: React.FC<{ value: string | number | undefined, placeholder?: string, onChange: (value: string) => void, type?: 'text' | 'number' | 'decimal'}> = 
  ({ value, placeholder = '-', onChange, type = 'text' }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (type === 'number') {
      val = val.replace(/[^\d]/g, '');
    } else if (type === 'decimal') {
      val = val.replace(/[^\d.]/g, '');
    }
    onChange(val);
  }

  const formatValue = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    if (type === 'number' || type === 'decimal') {
        const num = Number(String(val).replace(/,/g, ''));
        return isNaN(num) ? val : num.toLocaleString();
    }
    return val;
  }
  
  return (
    <input
      type="text"
      inputMode={type === 'text' ? 'text' : 'numeric'}
      value={formatValue(value)}
      placeholder={placeholder}
      onChange={handleChange}
      className={`w-full bg-transparent text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-brand-blue rounded-md transition-all duration-200 text-center px-2 h-8`}
    />
  );
}

const formatBaekmanwon = (value: number | null | undefined) => {
    if (value == null) return '-';
    return `${value.toLocaleString()} 백만원`;
};

interface CompanyOverviewCardProps {
  profile: CompanyProfile;
  executives: Executive[];
  shareholders: Shareholder[];
  relatedCompanies: RelatedCompany[];
  onExecutiveChange: (index: number, field: keyof Executive, value: string | number) => void;
  onShareholderChange: (index: number, field: keyof Shareholder, value: string | number) => void;
  onAddExecutive: () => void;
  onAddShareholder: () => void;
}

const InfoCard: React.FC<CompanyOverviewCardProps> = ({ 
  profile, 
  executives, 
  shareholders, 
  relatedCompanies,
  onExecutiveChange,
  onShareholderChange,
  onAddExecutive,
  onAddShareholder
}) => {
  if (!profile) {
    return <Card><div className="text-slate-500">기업 정보 로딩 중...</div></Card>;
  }
    
  const encodedAddress = encodeURIComponent(profile.주소);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <Card>
        <div className="space-y-8">
            {/* Section 1: Basic Info */}
            <div>
                <h3 className="text-xl font-bold text-brand-blue mb-4">{profile.기업명}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-slate-600 text-sm">
                    <div><strong>대표자:</strong> {profile.대표자명}</div>
                    <div><strong>사업자번호:</strong> {profile.사업자번호}</div>
                    <div><strong>설립일:</strong> {profile.설립년월}</div>
                    <div><strong>기업규모:</strong> {profile.기업규모}</div>
                    <div><strong>신용등급:</strong> <span className="font-bold text-blue-600">{profile.신용등급}</span></div>
                    <div><strong>주요제품:</strong> {profile.주요제품}</div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 text-slate-600 text-sm">
                    <strong>주소:</strong>{' '}
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-brand-blue">
                        {profile.주소}
                    </a>
                </div>
            </div>

            {/* Section 2: Executives */}
            <div className="border-t border-slate-200 pt-6">
                <h4 className="text-md font-semibold text-slate-700 mb-2">주요 임원</h4>
                <div className="overflow-x-auto -mx-2">
                    <table className="min-w-full text-sm text-center">
                    <thead className="text-center text-xs text-slate-500">
                        <tr>
                        <th className="p-2 font-semibold align-middle">직책</th>
                        <th className="p-2 font-semibold align-middle">이름</th>
                        <th className="p-2 font-semibold align-middle">근속년수</th>
                        <th className="p-2 font-semibold align-middle">관계</th>
                        </tr>
                    </thead>
                    <tbody>
                        {executives.map((exec, index) => (
                        <tr key={index} className="border-t border-slate-200">
                            <td className="p-1 align-middle"><EditableCell value={exec.title} onChange={(v) => onExecutiveChange(index, 'title', v)} /></td>
                            <td className="p-1 align-middle"><EditableCell value={exec.name} onChange={(v) => onExecutiveChange(index, 'name', v)} /></td>
                            <td className="p-1 align-middle"><EditableCell value={exec.tenure} onChange={(v) => onExecutiveChange(index, 'tenure', v)} /></td>
                            <td className="p-1 align-middle"><EditableCell value={exec.relationship} onChange={(v) => onExecutiveChange(index, 'relationship', v)} /></td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                <div className="mt-2 flex justify-end">
                    <button
                        onClick={onAddExecutive}
                        className="px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400"
                    >
                        + 임원 추가
                    </button>
                </div>
            </div>

            {/* Section 3: Shareholders */}
            <div className="border-t border-slate-200 pt-6">
                <h4 className="text-md font-semibold text-slate-700 mb-2">주주 구성</h4>
                <div className="overflow-x-auto -mx-2">
                    <table className="min-w-full text-sm text-center">
                    <thead className="text-center text-xs text-slate-500">
                        <tr>
                        <th className="p-2 font-semibold align-middle">이름</th>
                        <th className="p-2 font-semibold align-middle">관계</th>
                        <th className="p-2 font-semibold align-middle">주식수</th>
                        <th className="p-2 font-semibold align-middle">지분율(%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shareholders.map((holder, index) => (
                        <tr key={index} className="border-t border-slate-200">
                            <td className="p-1 align-middle"><EditableCell value={holder.name} onChange={(v) => onShareholderChange(index, 'name', v)} /></td>
                            <td className="p-1 align-middle"><EditableCell value={holder.relationship} onChange={(v) => onShareholderChange(index, 'relationship', v)} /></td>
                            <td className="p-1 align-middle"><EditableCell value={holder.shares} onChange={(v) => onShareholderChange(index, 'shares', v)} type="number" /></td>
                            <td className="p-1 align-middle"><EditableCell value={holder.stake} onChange={(v) => onShareholderChange(index, 'stake', v)} type="decimal" /></td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                <div className="mt-2 flex justify-end">
                    <button
                        onClick={onAddShareholder}
                        className="px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400"
                    >
                        + 주주 추가
                    </button>
                </div>
            </div>

            {/* Section 4: Related Companies */}
            <div className="border-t border-slate-200 pt-6">
                <h4 className="text-md font-semibold text-slate-700 mb-2">주요 관계회사</h4>
                {relatedCompanies.length > 0 ? relatedCompanies.map(company => (
                    <div key={company.name}>
                        <h4 className="font-semibold text-slate-800">{company.name}</h4>
                        <p className="text-xs text-slate-500 mb-2">{company.business}</p>
                        <div className="text-sm space-y-1 text-slate-600 border-t pt-2 mt-2">
                            <div className="flex justify-between"><span>자산총계 (2024)</span> <span className="font-semibold text-slate-800">{formatBaekmanwon(company.totalAssets)}</span></div>
                            <div className="flex justify-between"><span>매출액 (2024)</span> <span className="font-semibold text-slate-800">{formatBaekmanwon(company.revenue)}</span></div>
                            <div className="flex justify-between"><span>순이익 (2024)</span> <span className="font-semibold text-slate-800">{formatBaekmanwon(company.netIncome)}</span></div>
                        </div>
                    </div>
                )) : <div className="text-slate-500">데이터가 없습니다.</div>}
            </div>
        </div>
    </Card>
  );
};

export default InfoCard;