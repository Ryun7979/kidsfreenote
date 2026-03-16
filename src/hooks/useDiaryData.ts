import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageData } from '../types';
import { getTodayString, generateId } from '../utils';

export function useDiaryData() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');

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

    window.addEventListener('focus', checkAndCreateTodayPage);
    const interval = setInterval(checkAndCreateTodayPage, 60000);

    return () => {
      window.removeEventListener('focus', checkAndCreateTodayPage);
      clearInterval(interval);
    };
  }, [isLoaded]);

  const updatePageText = useCallback((id: string, text: string) => {
    if (text.length <= 400) {
      setPages(prevPages => 
        prevPages.map(p => 
          p.id === id ? { ...p, text } : p
        )
      );
    }
  }, []);

  const addPage = useCallback(() => {
    const today = getTodayString();
    const newPage: PageData = {
      id: generateId(),
      date: today,
      text: '',
      createdAt: Date.now()
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id);
  }, []);

  const deletePage = useCallback((id: string) => {
    setPages((prev) => {
      const newPages = prev.filter(p => p.id !== id);
      if (currentPageId === id) {
        if (newPages.length > 0) {
          const latestPage = [...newPages].sort((a, b) => b.createdAt - a.createdAt)[0];
          setCurrentPageId(latestPage.id);
        } else {
          const today = getTodayString();
          const newPage = { id: generateId(), date: today, text: '', createdAt: Date.now() };
          newPages.push(newPage);
          setCurrentPageId(newPage.id);
        }
      }
      return newPages;
    });
  }, [currentPageId]);

  const movePage = useCallback((date: string, index: number, direction: -1 | 1) => {
    setPages((prev) => {
      const groups: Record<string, PageData[]> = {};
      prev.forEach(p => {
        if (!groups[p.date]) groups[p.date] = [];
        groups[p.date].push(p);
      });
      Object.values(groups).forEach(list => list.sort((a, b) => a.createdAt - b.createdAt));
      
      const group = groups[date];
      if (!group) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= group.length) return prev;
      
      const newGroupList = [...group];
      const [movedItem] = newGroupList.splice(index, 1);
      newGroupList.splice(newIndex, 0, movedItem);

      const sortedCreatedAts = group.map(p => p.createdAt).sort((a, b) => a - b);
      const updatedPages = newGroupList.map((p, idx) => ({ ...p, createdAt: sortedCreatedAts[idx] }));
      
      return prev.map(p => {
        const updated = updatedPages.find(up => up.id === p.id);
        return updated ? updated : p;
      });
    });
  }, []);

  const fullReset = useCallback(() => {
    localStorage.removeItem('diary_pages');
    localStorage.removeItem('diary_text_size');
    const today = getTodayString();
    const newPage = { id: generateId(), date: today, text: '', createdAt: Date.now() };
    setPages([newPage]);
    setCurrentPageId(newPage.id);
    setTextSize('medium');
  }, []);

  const currentPage = useMemo(() => {
    return pages.find(p => p.id === currentPageId) || { id: '', date: getTodayString(), text: '', createdAt: Date.now() };
  }, [pages, currentPageId]);

  return {
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
  };
}
