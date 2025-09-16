
import React from 'react';

interface OracleCardProps {
  onClick: () => void;
  isSelected?: boolean;
}

const OracleCard: React.FC<OracleCardProps> = ({ onClick, isSelected = false }) => {
  return (
    <div
      className={`aspect-[2/3] w-full rounded-lg shadow-lg shadow-amber-500/20 cursor-pointer group perspective-1000 transition-transform duration-300 ${isSelected ? '-translate-y-3' : ''}`}
      onClick={onClick}
    >
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d group-hover:scale-105 group-hover:-translate-y-2 rounded-lg transform-gpu ${isSelected ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-violet-50' : ''}`}>
        {/* Card Back */}
        <div className="absolute w-full h-full bg-gradient-to-br from-indigo-500 to-purple-700 rounded-lg p-1.5 overflow-hidden">
            <div className="w-full h-full border-2 border-amber-300/50 rounded-md flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-1/2 h-1/2 text-amber-300/50 opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 1 0 10 10" />
                    <path d="M12 22a7 7 0 1 0-10-10" />
                    <path d="M22 12a7 7 0 1 0-10 10" />
                    <path d="M2 12a7 7 0 1 0 10-10" />
                 </svg>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OracleCard;
