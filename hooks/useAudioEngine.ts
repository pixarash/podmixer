
import { useState, useRef, useCallback, useEffect } from 'react';
import type { Track } from '../types';

export const useAudioEngine = (tracks: Track[], onTimeUpdate: (time: number) => void, duration: number) => {
  const [isReady, setIsReady] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser", e);
      }
    }
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const initNodesForTrack = useCallback((trackId: string) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    
    if (!gainNodesRef.current.has(trackId)) {
        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNodesRef.current.set(trackId, gainNode);
    }
  }, []);

  const loadAudioForTrack = useCallback(async (file: File): Promise<AudioBuffer | null> => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return null;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    setIsReady(true);
    return audioBuffer;
  }, []);

  const play = useCallback((offset = 0) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    } else {
        // Stop existing sources before creating new ones
        sourceNodesRef.current.forEach(node => {
            try { node.stop(); } catch (e) {}
            node.disconnect();
        });
        sourceNodesRef.current.clear();
        
        const soloTracks = tracks.filter(t => t.isSolo);
        const tracksToPlay = soloTracks.length > 0 ? soloTracks : tracks;
        
        startTimeRef.current = audioContext.currentTime - offset;

        tracksToPlay.forEach(track => {
          if (track.audioClip && !track.isMuted) {
            initNodesForTrack(track.id);

            const sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = track.audioClip.buffer;
            
            const gainNode = gainNodesRef.current.get(track.id)!;
            sourceNode.connect(gainNode);

            // Volume automation
            gainNode.gain.cancelScheduledValues(0);
            gainNode.gain.setValueAtTime(track.volume, 0);
            
            const sortedKeyframes = [...track.keyframes].sort((a,b) => a.time - b.time);

            if (sortedKeyframes.length > 0) {
                // Find the appropriate starting volume at the offset
                let initialVolume = track.volume;
                const nextKfIndex = sortedKeyframes.findIndex(kf => kf.time >= offset);

                if (nextKfIndex === -1) { // We are past the last keyframe
                    initialVolume = sortedKeyframes[sortedKeyframes.length -1].volume * track.volume;
                } else if (nextKfIndex === 0) { // Before the first keyframe
                    initialVolume = sortedKeyframes[0].volume * track.volume;
                } else { // Between two keyframes
                    const prevKf = sortedKeyframes[nextKfIndex - 1];
                    const nextKf = sortedKeyframes[nextKfIndex];
                    const ratio = (offset - prevKf.time) / (nextKf.time - prevKf.time);
                    initialVolume = (prevKf.volume + (nextKf.volume - prevKf.volume) * ratio) * track.volume;
                }

                gainNode.gain.setValueAtTime(initialVolume, audioContext.currentTime);

                // Schedule subsequent keyframes
                sortedKeyframes.forEach(kf => {
                    if(kf.time >= offset) {
                       gainNode.gain.linearRampToValueAtTime(kf.volume * track.volume, startTimeRef.current + kf.time);
                    }
                });
            }
            
            sourceNode.start(audioContext.currentTime, offset);
            sourceNodesRef.current.set(track.id, sourceNode);
          }
        });
    }

  }, [tracks, initNodesForTrack]);

  const pause = useCallback(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext || audioContext.state !== 'running') return;
    
    pausedAtRef.current = audioContext.currentTime - startTimeRef.current;
    audioContext.suspend().then(() => {
        onTimeUpdate(pausedAtRef.current);
    });
  }, [onTimeUpdate]);

  const seek = useCallback((time: number) => {
    const wasPlaying = audioContextRef.current?.state === 'running';
    if(wasPlaying) {
       // Stop playback completely to reschedule
       sourceNodesRef.current.forEach(node => {
         try { node.stop(); } catch(e) {}
         node.disconnect();
       });
       sourceNodesRef.current.clear();
       if (audioContextRef.current) {
         audioContextRef.current.suspend();
       }
    }
    pausedAtRef.current = time;
    onTimeUpdate(time);
    if(wasPlaying) {
        play(time);
    }
  }, [play, onTimeUpdate]);
  
  const exportToWav = useCallback(async () => {
    if (!audioContextRef.current) return;
    
    const offlineContext = new OfflineAudioContext({
        numberOfChannels: 2,
        length: duration * audioContextRef.current.sampleRate,
        sampleRate: audioContextRef.current.sampleRate,
    });

    const soloTracks = tracks.filter(t => t.isSolo);
    const tracksToRender = soloTracks.length > 0 ? soloTracks : tracks;
    
    await Promise.all(tracksToRender.map(async track => {
        if (track.audioClip && !track.isMuted) {
            const source = offlineContext.createBufferSource();
            source.buffer = track.audioClip.buffer;

            const gainNode = offlineContext.createGain();
            source.connect(gainNode);
            gainNode.connect(offlineContext.destination);

            gainNode.gain.setValueAtTime(track.volume, 0);
            const sortedKeyframes = [...track.keyframes].sort((a,b) => a.time - b.time);
            if (sortedKeyframes.length > 0) {
                const initialVolume = sortedKeyframes[0].time > 0 ? track.volume : sortedKeyframes[0].volume * track.volume;
                gainNode.gain.setValueAtTime(initialVolume, 0);
                sortedKeyframes.forEach(kf => {
                    gainNode.gain.linearRampToValueAtTime(kf.volume * track.volume, kf.time);
                });
            }
            source.start(0);
        }
    }));

    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV and trigger download
    const wav = bufferToWave(renderedBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'podmixer_export.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  }, [tracks, duration]);

  return { audioContext: audioContextRef.current, loadAudioForTrack, play, pause, seek, isReady, exportToWav };
};


// Helper to convert AudioBuffer to WAV
function bufferToWave(abuffer: AudioBuffer) {
    let numOfChan = abuffer.numberOfChannels,
        length = abuffer.length * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for(i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while(pos < length) {
        for(i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++
    }
    
    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
    
    return buffer;
}
