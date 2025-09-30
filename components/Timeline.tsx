import React from 'react';
import type { Track } from '../types';
import { TrackLane } from './TrackLane';
import { TimeRuler } from './TimeRuler';
import { Playhead } from './Playhead';
import { PIXELS_PER_SECOND } from '../constants';

interface TimelineProps {
  tracks: Track[];
  duration: number;
  currentTime: number;
  onFileChange: (trackId: string, file: File) => void;
  onUpdateTrack: (trackId:string, updatedProps: Partial<Track>) => void;
  onSeek: (time: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  selectedKeyframe: { trackId: string; index: number } | null;
  onSelectKeyframe: (trackId: string, index: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  duration,
  currentTime,
  onFileChange,
  onUpdateTrack,
  onSeek,
  containerRef,
  selectedTrackId,
  onSelectTrack,
  selectedKeyframe,
  onSelectKeyframe,
}) => {
  const timelineWidth = duration * PIXELS_PER_SECOND;

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const x = e.clientX - rect.left + scrollLeft;
        const time = x / PIXELS_PER_SECOND;
        onSeek(time);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-auto bg-brand-gray-dark rounded relative"
      onClick={() => onSelectTrack(null)} // Click on empty space to deselect
    >
      <div style={{ width: `${timelineWidth}px`, position: 'relative' }}>
        <TimeRuler duration={duration} pixelsPerSecond={PIXELS_PER_SECOND} onClick={handleRulerClick} />
        <Playhead currentTime={currentTime} pixelsPerSecond={PIXELS_PER_SECOND} />
        <div className="pt-[40px]">
          {tracks.map((track) => (
            <TrackLane
              key={track.id}
              track={track}
              onFileChange={onFileChange}
              onUpdateTrack={onUpdateTrack}
              isSelected={track.id === selectedTrackId}
              onSelectTrack={onSelectTrack}
              selectedKeyframeIndex={selectedKeyframe?.trackId === track.id ? selectedKeyframe.index : null}
              onSelectKeyframe={onSelectKeyframe}
            />
          ))}
        </div>
      </div>
    </div>
  );
};