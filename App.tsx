import React, { useState, useEffect, useCallback } from 'react';
import { GODDESS_CARDS } from './constants';
import type { GoddessCardData, SavedReading } from './types';
import OracleCard from './components/OracleCard';
import MessageModal from './components/MessageModal';
import JournalModal from './components/JournalModal';
import DisclaimerModal from './components/DisclaimerModal';
import { getReadings, clearReadings } from './utils/storage';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

type ReadingMode = 'single' | 'three';

const App: React.FC = () => {
  const [cards, setCards] = useState<GoddessCardData[]>([]);
  const [selectedCards, setSelectedCards] = useState<GoddessCardData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('single');
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);


  const shuffleAndSetCards = useCallback(() => {
    setCards(shuffleArray(GODDESS_CARDS));
  }, []);

  useEffect(() => {
    shuffleAndSetCards();
    setReadings(getReadings());
  }, [shuffleAndSetCards]);

  const handleCardSelect = (card: GoddessCardData) => {
    if (isShuffling || isModalOpen) return;

    if (readingMode === 'single') {
      setSelectedCards([card]);
      setIsModalOpen(true);
    } else {
      if (selectedCards.length < 3 && !selectedCards.find(c => c.id === card.id)) {
        setSelectedCards(prev => [...prev, card]);
      }
    }
  };

  const handleReset = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedCards([]);
      setIsShuffling(true);
      setReadings(getReadings()); // Refresh readings from storage
      setTimeout(() => {
        shuffleAndSetCards();
        setIsShuffling(false);
      }, 400);
    }, 300); // Wait for modal animation
  };
  
  const handleModeChange = (mode: ReadingMode) => {
    setReadingMode(mode);
    // A simplified reset without full shuffle animation
    setSelectedCards([]);
    setIsShuffling(true);
      setTimeout(() => {
        shuffleAndSetCards();
        setIsShuffling(false);
      }, 400);
  };
  
  const getInstructionText = () => {
    if (readingMode === 'single') {
        return 'カードを1枚選んで、導きのメッセージを受け取りましょう。'
    }
    return `過去、現在、未来を示すカードを3枚選んでください。(${selectedCards.length}/3)`
  }

  const handleClearHistory = () => {
    clearReadings();
    setReadings([]);
  };

  return (
    <div className="min-h-screen bg-violet-50 text-slate-800 p-4 sm:p-8 overflow-hidden">
      <header className="text-center mb-4 animate-fadeIn relative">
        <img src="/logo.png" alt="女神のオラクル ロゴ" className="w-40 h-40 mx-auto mb-2" />
        <h1 className="text-4xl sm:text-6xl font-bold text-orange-900/90 tracking-wider">女神のオラクル</h1>
        <div className="absolute top-0 right-0 h-full flex items-center">
          <button
            onClick={() => setIsJournalOpen(true)}
            className="p-2 rounded-full text-amber-700/80 hover:bg-amber-200/50 transition-colors"
            aria-label="リーディング履歴を開く"
          >
            <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex justify-center items-center my-6 space-x-2 sm:space-x-4 bg-amber-200/50 p-1 rounded-full w-fit mx-auto shadow-inner">
        <button 
          onClick={() => handleModeChange('single')}
          className={`px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${readingMode === 'single' ? 'bg-white shadow text-amber-800' : 'text-amber-700/80 hover:bg-white/50'}`}
        >
          1枚引き
        </button>
        <button 
          onClick={() => handleModeChange('three')}
          className={`px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${readingMode === 'three' ? 'bg-white shadow text-amber-800' : 'text-amber-700/80 hover:bg-white/50'}`}
        >
          3枚引き
        </button>
      </div>
      
      <p className="text-center text-lg text-amber-800/80 mb-6 h-8 transition-opacity duration-300">
        {getInstructionText()}
      </p>

      {readingMode === 'three' && selectedCards.length === 3 && (
        <div className="text-center mb-6 animate-fadeIn">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 animate-pulse-draw"
          >
            結果を見る
          </button>
        </div>
      )}


      <main>
        <div className="container mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11 gap-3 sm:gap-4 justify-center">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`transition-all duration-300 ease-in-out ${
                  isShuffling ? 'opacity-0 transform scale-75' : 'opacity-100 transform scale-100'
                }`}
                style={{ transitionDelay: isShuffling ? '0ms' : `${index * 20}ms` }}
              >
                <OracleCard 
                  onClick={() => handleCardSelect(card)}
                  isSelected={!!selectedCards.find(c => c.id === card.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <MessageModal cards={selectedCards} isOpen={isModalOpen} onClose={handleReset} />
      <JournalModal readings={readings} isOpen={isJournalOpen} onClose={() => setIsJournalOpen(false)} onClear={handleClearHistory} />
      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />


      <footer className="text-center mt-12 text-amber-800/80 text-sm">
        <p>日々の神聖な繋がりのひとときを。</p>
        <button
          onClick={() => setIsDisclaimerOpen(true)}
          className="mt-2 text-xs text-stone-500 underline hover:text-amber-900 transition-colors"
        >
          免責事項・利用規約
        </button>
      </footer>
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 1s ease-in-out; }

        @keyframes pulse-draw {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 12px rgba(217, 119, 6, 0);
          }
        }
        .animate-pulse-draw {
          animation: pulse-draw 2.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default App;