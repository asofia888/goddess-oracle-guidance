import React from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

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
          <h2 className="text-2xl sm:text-3xl font-bold text-orange-800 tracking-wide">免責事項・利用規約</h2>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-amber-700/80 hover:bg-amber-200/50 rounded-full" aria-label="閉じる">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow text-stone-700 space-y-4 text-sm leading-relaxed">
            <p>本アプリケーション「女神のオラクルガイダンス」（以下「本アプリ」）をご利用いただきありがとうございます。本アプリのご利用にあたっては、以下の免責事項・利用規約（以下「本規約」）をよくお読みいただき、ご同意の上でご利用ください。</p>
            
            <h3 className="text-lg font-bold text-amber-800 pt-2">1. エンターテイメント目的</h3>
            <p>本アプリが提供するオラクルカードリーディングおよびAIによって生成されるメッセージは、エンターテイメントを目的としたものです。人生に関するガイダンスやインスピレーションを提供するものですが、その内容の正確性、完全性、有用性を保証するものではありません。</p>

            <h3 className="text-lg font-bold text-amber-800 pt-2">2. 専門的な助言の代替ではありません</h3>
            <p>本アプリが提供する情報は、法律、医療、金融、心理その他いかなる専門的な助言に代わるものではありません。人生における重要な決定や、専門的な判断を必要とする問題については、必ず資格を有する専門家にご相談ください。</p>

            <h3 className="text-lg font-bold text-amber-800 pt-2">3. AIによる生成コンテンツについて</h3>
            <p>本アプリのメッセージの一部は、生成AI技術を用いて作成されています。AIは学習データに基づき情報を生成しますが、その内容が常に事実に基づいている、あるいは不適切な内容を含まないとは限りません。生成されたメッセージは、あくまで一つの視点やインスピレーションとしてお受け取りください。</p>
            
            <h3 className="text-lg font-bold text-amber-800 pt-2">4. 免責事項</h3>
            <p>利用者が本アプリの利用を通じて得た情報に基づいて行った一切の行為、およびその結果について、本アプリの開発者は何らの責任を負うものではありません。本アプリの利用は、利用者ご自身の判断と責任において行ってください。</p>
            
            <h3 className="text-lg font-bold text-amber-800 pt-2">5. 本規約への同意</h3>
            <p>利用者が本アプリを利用された場合、本規約のすべての内容に同意したものとみなします。</p>

            <h3 className="text-lg font-bold text-amber-800 pt-2">6. サービスの変更・中断</h3>
            <p>本アプリは、事前の通知なくサービス内容の変更、追加、または提供を中断・終了することがあります。これにより利用者に生じたいかなる損害についても、開発者は責任を負いません。</p>
        </div>
        
        <footer className="p-4 sm:p-6 border-t border-amber-200/50 text-right">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
            >
              閉じる
            </button>
          </footer>
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

export default DisclaimerModal;