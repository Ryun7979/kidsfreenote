import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PageData } from '../types';
import { PLACEHOLDERS } from '../utils';

type EditorProps = {
  currentPageId: string;
  currentPage: PageData;
  textSize: 'small' | 'medium' | 'large' | 'xlarge';
  updatePageText: (id: string, text: string) => void;
};

export const Editor: React.FC<EditorProps> = ({ currentPageId, currentPage, textSize, updatePageText }) => {
  // ローカルステートでテキストを管理し、親の再レンダリングを防ぐ
  const [localText, setLocalText] = useState(currentPage.text);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // currentPageId が変わったら localText をリセット（他のページに切り替えた時など）
  useEffect(() => {
    setLocalText(currentPage.text);
  }, [currentPageId]);

  const currentPlaceholder = useMemo(() => {
    if (!currentPageId) return PLACEHOLDERS[0];
    return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
  }, [currentPageId]);

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= 400) {
      setLocalText(newText);
      
      // デバウンス処理（入力が止まってから 300ms 後に全体状態へ反映）
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updatePageText(currentPageId, newText);
      }, 300);
    }
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    updatePageText(currentPageId, localText);
  };

  return (
    <div className="flex-1 relative flex flex-col">
      <textarea
        value={localText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={currentPlaceholder}
        className={`flex-1 w-full resize-none rounded-3xl p-8 ${textStyles} bg-local bg-origin-content shadow-inner bg-white border-4 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='100%25'%3E%3Cline x1='0' y1='100%25' x2='8' y2='100%25' stroke='%23cbd5e1' stroke-width='2' stroke-dasharray='4,4' transform='translate(0, -1)'/%3E%3C/svg%3E")` }}
        aria-label="テキスト入力エリア"
      />
    </div>
  );
};
