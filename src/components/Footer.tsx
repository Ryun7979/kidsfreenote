import React, { useRef } from 'react';

type FooterProps = {
  charCount: number;
  isMax: boolean;
  onTextImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextExport: () => void;
};

export const Footer: React.FC<FooterProps> = ({ charCount, isMax, onTextImport, onTextExport }) => {
  const textFileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    textFileInputRef.current?.click();
  };

  return (
    <footer className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border-4 border-slate-200">
      <div className="flex flex-col gap-2 w-full xl:w-auto">
        <div 
          className={`text-3xl font-bold flex items-center gap-3 ${isMax ? 'text-red-700' : 'text-slate-800'}`}
          aria-live="polite"
        >
          <span>📝</span>
          <span>{charCount} / 400 文字</span>
        </div>
        <div className="h-8">
          {isMax && (
            <p 
              className="text-2xl font-bold text-red-600 animate-pulse"
              aria-live="assertive"
            >
              ⚠️ これ以上は書けません！
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto flex-wrap justify-end">
        <input 
          type="file" 
          accept=".txt" 
          ref={textFileInputRef} 
          onChange={onTextImport} 
          className="hidden" 
        />
        <button
          onClick={handleImportClick}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xl font-bold py-3 px-4 rounded-xl shadow-sm border-2 border-indigo-200 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="テキストを開く"
          title="テキストで書かれたノートを取り込みます"
        >
          <span className="text-2xl">📄</span>
          <span>テキスト開く</span>
        </button>
        <button
          onClick={onTextExport}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xl font-bold py-3 px-4 rounded-xl shadow-sm border-2 border-indigo-200 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="テキストで保存"
          title="ノートを普通のテキストとして保存します"
        >
          <span className="text-2xl">📝</span>
          <span>テキスト保存</span>
        </button>
      </div>
    </footer>
  );
};
