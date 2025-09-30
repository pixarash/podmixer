import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { TransportControls } from './components/TransportControls';
import type { Track, ProjectState, Keyframe } from './types';
import { initialProjectState } from './constants';
import { useAudioEngine } from './hooks/useAudioEngine';

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>(initialProjectState);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedKeyframe, setSelectedKeyframe] = useState<{ trackId: string; index: number } | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  
  const { loadAudioForTrack, play, pause, seek, audioContext, isReady, exportToWav } = useAudioEngine(project.tracks, setCurrentTime, project.duration);

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (audioContext && audioContext.state === 'running') {
        setCurrentTime(audioContext.currentTime - startTimeRef.current);
      }
    };
    let animationFrameId: number;
    let startTimeRef = { current: 0 };
    if (audioContext) {
       startTimeRef.current = audioContext.currentTime - currentTime;
    }

    const loop = () => {
      if (isPlaying) {
        handleTimeUpdate();
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, audioContext, currentTime]);


  const handleFileChange = async (trackId: string, file: File) => {
    const audioBuffer = await loadAudioForTrack(file);
    if (!audioBuffer) return;
    
    setProject(prev => {
        const newTracks = prev.tracks.map(t => 
            t.id === trackId 
            ? { ...t, audioClip: { file, buffer: audioBuffer, duration: audioBuffer.duration } } 
            : t
        );
        const maxDuration = Math.max(...newTracks.map(t => t.audioClip?.duration || 0), 5 * 60);
        return { ...prev, tracks: newTracks, duration: maxDuration };
    });
  };

  const addTrack = () => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `Track ${project.tracks.length + 1}`,
      audioClip: null,
      volume: 1,
      isMuted: false,
      isSolo: false,
      keyframes: [],
    };
    setProject(prev => ({ ...prev, tracks: [...prev.tracks, newTrack] }));
  };

  const updateTrack = (trackId: string, updatedProps: Partial<Track>) => {
    setProject(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? { ...t, ...updatedProps } : t)
    }));
  };
  
  const handleSelectTrack = (trackId: string | null) => {
      setSelectedTrackId(trackId);
      setSelectedKeyframe(null); // Deselect keyframe when track selection changes
  }
  
  const handleSelectKeyframe = (trackId: string, index: number) => {
      setSelectedTrackId(trackId); // Also select the track
      setSelectedKeyframe({ trackId, index });
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play(currentTime);
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleStop = () => {
      pause();
      setIsPlaying(false);
      seek(0);
      setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
    const newTime = Math.max(0, Math.min(time, project.duration));
    seek(newTime);
    setCurrentTime(newTime);
  };
  
  const getVolumeAtTime = (keyframes: Keyframe[], time: number): number => {
    const sortedKeyframes = [...keyframes].sort((a,b) => a.time - b.time);
    if (sortedKeyframes.length === 0) return 0.5; // Default volume

    const nextKfIndex = sortedKeyframes.findIndex(kf => kf.time >= time);
    if (nextKfIndex === -1) return sortedKeyframes[sortedKeyframes.length - 1].volume;
    if (nextKfIndex === 0) return sortedKeyframes[0].volume;

    const prevKf = sortedKeyframes[nextKfIndex - 1];
    const nextKf = sortedKeyframes[nextKfIndex];
    
    if (nextKf.time === prevKf.time) return prevKf.volume;
    
    const ratio = (time - prevKf.time) / (nextKf.time - prevKf.time);
    return prevKf.volume + (nextKf.volume - prevKf.volume) * ratio;
  };

  const handleAddKeyframeAtPlayhead = () => {
      if (!selectedTrackId) return;
      const track = project.tracks.find(t => t.id === selectedTrackId);
      if (!track) return;

      const volume = getVolumeAtTime(track.keyframes, currentTime);
      const newKeyframe: Keyframe = { time: currentTime, volume };
      const updatedKeyframes = [...track.keyframes, newKeyframe].sort((a, b) => a.time - b.time);
      updateTrack(selectedTrackId, { keyframes: updatedKeyframes });
  };
  
  const handleRemoveSelectedKeyframe = () => {
      if (!selectedKeyframe) return;
      const { trackId, index } = selectedKeyframe;
      const track = project.tracks.find(t => t.id === trackId);
      if (!track) return;

      const updatedKeyframes = track.keyframes.filter((_, i) => i !== index);
      updateTrack(trackId, { keyframes: updatedKeyframes });
      setSelectedKeyframe(null);
  };


  const handleFade = (type: 'in' | 'out') => {
    if (!selectedTrackId) return;

    const track = project.tracks.find(t => t.id === selectedTrackId);
    if (!track || !track.audioClip) return;
    
    const FADE_DURATION = 2; // 2 seconds

    if (type === 'in') {
        const endFadeTime = Math.min(FADE_DURATION, track.audioClip.duration);
        // Remove keyframes within the fade-in duration and add new ones
        const otherKeyframes = track.keyframes.filter(kf => kf.time > endFadeTime);
        const newKeyframes = [
            { time: 0, volume: 0 },
            { time: endFadeTime, volume: 1 },
            ...otherKeyframes
        ].sort((a,b) => a.time - b.time);
        updateTrack(selectedTrackId, { keyframes: newKeyframes });
    } else { // Fade out
        const startFadeTime = Math.max(0, track.audioClip.duration - FADE_DURATION);
        // Remove keyframes within the fade-out duration and add new ones
        const otherKeyframes = track.keyframes.filter(kf => kf.time < startFadeTime);
        const newKeyframes = [
            ...otherKeyframes,
            { time: startFadeTime, volume: 1 },
            { time: track.audioClip.duration, volume: 0 }
        ].sort((a,b) => a.time - b.time);
        updateTrack(selectedTrackId, { keyframes: newKeyframes });
    }
  };
  
  const handleExport = () => {
    if (isReady) {
      exportToWav();
    } else {
      alert("Audio engine is not ready. Please add some audio files first.");
    }
  };

  return (
    <div className="bg-brand-gray-dark text-brand-text min-h-screen flex flex-col font-sans">
      <Header 
        onExport={handleExport}
        onFadeIn={() => handleFade('in')}
        onFadeOut={() => handleFade('out')}
        isTrackSelected={!!selectedTrackId}
      />
      <main className="flex-grow flex flex-col p-4 gap-4">
        <div className="flex-grow flex flex-col bg-brand-gray-medium rounded-lg p-4 shadow-lg overflow-hidden">
           <Timeline
                tracks={project.tracks}
                duration={project.duration}
                currentTime={currentTime}
                onFileChange={handleFileChange}
                onUpdateTrack={updateTrack}
                onSeek={handleSeek}
                containerRef={timelineContainerRef}
                selectedTrackId={selectedTrackId}
                onSelectTrack={handleSelectTrack}
                selectedKeyframe={selectedKeyframe}
                onSelectKeyframe={handleSelectKeyframe}
            />
        </div>
        <div className="flex-shrink-0">
          <TransportControls 
            isPlaying={isPlaying} 
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            currentTime={currentTime} 
            duration={project.duration}
            onAddTrack={addTrack}
            isReady={isReady}
            onAddKeyframe={handleAddKeyframeAtPlayhead}
            onRemoveKeyframe={handleRemoveSelectedKeyframe}
            isKeyframeSelected={!!selectedKeyframe}
            isTrackSelected={!!selectedTrackId}
            />
        </div>
      </main>
    </div>
  );
};

export default App;