import React, { useState } from 'react';
import { useDiaryData } from './hooks/useDiaryData';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { DeleteModal, SettingsModal } from './components/Modals';
import { generateId, getTodayString, formatDate } from './utils';
import { PageData } from './types';

export default function App() {
  const {
    pages,
    setPages,
    isLoaded,
    currentPageId,
    setCurrentPageId,
    textSize,
    setTextSize,
    updatePageText,
    addPage,
    deletePage,
    movePage,
    fullReset,
    currentPage
  } = useDiaryData();

  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);

  if (!isLoaded) return null;

  // ページを日付ごとにグループ化（UI表示・制御用）
  const groupedPages: Record<string, PageData[]> = {};
  pages.forEach(p => {
    if (!groupedPages[p.date]) groupedPages[p.date] = [];
    groupedPages[p.date].push(p);
  });
  
  const currentPageIndex = groupedPages[currentPage.date]?.findIndex(p => p.id === currentPage.id) ?? 0;
  const isOnlyPageToday = (groupedPages[currentPage.date]?.length ?? 0) <= 1;

  const charCount = currentPage.text.length;
  const isMax = charCount >= 400;

  // 削除の確認
  const confirmDelete = () => {
    if (pageToDelete) {
      deletePage(pageToDelete);
      setPageToDelete(null);
    }
  };

  // --- ファイルインポート・エクスポート関連処理 ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const loadedPages = parsed.map((p: any) => ({
            id: p.id || generateId(),
            date: p.date || getTodayString(),
            text: p.text || '',
            createdAt: p.createdAt || Date.now()
          }));
          setPages(loadedPages);
          
          if (loadedPages.length > 0) {
            const latest = [...loadedPages].sort((a, b) => b.createdAt - a.createdAt)[0];
            setCurrentPageId(latest.id);
          }
        }
      } catch (error) {
        console.error('ファイルの読み込みに失敗しました', error);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pages, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "my_notes_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleTextExport = () => {
    const sortedDatesLocal = Object.keys(groupedPages).sort((a, b) => b.localeCompare(a));
    let textOutput = '';
    sortedDatesLocal.forEach((date) => {
      const dailyPages = [...groupedPages[date]].sort((a, b) => a.createdAt - b.createdAt);
      textOutput += `${formatDate(date)}\n`;
      dailyPages.forEach((page, index) => {
        textOutput += `【${index + 1}ページ目】\n`;
        textOutput += `${page.text}\n`;
      });
      textOutput += '\n';
    });

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textOutput);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "my_notes_export.txt");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleTextImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split(/\r?\n/);
        
        let loadedPages: PageData[] = [];
        let currentDate = '';
        let currentText: string[] = [];
        let pageCount = 0;
        
        const parseDateString = (dateStr: string) => {
          const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
          if (match) {
            const y = match[1];
            const m = match[2].padStart(2, '0');
            const d = match[3].padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
          return null;
        };

        let isParsingPage = false;

        const finalizePage = () => {
          if (isParsingPage && currentDate) {
            loadedPages.push({
              id: generateId(),
              date: currentDate,
              text: currentText.join('\n').trim(),
              createdAt: Date.now() + pageCount
            });
            pageCount++;
          }
          currentText = [];
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trimEnd();
          
          if (line.match(/^\d{4}年\d{1,2}月\d{1,2}日/)) {
            finalizePage();
            currentDate = parseDateString(line) || getTodayString();
            isParsingPage = false;
          } else if (line.match(/^【\d+ページ目】/)) {
            finalizePage();
            isParsingPage = true;
          } else {
            if (isParsingPage) {
              currentText.push(line);
            }
          }
        }
        finalizePage();

        if (loadedPages.length > 0) {
          setPages(loadedPages);
          const latest = [...loadedPages].sort((a, b) => b.createdAt - a.createdAt)[0];
          setCurrentPageId(latest.id);
        } else {
           alert("テキストフォーマットが正しくないか、読み込めるデータがありません。");
        }
      } catch (error) {
        console.error('ファイルの読み込みに失敗しました', error);
        alert("ファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200">
      
      {/* 左側：メイン画面 */}
      <main className="w-full md:flex-1 md:min-w-0 h-full p-6 md:p-10 flex flex-col gap-6 relative">
        <Header 
          currentPage={currentPage}
          currentPageIndex={currentPageIndex}
          isOnlyPageToday={isOnlyPageToday}
          onDeleteRequest={setPageToDelete}
        />

        <Editor 
          currentPageId={currentPageId!}
          currentPage={currentPage}
          textSize={textSize}
          updatePageText={updatePageText}
        />

        <Footer 
          charCount={charCount}
          isMax={isMax}
          onTextImport={handleTextImport}
          onTextExport={handleTextExport}
        />
      </main>

      {/* 右側：サイドバー */}
      <Sidebar 
        pages={pages}
        currentPageId={currentPageId}
        setCurrentPageId={setCurrentPageId}
        onAddPage={addPage}
        onMovePage={movePage}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* モーダル群 */}
      <DeleteModal 
        pageToDelete={pageToDelete}
        onCancel={() => setPageToDelete(null)}
        onConfirm={confirmDelete}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        textSize={textSize}
        setTextSize={setTextSize}
        resetStep={resetStep}
        setResetStep={setResetStep}
        onClose={() => setIsSettingsOpen(false)}
        onFullReset={() => {
          fullReset();
          setIsSettingsOpen(false);
          setResetStep(0);
        }}
        onFileUpload={handleFileUpload}
        onDownload={handleDownload}
      />
    </div>
  );
}
