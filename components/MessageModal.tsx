import React, { useState, useEffect, useCallback } from 'react';
import type { GoddessCardData, NewReading } from '../types';
import { saveReading } from '../utils/storage';

interface MessageModalProps {
  cards: GoddessCardData[];
  isOpen: boolean;
  onClose: () => void;
}


// Generate goddess-specific image prompt
const generateGoddessPrompt = (card: GoddessCardData) => {
  const baseName = card.name;
  const baseDesc = card.description;

  // Base prompt ensuring portrait
  let prompt = `Divine portrait of goddess ${baseName}, ethereal feminine deity`;

  // Add goddess-specific visual attributes based on description
  const desc = baseDesc.toLowerCase();

  if (desc.includes('愛') || desc.includes('美')) {
    prompt += ', radiant beauty, rose petals, golden light';
  }
  if (desc.includes('月')) {
    prompt += ', silver moonlight, crescent crown, nocturnal magic';
  }
  if (desc.includes('戦') || desc.includes('狩猟')) {
    prompt += ', fierce elegance, warrior goddess, determined gaze';
  }
  if (desc.includes('海') || desc.includes('水')) {
    prompt += ', flowing like water, pearl ornaments, oceanic blues';
  }
  if (desc.includes('火') || desc.includes('太陽')) {
    prompt += ', golden flames, solar radiance, warm amber light';
  }
  if (desc.includes('大地') || desc.includes('豊穣')) {
    prompt += ', earth goddess, floral crown, natural abundance';
  }
  if (desc.includes('知恵')) {
    prompt += ', wise expression, mysterious knowledge, ancient wisdom';
  }
  if (desc.includes('芸術') || desc.includes('音楽')) {
    prompt += ', artistic inspiration, creative aura, melodic beauty';
  }

  // Conclude with artistic style ensuring portrait
  prompt += ', elegant portrait composition, fantasy art, ethereal atmosphere, mystical beauty, goddess portrait painting';

  return prompt;
};

// API call functions for secure backend communication
const callMessageAPI = async (cards: GoddessCardData[], mode: 'single' | 'three') => {
  try {
    const response = await fetch('/api/generateMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cards, mode }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`メッセージ生成APIエラー: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました');
    }
    throw error;
  }
};

const callImageAPI = async (prompt: string) => {
  try {
    const response = await fetch('/api/generateImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(60000), // 60 second timeout for image generation
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`画像生成APIエラー: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('画像生成がタイムアウトしました');
    }
    throw error;
  }
};

const LoadingSpinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center justify-center text-amber-700 text-sm mt-4 py-4">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{text}</span>
    </div>
);


const SingleCardView: React.FC<{ card: GoddessCardData; isMessageLoading: boolean; isImageLoading: boolean; generatedMessage: string | null; generatedImageUrl: string | null; }> = ({ card, isMessageLoading, isImageLoading, generatedMessage, generatedImageUrl }) => (
  <div className="text-center w-full">
    <div className="w-full max-w-xs mx-auto aspect-[3/4] bg-amber-100 rounded-lg mb-6 flex items-center justify-center border border-amber-200/50 shadow-inner overflow-hidden">
      {isImageLoading ? (
        <LoadingSpinner text="女神の姿を顕現中..." />
      ) : generatedImageUrl ? (
        <img src={generatedImageUrl} alt={`An artistic depiction of ${card.name}`} className="w-full h-full object-cover rounded-lg animate-fadeIn" />
      ) : (
        <div className="text-amber-700/50 p-4 text-center text-sm">画像の表示に失敗しました。</div>
      )}
    </div>
    
    <h2 className="text-4xl sm:text-5xl font-bold text-orange-800 tracking-wide">{card.name}</h2>
    <p className="text-md sm:text-lg text-amber-700 mt-2 italic">
      {card.description}
    </p>
    {isMessageLoading ? (
        <div className="min-h-[6rem] flex items-center justify-center">
            <LoadingSpinner text="女神からのメッセージを受け取っています..." />
        </div>
    ) : (
        <p className="text-base text-stone-700 mt-6 leading-relaxed min-h-[6rem] whitespace-pre-wrap text-left">
            {generatedMessage || card.message}
        </p>
    )}
  </div>
);

const ThreeCardSpread: React.FC<{ cards: GoddessCardData[]; isLoading: boolean; generatedMessages: (string | null)[] }> = ({ cards, isLoading, generatedMessages }) => (
  <div className="flex flex-col items-center w-full">
    <h2 className="text-4xl sm:text-5xl font-bold text-orange-800 tracking-wide mb-6">あなたのリーディング</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left w-full">
      {cards.map((card, index) => (
        <div key={card.id} className="flex flex-col bg-amber-50/50 p-4 rounded-lg border border-amber-200/50">
          <h3 className="text-xl font-bold text-amber-800 tracking-wide text-center mb-1">
            {['過去', '現在', '未来'][index]}
          </h3>
          <h4 className="text-2xl font-semibold text-orange-800 text-center">{card.name}</h4>
          <p className="text-sm text-amber-700 mt-1 italic text-center">{card.description}</p>
          <div className="flex-grow mt-4">
            {isLoading ? (
                <LoadingSpinner text="メッセージを生成中..." />
            ) : (
                 <p className="text-base text-stone-700 leading-relaxed font-light">{generatedMessages[index] || card.message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);


const MessageModal: React.FC<MessageModalProps> = ({ cards, isOpen, onClose }) => {
  const [generatedMessages, setGeneratedMessages] = useState<(string | null)[]>([]);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAllContent = useCallback(async () => {
    if (!isOpen || cards.length === 0) return;

    setError(null);
    setGeneratedMessages([]);
    setGeneratedImageUrl(null);
    setIsMessageLoading(true);

    const mode = cards.length === 1 ? 'single' : 'three';
    let finalImageUrl: string | null = null;
    let finalMessages: (string | null)[] = [];

    try {
      if (mode === 'single') {
        setIsImageLoading(true);
        
        const imagePromise = (async () => {
          try {
            const imagePrompt = generateGoddessPrompt(cards[0]);
            console.log('🎨 Image generation prompt:', imagePrompt);
            console.log('📋 Card data:', cards[0]);
            const response = await callImageAPI(imagePrompt);
            const imageUrl = response.imageUrl;
            setGeneratedImageUrl(imageUrl);
            return imageUrl;
          } catch (err) {
            console.error('Image generation error:', err);
            setGeneratedImageUrl(null); // Ensure failed state is visible
            return null; // Don't block on image failure
          } finally {
            setIsImageLoading(false);
          }
        })();

        const messagePromise = (async () => {
          try {
            const response = await callMessageAPI([cards[0]], 'single');
            const messages = response.messages;
            setGeneratedMessages(messages);
            return messages;
          } catch (err) {
            console.error('Message generation error:', err);
            const fallbackMessage = [cards[0].message];
            setGeneratedMessages(fallbackMessage);
            return fallbackMessage;
          }
        })();

        const [imageUrl, messages] = await Promise.all([imagePromise, messagePromise]);
        finalImageUrl = imageUrl;
        finalMessages = messages;

      } else { // mode === 'three'
        const response = await callMessageAPI(cards, 'three');
        const messages = response.messages;
        setGeneratedMessages(messages);
        finalMessages = messages;
      }
    } catch (e: any) {
      console.error("Failed to generate content:", e);
      setError("コンテンツの生成に失敗しました。ネットワーク接続を確認し、もう一度お試しください。");
      finalMessages = cards.map(c => c.message); // Fallback to original messages
      setGeneratedMessages(finalMessages);
    } finally {
      setIsMessageLoading(false);
    }
    
    const newReading: NewReading = {
      mode,
      cards,
      generatedMessages: finalMessages,
      generatedImageUrl: finalImageUrl,
    };
    saveReading(newReading);
  }, [isOpen, cards]);
  

  useEffect(() => {
    if (isOpen && cards.length > 0) {
      generateAllContent();
    }
  }, [isOpen, cards, generateAllContent]);
  
  if (!isOpen || cards.length === 0) {
    return null;
  }

  const isSingleCard = cards.length === 1;

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out animate-fadeInModal"
      onClick={onClose}
    >
      <div
        className={`bg-violet-50 border border-amber-200/50 rounded-2xl shadow-2xl shadow-amber-500/20 w-11/12 max-h-[90vh] overflow-y-auto p-6 sm:p-8 flex flex-col items-center gap-4 sm:gap-6 animate-zoomIn ${isSingleCard ? 'max-w-lg' : 'max-w-5xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isSingleCard 
            ? <SingleCardView card={cards[0]} isMessageLoading={isMessageLoading} isImageLoading={isImageLoading} generatedMessage={generatedMessages[0]} generatedImageUrl={generatedImageUrl} /> 
            : <ThreeCardSpread cards={cards} isLoading={isMessageLoading} generatedMessages={generatedMessages} />
        }
        
        {error && (
          <div className="text-center mt-6 p-4 bg-red-100/50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button
              onClick={generateAllContent}
              className="mt-3 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-5 rounded-full text-sm transition-transform transform hover:scale-105"
              aria-label="生成を再試行する"
            >
              再試行
            </button>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="mt-8 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-6 rounded-full shadow-md transition-transform transform hover:scale-105"
          aria-label="モーダルを閉じてカードを引き直す"
        >
          もう一度引く
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 1s ease-in-out; }
        .animate-fadeInModal { animation: fadeInModal 0.3s ease-in-out; }
        .animate-zoomIn { animation: zoomIn 0.3s ease-out; }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
};

export default MessageModal;