
export interface Keyframe {
  time: number;
  volume: number;
}

export interface AudioClip {
  file: File;
  buffer: AudioBuffer;
  duration: number;
}

export interface Track {
  id: string;
  name: string;
  audioClip: AudioClip | null;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  keyframes: Keyframe[];
}

export interface ProjectState {
  name: string;
  tracks: Track[];
  duration: number; // in seconds
}
   