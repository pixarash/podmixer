
import React from 'react';

interface PlayheadProps {
  currentTime: number;
  pixelsPerSecond: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ currentTime, pixelsPerSecond }) => {
  const left = currentTime * pixelsPerSecond;

  return (
    <div
      className="absolute top-0 z-10 w-0.5 h-full bg-red-500 pointer-events-none"
      style={{
        left: `${left}px`,
        transform: 'translateX(-50%)',
      }}
    >
        <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-red-500 transform rotate-45"></div>
    </div>
  );
};
   