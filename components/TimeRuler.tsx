
import React, { memo } from 'react';

interface TimeRulerProps {
  duration: number;
  pixelsPerSecond: number;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const TimeRuler: React.FC<TimeRulerProps> = memo(({ duration, pixelsPerSecond, onClick }) => {
  const width = duration * pixelsPerSecond;
  const majorTickInterval = 5; // seconds
  const minorTicksPerMajor = 5;

  const ticks = [];
  for (let i = 0; i <= duration; i++) {
    const x = i * pixelsPerSecond;
    if (i % majorTickInterval === 0) {
      ticks.push(
        <div key={`major-${i}`} style={{ left: `${x}px` }} className="absolute top-0 h-full">
          <div className="w-px h-6 bg-brand-text-secondary"></div>
          <span className="absolute top-6 -translate-x-1/2 text-xs text-brand-text-secondary">{formatTime(i)}</span>
        </div>
      );
    } else if (i % (majorTickInterval / minorTicksPerMajor) === 0) {
      ticks.push(
        <div key={`minor-${i}`} style={{ left: `${x}px` }} className="absolute top-0 h-4 w-px bg-brand-text-secondary opacity-50"></div>
      );
    }
  }

  return (
    <div 
        className="h-10 bg-brand-gray-light border-b-2 border-black sticky top-0 z-20 cursor-pointer"
        style={{ width: `${width}px` }}
        onClick={onClick}
        >
      {ticks}
    </div>
  );
});
   