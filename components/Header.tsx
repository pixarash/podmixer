
import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface HeaderProps {
    onExport: () => void;
    onFadeIn: () => void;
    onFadeOut: () => void;
    isTrackSelected: boolean;
}

// Inline SVG icons for simplicity
const FadeInIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 12h3M7 8v8M11 4v16M15 8v8M19 12h2"/>
        <path d="M3 12q9 10 18 0" strokeDasharray="3 3" stroke="rgba(255,255,255,0.4)"/>
    </svg>
);

const FadeOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 12h3M7 8v8M11 4v16M15 8v8M19 12h2"/>
        <path d="M3 22Q12 12 21 22" strokeDasharray="3 3" stroke="rgba(255,255,255,0.4)"/>
    </svg>
);

const SplitIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 4v16"/>
        <path d="M8 12H3"/>
        <path d="M21 12h-5"/>
        <path d="m8 10-2 2 2 2"/>
        <path d="m16 14 2-2-2-2"/>
    </svg>
);

const CutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="6" cy="6" r="3"/>
        <circle cx="6" cy="18" r="3"/>
        <path d="M20 4 8.12 15.88"/>
        <path d="m14.47 14.48 5.53 5.53"/>
        <path d="M8.12 8.12 12 12"/>
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ onExport, onFadeIn, onFadeOut, isTrackSelected }) => {
  const buttonClass = `p-2 rounded-md transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${isTrackSelected ? 'bg-brand-gray-medium hover:bg-brand-gray-light' : 'bg-brand-gray-light'}`;
  const disabledTitle = "Select a track to use this tool";

  return (
    <header className="bg-brand-dark flex flex-col md:flex-row items-center justify-between p-4 border-b border-brand-gray-light shadow-md gap-4">
      <div className="flex items-center gap-3">
        <svg
          className="w-8 h-8 text-brand-green"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
            fill="currentColor"
          />
          <path
            d="M12 18C15.31 18 18 15.31 18 12H16C16 14.21 14.21 16 12 16V18Z"
            fill="currentColor"
          />
           <path d="M10 8H11V16H10V8Z" fill="currentColor"/>
           <path d="M13 6H14V16H13V6Z" fill="currentColor"/>
        </svg>
        <h1 className="text-2xl font-bold text-brand-text tracking-wider">PodMixer</h1>
      </div>
      
      <div className="flex items-center gap-2 p-2 bg-brand-gray-dark rounded-lg">
        <button onClick={onFadeIn} disabled={!isTrackSelected} className={buttonClass} title={isTrackSelected ? "Add 2s Fade In" : disabledTitle}>
            <FadeInIcon className="w-5 h-5" /> Fade In
        </button>
        <button onClick={onFadeOut} disabled={!isTrackSelected} className={buttonClass} title={isTrackSelected ? "Add 2s Fade Out" : disabledTitle}>
            <FadeOutIcon className="w-5 h-5" /> Fade Out
        </button>
        <div className="w-px h-6 bg-brand-gray-light mx-2"></div>
        <button disabled className={buttonClass} title="Split at Playhead (Coming Soon)">
            <SplitIcon className="w-5 h-5" /> Split
        </button>
        <button disabled className={buttonClass} title="Cut Selection (Coming Soon)">
            <CutIcon className="w-5 h-5" /> Cut
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onExport}
          className="bg-brand-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors duration-200"
        >
          <DownloadIcon className="w-5 h-5" />
          Export WAV
        </button>
      </div>
    </header>
  );
};
