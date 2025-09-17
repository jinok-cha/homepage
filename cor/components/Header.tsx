import React from 'react';

interface HeaderProps {
  onPdfSave: () => void;
  isGenerating: boolean;
  onDataLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDataDownload: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onPdfSave, 
    isGenerating, 
    onDataLoad, 
    onDataDownload
}) => {
  return (
    <header className="bg-white shadow-md no-print">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              기업분석보고서
            </h1>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
                 <button
                    onClick={onDataDownload}
                    disabled={isGenerating}
                    className="px-3 py-2 text-xs md:text-sm font-semibold rounded-md transition-all duration-200 bg-slate-500 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400 disabled:cursor-not-allowed whitespace-nowrap"
                 >
                    데이터 다운로드
                 </button>
                 <label className="px-3 py-2 text-xs md:text-sm font-semibold rounded-md transition-all duration-200 bg-slate-600 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap">
                    데이터 불러오기
                    <input type="file" accept=".json" onChange={onDataLoad} className="hidden" disabled={isGenerating} />
                 </label>
            </div>
            
            <button
              onClick={onPdfSave}
              disabled={isGenerating}
              className="px-4 py-2 w-24 md:w-28 text-sm font-semibold rounded-md transition-all duration-200 bg-brand-blue text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? '생성 중...' : 'PDF 저장'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;