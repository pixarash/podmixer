import React from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { PlusIcon } from './icons/PlusIcon';
import { KeyframeIcon } from './icons/KeyframeIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  currentTime: number;
  duration: number;
  onAddTrack: () => void;
  isReady: boolean;
  onAddKeyframe: () => void;
  onRemoveKeyframe: () => void;
  isKeyframeSelected: boolean;
  isTrackSelected: boolean;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};


export const TransportControls: React.FC<TransportControlsProps> = ({ 
    isPlaying, 
    onPlayPause, 
    onStop, 
    currentTime, 
    duration, 
    onAddTrack, 
    isReady,
    onAddKeyframe,
    onRemoveKeyframe,
    isKeyframeSelected,
    isTrackSelected,
}) => {
  return (
    <div className="bg-brand-gray-light p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2 flex-wrap justify-center">
            <button 
                onClick={onAddTrack} 
                className="bg-brand-gray-medium hover:bg-brand-dark text-brand-text-secondary font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
                <PlusIcon className="w-5 h-5"/> Add Track
            </button>
             <button 
                onClick={onAddKeyframe} 
                disabled={!isTrackSelected}
                title={isTrackSelected ? "Add keyframe at playhead" : "Select a track to add a keyframe"}
                className="bg-brand-gray-medium hover:bg-brand-dark text-brand-text-secondary font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <KeyframeIcon className="w-5 h-5"/> Add Keyframe
            </button>
            {isKeyframeSelected && (
                 <button 
                    onClick={onRemoveKeyframe} 
                    title="Remove selected keyframe"
                    className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                    <TrashIcon className="w-5 h-5"/> Remove Keyframe
                </button>
            )}
        </div>
      <div className="flex items-center gap-4 order-first md:order-none">
        <button onClick={onStop} className="p-3 bg-brand-gray-medium rounded-full hover:bg-brand-dark transition-colors" disabled={!isReady}>
            <StopIcon className="w-6 h-6 text-brand-text" />
        </button>
        <button onClick={onPlayPause} className="p-4 bg-brand-green rounded-full hover:bg-green-500 transition-colors disabled:bg-gray-500" disabled={!isReady}>
          {isPlaying ? <PauseIcon className="w-8 h-8 text-white"/> : <PlayIcon className="w-8 h-8 text-white" />}
        </button>
      </div>
      <div className="text-2xl font-mono bg-black text-brand-green p-2 rounded-md w-48 text-center">
        {formatTime(currentTime)}
      </div>
    </div>
  );
};