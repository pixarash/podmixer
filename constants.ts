
import type { ProjectState } from './types';

export const initialProjectState: ProjectState = {
  name: 'Untitled Podcast',
  tracks: [
    {
      id: 'track-1',
      name: 'Voice',
      audioClip: null,
      volume: 1,
      isMuted: false,
      isSolo: false,
      keyframes: [],
    },
    {
      id: 'track-2',
      name: 'Music',
      audioClip: null,
      volume: 0.5,
      isMuted: false,
      isSolo: false,
      keyframes: [],
    },
  ],
  duration: 300, // Default 5 minutes
};

export const PIXELS_PER_SECOND = 100;
export const TRACK_HEIGHT = 120; // in pixels
   