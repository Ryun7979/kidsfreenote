import React, { useState, useEffect, useMemo, useRef } from 'react';

let debugDateOffset = 0;

// 日付を YYYY-MM-DD 形式で取得するヘルパー関数
const getTodayString = () => {
  const today = new Date();
  if (debugDateOffset !== 0) {
    today.setDate(today.getDate() + debugDateOffset);
  }
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// 日付を読みやすい形式（YYYY年M月D日）に変換するヘルパー関数
const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
};

// ページの一意なIDを生成するヘルパー関数
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

type PageData = {
  id: string;
  date: string;
  text: string;
  createdAt: number;
};

const PLACEHOLDERS = [
  "ここに出来事や考えたことを書いてね！",
  "今日はどんな1日だった？",
  "一番楽しかったことは何かな？",
  "新しく見つけたものはある？",
  "明日はどんなことをしたい？",
  "今日がんばったことを教えて！",
  "今、一番気になっていることは？",
  "最近、面白かった本や動画はある？",
  "今日食べたもので、一番おいしかったのは？",
  "もし魔法が使えたら、今日は何をしたかった？"
];

export default function App() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初回マウント時に localStorage からデータを読み込む（オートロード）
  useEffect(() => {
    const savedData = localStorage.getItem('diary_pages');
    const today = getTodayString();
    let initialPages: PageData[] = [];

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // 古いデータ形式（idがない場合）からの移行処理を含める
        initialPages = parsed.map((p: any) => ({
          id: p.id || generateId(),
          date: p.date,
          text: p.text || '',
          createdAt: p.createdAt || Date.now()
        }));
      } catch (e) {
        console.error('データの読み込みに失敗しました', e);
      }
    }

    // 今日のページが存在しない場合は自動で1ページ目を作成する
    const todaysPages = initialPages.filter(p => p.date === today);
    if (todaysPages.length === 0) {
      const newPage = { id: generateId(), date: today, text: '', createdAt: Date.now() };
      initialPages.push(newPage);
      setCurrentPageId(newPage.id);
    } else {
      // 今日の最新のページを選択状態にする
      todaysPages.sort((a, b) => b.createdAt - a.createdAt);
      setCurrentPageId(todaysPages[0].id);
    }

    const savedTextSize = localStorage.getItem('diary_text_size');
    if (savedTextSize === 'small' || savedTextSize === 'medium' || savedTextSize === 'large' || savedTextSize === 'xlarge') {
      setTextSize(savedTextSize);
    }

    setPages(initialPages);
    setIsLoaded(true);
  }, []);

  // pages の状態が変わるたびに localStorage に保存する（オートセーブ）
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('diary_pages', JSON.stringify(pages));
      localStorage.setItem('diary_text_size', textSize);
    }
  }, [pages, textSize, isLoaded]);

  // アプリを開いたまま日付が変わった場合（または別タブから戻ってきた場合）の処理
  useEffect(() => {
    if (!isLoaded) return;

    const checkAndCreateTodayPage = () => {
      const today = getTodayString();
      setPages(prev => {
        const todaysPages = prev.filter(p => p.date === today);
        if (todaysPages.length === 0) {
          const newPage = { id: generateId(), date: today, text: '', createdAt: Date.now() };
          setCurrentPageId(newPage.id);
          return [...prev, newPage];
        }
        return prev;
      });
    };

    // ウィンドウがフォーカスされた時にチェック
    window.addEventListener('focus', checkAndCreateTodayPage);
    
    // 1分ごとに定期チェック（開いたまま放置して日付を跨いだ場合に対応）
    const interval = setInterval(checkAndCreateTodayPage, 60000);

    return () => {
      window.removeEventListener('focus', checkAndCreateTodayPage);
      clearInterval(interval);
    };
  }, [isLoaded]);

  // 新しいページを追加するハンドラー
  const handleAddPage = () => {
    const today = getTodayString();
    const newPage: PageData = {
      id: generateId(),
      date: today,
      text: '',
      createdAt: Date.now()
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id);
  };

  // ページを削除するハンドラー
  const confirmDelete = () => {
    if (!pageToDelete) return;
    
    const newPages = pages.filter(p => p.id !== pageToDelete);
    
    if (currentPageId === pageToDelete) {
      if (newPages.length > 0) {
        // 削除したページが現在開いているページだった場合、一番新しいページを開く
        const latestPage = [...newPages].sort((a, b) => b.createdAt - a.createdAt)[0];
        setCurrentPageId(latestPage.id);
      } else {
        // すべてのページが削除された場合は、今日の新しいページを1つ作る
        const today = getTodayString();
        const newPage = { id: generateId(), date: today, text: '', createdAt: Date.now() };
        newPages.push(newPage);
        setCurrentPageId(newPage.id);
      }
    }
    
    setPages(newPages);
    setPageToDelete(null);
  };

  // 現在選択されているページのデータを取得
  const currentPage = useMemo(() => {
    return pages.find(p => p.id === currentPageId) || { id: '', date: getTodayString(), text: '', createdAt: Date.now() };
  }, [pages, currentPageId]);

  // 現在のページのプレースホルダーをランダムに決定
  const currentPlaceholder = useMemo(() => {
    if (!currentPageId) return PLACEHOLDERS[0];
    return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
  }, [currentPageId]);

  // ページを日付ごとにグループ化してソート
  const groupedPages = useMemo(() => {
    const groups: Record<string, PageData[]> = {};
    pages.forEach(p => {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push(p);
    });
    // 各日付の中で作成順（古い順）にソートして「1ページ目」「2ページ目」と表示できるようにする
    Object.values(groups).forEach(list => list.sort((a, b) => a.createdAt - b.createdAt));
    return groups;
  }, [pages]);

  // 日付を新しい順にソート
  const sortedDates = Object.keys(groupedPages).sort((a, b) => b.localeCompare(a));

  // 現在のページがその日の何ページ目かを取得
  const currentPageIndex = groupedPages[currentPage.date]?.findIndex(p => p.id === currentPage.id) ?? 0;

  // その日のページが1ページだけかどうか
  const isOnlyPageToday = (groupedPages[currentPage.date]?.length ?? 0) <= 1;

  // テキストサイズと行の高さ（点線の間隔）に応じたクラス名を取得
  const textStyles = useMemo(() => {
    switch (textSize) {
      case 'xlarge':
        return 'text-6xl leading-[5.5rem] md:text-7xl md:leading-[6.5rem] bg-[length:8px_5.5rem] md:bg-[length:8px_6.5rem]';
      case 'large': 
        return 'text-5xl leading-[4.5rem] md:text-6xl md:leading-[5.5rem] bg-[length:8px_4.5rem] md:bg-[length:8px_5.5rem]';
      case 'medium': 
        return 'text-4xl leading-[3.5rem] md:text-5xl md:leading-[4.5rem] bg-[length:8px_3.5rem] md:bg-[length:8px_4.5rem]';
      case 'small': 
      default: 
        return 'text-3xl leading-[3rem] md:text-4xl md:leading-[3.5rem] bg-[length:8px_3rem] md:bg-[length:8px_3.5rem]';
    }
  }, [textSize]);

  // テキスト入力時のハンドラー
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    // 400文字の制限
    if (newText.length <= 400) {
      setPages(prevPages => 
        prevPages.map(p => 
          p.id === currentPageId ? { ...p, text: newText } : p
        )
      );
    }
  };

  // ファイルを開く（ロード）ハンドラー
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // ファイルに保存する（バックアップ）ハンドラー
  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pages, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "my_notes_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // 全データリセットハンドラー
  const handleFullReset = () => {
    localStorage.removeItem('diary_pages');
    localStorage.removeItem('diary_text_size');
    debugDateOffset = 0;
    const today = getTodayString();
    const newPage = { id: generateId(), date: today, text: '', createdAt: Date.now() };
    setPages([newPage]);
    setCurrentPageId(newPage.id);
    setTextSize('medium');
    setResetStep(0);
    setIsSettingsOpen(false);
  };

  if (!isLoaded) return null;

  const charCount = currentPage.text.length;
  const isMax = charCount >= 400;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200">
      
      {/* 左側：メイン画面 */}
      <main className="w-full md:flex-1 md:min-w-0 h-full p-6 md:p-10 flex flex-col gap-6 relative">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-indigo-200 pb-4 gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 tracking-tight flex items-center gap-3 flex-wrap">
              <span>✏️</span>
              <span>{formatDate(currentPage.date)} {currentPageIndex + 1}ページ目</span>
            </h1>
          </div>
          <button
            onClick={() => setPageToDelete(currentPage.id)}
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

        <div className="flex-1 relative flex flex-col">
          <textarea
            value={currentPage.text}
            onChange={handleTextChange}
            placeholder={currentPlaceholder}
            className={`flex-1 w-full resize-none rounded-3xl p-8 ${textStyles} bg-local bg-origin-content shadow-inner bg-white border-4 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='100%25'%3E%3Cline x1='0' y1='100%25' x2='8' y2='100%25' stroke='%23cbd5e1' stroke-width='2' stroke-dasharray='4,4' transform='translate(0, -1)'/%3E%3C/svg%3E")` }}
            aria-label="テキスト入力エリア"
          />
        </div>

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

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xl font-bold py-3 px-6 rounded-xl shadow-sm border-2 border-slate-200 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-slate-300"
              aria-label="ファイルを開く"
            >
              <span className="text-2xl">📂</span>
              <span>開く</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xl font-bold py-3 px-6 rounded-xl shadow-sm border-2 border-slate-200 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-slate-300"
              aria-label="ファイルに保存する"
            >
              <span className="text-2xl">💾</span>
              <span>保存</span>
            </button>
          </div>
        </footer>
      </main>

      {/* 右側：サイドバー（固定幅） */}
      <aside className="w-full md:w-[450px] md:shrink-0 h-full bg-indigo-50 p-6 md:p-10 flex flex-col gap-6 border-l-4 border-indigo-200 overflow-hidden">
        <div className="flex flex-col gap-4 pb-4 border-b-4 border-indigo-200">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 flex items-center gap-3">
              <span>📚</span>
              <span>過去のノート</span>
            </h2>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-700 p-3 rounded-2xl shadow-sm border-2 border-slate-200 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-slate-300"
              aria-label="設定"
              title="設定"
            >
              <span className="text-2xl">⚙️</span>
            </button>
          </div>
          <button
            onClick={handleAddPage}
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
                {groupedPages[date].map((page, index) => {
                  const isActive = page.id === currentPageId;
                  return (
                    <button
                      key={page.id}
                      onClick={() => setCurrentPageId(page.id)}
                      className={`w-full text-left p-4 rounded-2xl text-2xl font-bold transition-all duration-200 flex items-center justify-between group focus:outline-none focus:ring-4 focus:ring-indigo-400 ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-lg scale-[1.02] border-2 border-indigo-500' 
                          : 'bg-white text-slate-800 hover:bg-indigo-100 hover:scale-[1.02] shadow border-2 border-transparent'
                      }`}
                      aria-pressed={isActive}
                    >
                      <span className="flex items-center gap-2">
                        <span>📄</span>
                        <span>{index + 1}ページ目</span>
                      </span>
                      <span className={`text-2xl transition-transform group-hover:translate-x-1 ${isActive ? 'opacity-100 translate-x-1' : 'opacity-0'}`}>
                        👉
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 削除確認モーダル */}
      {pageToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div 
            className="bg-white rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl flex flex-col gap-8 border-8 border-rose-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h2 id="modal-title" className="text-4xl md:text-5xl font-bold text-slate-800 text-center flex items-center justify-center gap-4">
              <span>⚠️</span>
              <span>本当に消しますか？</span>
            </h2>
            <p className="text-2xl md:text-3xl text-slate-600 text-center font-bold">
              消したノートは元に戻せません。
            </p>
            <div className="flex flex-col sm:flex-row gap-6 mt-4">
              <button
                onClick={() => setPageToDelete(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-3xl font-bold py-5 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-slate-400 active:scale-95"
              >
                やめる
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-3xl font-bold py-5 rounded-2xl shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-rose-400 active:scale-95"
              >
                🗑️ 消す
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div 
            className="bg-white rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl flex flex-col gap-8 border-8 border-indigo-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <h2 id="settings-title" className="text-4xl md:text-5xl font-bold text-slate-800 text-center flex items-center justify-center gap-4 border-b-4 border-slate-100 pb-6">
              <span>⚙️</span>
              <span>設定</span>
            </h2>
            
            <div className="flex flex-col gap-6">
              <h3 className="text-3xl font-bold text-slate-700 flex items-center gap-3">
                <span>🔠</span>
                <span>文字の大きさ</span>
              </h3>
              <div className="flex gap-4">
                {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => {
                  const labels = { small: '小', medium: '中', large: '大', xlarge: '特大' };
                  const isSelected = textSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setTextSize(size)}
                      className={`flex-1 py-6 rounded-2xl text-3xl font-bold transition-all border-4 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {labels[size]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <button
                onClick={() => {
                  debugDateOffset += 1;
                  window.dispatchEvent(new Event('focus'));
                  setIsSettingsOpen(false);
                }}
                className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 border-4 border-amber-300 text-2xl font-bold py-4 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 active:scale-95 flex items-center justify-center gap-3"
              >
                <span>⏩</span>
                <span>テスト用：日付を1日進める</span>
              </button>
              <button
                onClick={() => setResetStep(1)}
                className="w-full bg-rose-100 hover:bg-rose-200 text-rose-800 border-4 border-rose-300 text-2xl font-bold py-4 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-rose-400 active:scale-95 flex items-center justify-center gap-3"
              >
                <span>🚨</span>
                <span>全データをリセットする</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-3xl font-bold py-5 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-slate-400 active:scale-95"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全リセット確認モーダル */}
      {resetStep > 0 && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div 
            className="bg-white rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl flex flex-col gap-8 border-8 border-rose-500"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-rose-600 text-center flex items-center justify-center gap-4">
              <span>⚠️</span>
              <span>{resetStep === 1 ? '全データ消去の確認 (1/2)' : '最終確認 (2/2)'}</span>
            </h2>
            <p className="text-2xl md:text-3xl text-slate-700 text-center font-bold leading-relaxed">
              {resetStep === 1 
                ? 'これまでに書いたすべてのノートと設定が消去されます。本当によろしいですか？' 
                : 'この操作は絶対に取り消せません。本当にすべてのデータを完全に消去しますか？'}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 mt-4">
              <button
                onClick={() => setResetStep(0)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-3xl font-bold py-5 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-slate-400 active:scale-95"
              >
                やめる
              </button>
              <button
                onClick={() => resetStep === 1 ? setResetStep(2) : handleFullReset()}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-3xl font-bold py-5 rounded-2xl shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-rose-400 active:scale-95"
              >
                {resetStep === 1 ? '次へ進む' : '完全に消去する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
