import React from 'react';
import type { SavedReading } from '../types';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  readings: SavedReading[];
  onClear: () => void;
}

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, readings, onClear }) => {
  if (!isOpen) {
    return null;
  }

  const handleClearClick = () => {
    if (window.confirm('本当にすべての履歴を削除しますか？この操作は元に戻せません。')) {
      onClear();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out animate-fadeInModal"
      onClick={onClose}
    >
      <div
        className="bg-violet-50 border border-amber-200/50 rounded-2xl shadow-2xl shadow-amber-500/20 w-11/12 max-w-2xl max-h-[90vh] flex flex-col animate-zoomIn"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-amber-200/50 text-center relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-orange-800 tracking-wide">リーディング履歴</h2>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-amber-700/80 hover:bg-amber-200/50 rounded-full" aria-label="閉じる">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          {readings.length === 0 ? (
            <p className="text-center text-stone-600 py-8">リーディングの履歴はまだありません。</p>
          ) : (
            <div className="space-y-4">
              {readings.map((reading) => (
                <details key={reading.id} className="group bg-white/50 rounded-lg border border-amber-200/50 overflow-hidden">
                  <summary className="p-4 flex justify-between items-center cursor-pointer hover:bg-amber-50/50 transition-colors">
                    <div>
                        <p className="font-semibold text-amber-900">{reading.cards.map(c => c.name).join(', ')}</p>
                        <p className="text-sm text-stone-500">{reading.date}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-700 transition-transform transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-4 border-t border-amber-200/50 bg-amber-50/20">
                    {reading.mode === 'single' && (
                        <div className="space-y-4">
                             {reading.generatedImageUrl && (
                                <img src={reading.generatedImageUrl} alt={reading.cards[0]?.name || ''} className="rounded-lg max-w-xs mx-auto shadow-md" />
                            )}
                            <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">{reading.generatedMessages[0] || reading.cards[0]?.message}</p>
                        </div>
                    )}
                    {reading.mode === 'three' && (
                        <div className="space-y-6">
                            {reading.generatedMessages.map((msg, index) => {
                                const card = reading.cards[index];
                                if (!card) return null;
                                return (
                                    <div key={index}>
                                        <h3 className="font-bold text-amber-800 text-lg mb-1">{['過去', '現在', '未来'][index]} - {card.name}</h3>
                                        <p className="whitespace-pre-wrap text-stone-700 leading-relaxed text-sm">{msg || card.message}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
        {readings.length > 0 && (
          <footer className="p-4 sm:p-6 border-t border-amber-200/50 text-right">
            <button
              onClick={handleClearClick}
              className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              aria-label="リーディング履歴をすべて削除する"
            >
              履歴をすべて削除
            </button>
          </footer>
        )}
      </div>
      <style>{`
        @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeInModal { animation: fadeInModal 0.3s ease-in-out; }
        .animate-zoomIn { animation: zoomIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default JournalModal;