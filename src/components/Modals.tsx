import React, { useRef } from 'react';
import { setDebugDateOffset } from '../utils';

type DeleteModalProps = {
  pageToDelete: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export const DeleteModal: React.FC<DeleteModalProps> = ({ pageToDelete, onCancel, onConfirm }) => {
  if (!pageToDelete) return null;

  return (
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
            onClick={onCancel}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-3xl font-bold py-5 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-slate-400 active:scale-95"
          >
            やめる
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-3xl font-bold py-5 rounded-2xl shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-rose-400 active:scale-95"
          >
            🗑️ 消す
          </button>
        </div>
      </div>
    </div>
  );
};

type SettingsModalProps = {
  isOpen: boolean;
  textSize: 'small' | 'medium' | 'large' | 'xlarge';
  setTextSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
  resetStep: 0 | 1 | 2;
  setResetStep: (step: 0 | 1 | 2) => void;
  onClose: () => void;
  onFullReset: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: () => void;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  textSize,
  setTextSize,
  resetStep,
  setResetStep,
  onClose,
  onFullReset,
  onFileUpload,
  onDownload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen && resetStep === 0) return null;

  const handleTestDateForward = () => {
    // 既存の debugDateOffset を加算してリロードのような挙動をさせる（App.tsx時代の動作を再現）
    setDebugDateOffset(1); // 注意：現在のutils内の値の運用次第
    window.dispatchEvent(new Event('focus'));
    onClose();
  };

  return (
    <>
      {isOpen && (
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
                onClick={handleTestDateForward}
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
              <div className="flex justify-center gap-6 mt-2 mb-2">
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    onFileUpload(e);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }} 
                  className="hidden" 
                />
                <button
                  onClick={onDownload}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 py-2 px-6 rounded-xl font-bold transition-all text-lg shadow-sm border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 active:scale-95 flex items-center gap-2"
                  aria-label="バックアップ"
                >
                  <span className="text-xl">💾</span>
                  <span>バックアップ</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 py-2 px-6 rounded-xl font-bold transition-all text-lg shadow-sm border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 active:scale-95 flex items-center gap-2"
                  aria-label="復元"
                >
                  <span className="text-xl">📂</span>
                  <span>復元</span>
                </button>
              </div>

              <button
                onClick={onClose}
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
                onClick={() => {
                  if (resetStep === 1) {
                    setResetStep(2);
                  } else {
                    onFullReset();
                    setResetStep(0);
                    onClose();
                  }
                }}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-3xl font-bold py-5 rounded-2xl shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-rose-400 active:scale-95"
              >
                🗑️ {resetStep === 1 ? 'はい、次へ' : '本当に消去する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
