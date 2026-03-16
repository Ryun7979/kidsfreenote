import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageData } from '../types';
import { formatDate } from '../utils';

type SidebarProps = {
  pages: PageData[];
  currentPageId: string | null;
  setCurrentPageId: (id: string) => void;
  onAddPage: () => void;
  onMovePage: (date: string, index: number, direction: -1 | 1) => void;
  onOpenSettings: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  pages,
  currentPageId,
  setCurrentPageId,
  onAddPage,
  onMovePage,
  onOpenSettings,
}) => {
  // ページを日付ごとにグループ化してソート
  const groupedPages = useMemo(() => {
    const groups: Record<string, PageData[]> = {};
    pages.forEach((p) => {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push(p);
    });
    // 各日付の中で作成順（古い順）にソート
    Object.values(groups).forEach((list) =>
      list.sort((a, b) => a.createdAt - b.createdAt)
    );
    return groups;
  }, [pages]);

  // 日付を新しい順にソート
  const sortedDates = Object.keys(groupedPages).sort((a, b) => b.localeCompare(a));

  return (
    <aside className="w-full md:w-[500px] md:shrink-0 h-full bg-indigo-50 p-6 md:p-10 flex flex-col gap-6 border-l-4 border-indigo-200 overflow-hidden">
      <div className="flex flex-col gap-4 pb-4 border-b-4 border-indigo-200">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 flex items-center gap-3">
            <span>📚</span>
            <span>ノート</span>
          </h2>
          <button
            onClick={onOpenSettings}
            className="bg-white hover:bg-slate-100 text-slate-700 p-3 rounded-2xl shadow-sm border-2 border-slate-200 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-slate-300"
            aria-label="設定"
            title="設定"
          >
            <span className="text-2xl">⚙️</span>
          </button>
        </div>
        <button
          onClick={onAddPage}
          className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white text-2xl md:text-3xl font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          aria-label="新しいページをつくる"
        >
          <span className="text-3xl">➕</span>
          <span>新しいページ</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="flex flex-col gap-3">
            <h3 className="text-2xl font-bold text-slate-700 bg-indigo-100 py-2 px-4 rounded-xl inline-block">
              {formatDate(date)}
            </h3>
            <div className="flex flex-col gap-3 pl-4 border-l-4 border-indigo-200 ml-4">
              <AnimatePresence>
                {groupedPages[date].map((page, index) => {
                  const isActive = page.id === currentPageId;
                  const isFirst = index === 0;
                  const isLast = index === groupedPages[date].length - 1;
                  return (
                    <motion.div
                      key={page.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      className="flex items-center group relative origin-left"
                    >
                      <span
                        className={`absolute -left-8 text-2xl transition-transform ${
                          isActive
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-4'
                        }`}
                      >
                        👉
                      </span>
                      <div
                        className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center justify-between focus-within:ring-4 focus-within:ring-indigo-400 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-lg scale-[1.02] border-2 border-indigo-500'
                            : 'bg-white text-slate-800 hover:bg-indigo-100 hover:scale-[1.02] shadow border-2 border-transparent'
                        }`}
                      >
                        <button
                          onClick={() => setCurrentPageId(page.id)}
                          className="flex-1 flex items-center gap-2 focus:outline-none"
                          aria-pressed={isActive}
                        >
                          <span className="text-2xl">📄</span>
                          <span className="text-2xl font-bold">
                            {index + 1}ページ目
                          </span>

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMovePage(date, index, -1);
                              }}
                              disabled={isFirst}
                              className={`p-2 rounded-xl text-3xl transition-all ${
                                isFirst
                                  ? 'opacity-30 cursor-not-allowed'
                                  : isActive
                                  ? 'text-white hover:bg-indigo-500 hover:scale-110 active:scale-95'
                                  : 'text-indigo-700 hover:bg-indigo-200 hover:scale-110 active:scale-95'
                              }`}
                              aria-label="上に移動"
                              title="上に移動"
                            >
                              ⬆️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMovePage(date, index, 1);
                              }}
                              disabled={isLast}
                              className={`p-2 rounded-xl text-3xl transition-all ${
                                isLast
                                  ? 'opacity-30 cursor-not-allowed'
                                  : isActive
                                  ? 'text-white hover:bg-indigo-500 hover:scale-110 active:scale-95'
                                  : 'text-indigo-700 hover:bg-indigo-200 hover:scale-110 active:scale-95'
                              }`}
                              aria-label="下に移動"
                              title="下に移動"
                            >
                              ⬇️
                            </button>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
