import React from 'react';
import { PageData } from '../types';
import { formatDate } from '../utils';

type HeaderProps = {
  currentPage: PageData;
  currentPageIndex: number;
  isOnlyPageToday: boolean;
  onDeleteRequest: (id: string) => void;
};

export const Header: React.FC<HeaderProps> = ({ currentPage, currentPageIndex, isOnlyPageToday, onDeleteRequest }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-indigo-200 pb-4 gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 tracking-tight flex items-center gap-3 flex-wrap">
          <span>✏️</span>
          <span>{formatDate(currentPage.date)} {currentPageIndex + 1}ページ目</span>
        </h1>
      </div>
      <button
        onClick={() => onDeleteRequest(currentPage.id)}
        disabled={isOnlyPageToday}
        className={`text-2xl md:text-3xl font-bold py-3 px-6 rounded-2xl shadow-sm border-2 transition-all flex items-center gap-3 focus:outline-none focus:ring-4 active:scale-95 ${
          isOnlyPageToday 
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
            : 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300 focus:ring-rose-400'
        }`}
        aria-label={isOnlyPageToday ? "最後の1ページは消せません" : "このページを消す"}
        title={isOnlyPageToday ? "最後の1ページは消せません" : "このページを消す"}
      >
        <span className="text-3xl">🗑️</span>
        <span>消す</span>
      </button>
    </header>
  );
};
