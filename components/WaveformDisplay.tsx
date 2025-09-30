
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Keyframe } from '../types';
import { PIXELS_PER_SECOND, TRACK_HEIGHT } from '../constants';

interface WaveformDisplayProps {
  trackId: string;
  audioBuffer: AudioBuffer;
  keyframes: Keyframe[];
  onAddKeyframe: (time: number, volume: number) => void;
  onUpdateKeyframe: (index: number, time: number, volume: number) => void;
  onRemoveKeyframe: (index: number) => void;
  selectedKeyframeIndex: number | null;
  onSelectKeyframe: (trackId: string, index: number) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ 
    trackId,
    audioBuffer, 
    keyframes, 
    onAddKeyframe, 
    onUpdateKeyframe, 
    onRemoveKeyframe, 
    selectedKeyframeIndex, 
    onSelectKeyframe 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingKeyframe, setDraggingKeyframe] = useState<number | null>(null);
  const [newlyAddedKeyframeTime, setNewlyAddedKeyframeTime] = useState<number | null>(null);

  const width = audioBuffer.duration * PIXELS_PER_SECOND;
  const height = TRACK_HEIGHT;

  // Effect to start dragging a keyframe right after it's added by clicking the line
  useEffect(() => {
    if (newlyAddedKeyframeTime !== null) {
      // Find the index of the keyframe we just added
      const newIndex = keyframes.findIndex(k => k.time === newlyAddedKeyframeTime);
      if (newIndex > -1) {
        setDraggingKeyframe(newIndex);
      }
      setNewlyAddedKeyframeTime(null);
    }
  }, [keyframes, newlyAddedKeyframeTime]);
  
  const getVolumeAtTime = useCallback((time: number): number => {
    const sortedKeyframes = [...keyframes].sort((a,b) => a.time - b.time);
    if (sortedKeyframes.length === 0) return 0.5; // Default volume if no keyframes

    const nextKfIndex = sortedKeyframes.findIndex(kf => kf.time >= time);
    if (nextKfIndex === -1) return sortedKeyframes[sortedKeyframes.length - 1].volume; // After last keyframe
    if (nextKfIndex === 0) return sortedKeyframes[0].volume; // Before first keyframe

    const prevKf = sortedKeyframes[nextKfIndex - 1];
    const nextKf = sortedKeyframes[nextKfIndex];
    
    if (nextKf.time === prevKf.time) return prevKf.volume;
    
    // Linear interpolation
    const ratio = (time - prevKf.time) / (nextKf.time - prevKf.time);
    return prevKf.volume + (nextKf.volume - prevKf.volume) * ratio;

  }, [keyframes]);
  
  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D) => {
      const data = audioBuffer.getChannelData(0);
      const step = Math.ceil(data.length / width);
      const amp = height / 2;
      
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = '#1DB954';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
      }
      ctx.stroke();
  }, [audioBuffer, width, height]);
  
  const drawAutomation = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    const sortedKeyframes = [...keyframes].sort((a,b) => a.time - b.time);

    ctx.beginPath();
    let firstVolume = getVolumeAtTime(0);
    ctx.moveTo(0, (1 - firstVolume) * height);

    sortedKeyframes.forEach(kf => {
        const x = kf.time * PIXELS_PER_SECOND;
        const y = (1 - kf.volume) * height;
        ctx.lineTo(x, y);
    });
    
    let lastVolume = getVolumeAtTime(audioBuffer.duration);
    ctx.lineTo(width, (1 - lastVolume) * height);
    ctx.stroke();

    keyframes.forEach((kf, index) => {
      const isSelected = index === selectedKeyframeIndex;
      const x = kf.time * PIXELS_PER_SECOND;
      const y = (1 - kf.volume) * height;
      ctx.fillStyle = isSelected ? '#1DB954' : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [keyframes, height, width, audioBuffer.duration, getVolumeAtTime, selectedKeyframeIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawWaveform(ctx);
    drawAutomation(ctx);
    
  }, [drawWaveform, drawAutomation, audioBuffer, keyframes, selectedKeyframeIndex]);

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return {x, y};
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.stopPropagation(); // Prevent track selection when interacting with waveform
      const {x, y} = getMousePosition(e);
      const hitRadius = 15; // Increased hit radius for easier touch interaction

      // Check for grabbing an existing keyframe
      for(let i = 0; i < keyframes.length; i++) {
          const kf = keyframes[i];
          const kfX = kf.time * PIXELS_PER_SECOND;
          const kfY = (1 - kf.volume) * height;
          if (Math.sqrt((x - kfX)**2 + (y-kfY)**2) < hitRadius) {
              onSelectKeyframe(trackId, i);
              setDraggingKeyframe(i);
              return;
          }
      }

      // Check for grabbing the line itself
      const time = x / PIXELS_PER_SECOND;
      const volumeOnLine = getVolumeAtTime(time);
      const lineY = (1 - volumeOnLine) * height;

      if (Math.abs(y - lineY) < hitRadius) { // Increased tolerance
          const newVolume = Math.max(0, Math.min(1, 1 - (y/height)));
          onAddKeyframe(time, newVolume);
          setNewlyAddedKeyframeTime(time);
      }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingKeyframe === null) return;
      const {x, y} = getMousePosition(e);
      const time = Math.max(0, Math.min(audioBuffer.duration, x / PIXELS_PER_SECOND));
      const volume = Math.max(0, Math.min(1, 1 - (y/height)));
      onUpdateKeyframe(draggingKeyframe, time, volume);
  };
  
  const handleMouseUp = () => {
      setDraggingKeyframe(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.stopPropagation();
      const {x, y} = getMousePosition(e);
      const time = x / PIXELS_PER_SECOND;
      const volume = 1 - (y / height);
      onAddKeyframe(time, volume);
  };

  return <canvas 
            ref={canvasRef} 
            width={width} 
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className="cursor-crosshair"
            style={{imageRendering: 'pixelated'}}
        />;
};
