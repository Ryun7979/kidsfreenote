import { PageData } from './types';

export let debugDateOffset = 0;

export const setDebugDateOffset = (offset: number) => {
  debugDateOffset = offset;
};

// 日付を YYYY-MM-DD 形式で取得するヘルパー関数
export const getTodayString = () => {
  const today = new Date();
  if (debugDateOffset !== 0) {
    today.setDate(today.getDate() + debugDateOffset);
  }
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// 日付を読みやすい形式（YYYY年M月D日（曜））に変換するヘルパー関数
export const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = days[dateObj.getDay()];
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日（${dayOfWeek}）`;
};

// ページの一意なIDを生成するヘルパー関数
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const PLACEHOLDERS = [
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
