import React from 'react';
import type { Track, Keyframe } from '../types';
import { TrackControls } from './TrackControls';
import { WaveformDisplay } from './WaveformDisplay';
import { TRACK_HEIGHT } from '../constants';

interface TrackLaneProps {
  track: Track;
  onFileChange: (trackId: string, file: File) => void;
  onUpdateTrack: (trackId: string, updatedProps: Partial<Track>) => void;
  isSelected: boolean;
  onSelectTrack: (trackId: string) => void;
  selectedKeyframeIndex: number | null;
  onSelectKeyframe: (trackId: string, index: number) => void;
}

export const TrackLane: React.FC<TrackLaneProps> = ({ track, onFileChange, onUpdateTrack, isSelected, onSelectTrack, selectedKeyframeIndex, onSelectKeyframe }) => {
  
  const handleAddKeyframe = (time: number, volume: number) => {
    const newKeyframe: Keyframe = { time, volume };
    const updatedKeyframes = [...track.keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    onUpdateTrack(track.id, { keyframes: updatedKeyframes });
  };
  
  const handleUpdateKeyframe = (index: number, newTime: number, newVolume: number) => {
    const updatedKeyframes = [...track.keyframes];
    updatedKeyframes[index] = { time: newTime, volume: newVolume };
    updatedKeyframes.sort((a,b) => a.time - b.time);
    onUpdateTrack(track.id, { keyframes: updatedKeyframes });
  };
  
  const handleRemoveKeyframe = (index: number) => {
      const updatedKeyframes = track.keyframes.filter((_, i) => i !== index);
      onUpdateTrack(track.id, { keyframes: updatedKeyframes });
  };

  return (
    <div 
        className={`flex items-stretch border-t border-brand-gray-light transition-all duration-150 ${isSelected ? 'ring-2 ring-brand-green z-10' : ''}`} 
        style={{ height: `${TRACK_HEIGHT}px` }}
        onClick={(e) => { e.stopPropagation(); onSelectTrack(track.id); }}
        >
      <TrackControls track={track} onUpdateTrack={onUpdateTrack} onFileChange={onFileChange}/>
      <div className="flex-grow bg-brand-gray-medium relative cursor-pointer">
        {track.audioClip ? (
          <WaveformDisplay 
            trackId={track.id}
            audioBuffer={track.audioClip.buffer}
            keyframes={track.keyframes}
            onAddKeyframe={handleAddKeyframe}
            onUpdateKeyframe={handleUpdateKeyframe}
            onRemoveKeyframe={handleRemoveKeyframe}
            selectedKeyframeIndex={selectedKeyframeIndex}
            onSelectKeyframe={onSelectKeyframe}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-text-secondary pointer-events-none">
            <span>Upload audio using the button on the left</span>
          </div>
        )}
      </div>
    </div>
  );
};