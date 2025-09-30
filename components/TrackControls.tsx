
import React, { useRef } from 'react';
import type { Track } from '../types';
import { MuteIcon } from './icons/MuteIcon';
import { UnmuteIcon } from './icons/UnmuteIcon';
import { UploadIcon } from './icons/UploadIcon';

interface TrackControlsProps {
    track: Track;
    onUpdateTrack: (trackId: string, updatedProps: Partial<Track>) => void;
    onFileChange: (trackId: string, file: File) => void;
}

export const TrackControls: React.FC<TrackControlsProps> = ({ track, onUpdateTrack, onFileChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileChange(track.id, e.target.files[0]);
        }
    };
    
    return (
        <div className="w-32 md:w-48 p-2 flex flex-col justify-between bg-brand-gray-light border-r border-black" onClick={(e) => e.stopPropagation()}>
            <input 
                type="text" 
                value={track.name} 
                onChange={(e) => onUpdateTrack(track.id, { name: e.target.value })} 
                className="bg-transparent text-white font-bold truncate w-full p-1 rounded hover:bg-brand-gray-medium focus:bg-brand-gray-medium focus:ring-1 focus:ring-brand-green outline-none"
            />
            <div className="flex items-center flex-wrap justify-center gap-1">
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className='p-2 rounded-full bg-brand-gray-medium text-brand-text-secondary hover:bg-brand-dark'
                    title="Upload/Replace Audio"
                >
                    <UploadIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onUpdateTrack(track.id, { isMuted: !track.isMuted })}
                    className={`p-2 rounded-full transition-colors ${track.isMuted ? 'bg-red-500 text-white' : 'bg-brand-gray-medium text-brand-text-secondary hover:bg-brand-gray-dark'}`}
                    title={track.isMuted ? 'Unmute' : 'Mute'}
                >
                    {track.isMuted ? <UnmuteIcon className="w-5 h-5"/> : <MuteIcon className="w-5 h-5"/>}
                </button>
                 <button 
                    onClick={() => onUpdateTrack(track.id, { isSolo: !track.isSolo })}
                    className={`p-2 rounded-full font-bold transition-colors ${track.isSolo ? 'bg-yellow-500 text-black' : 'bg-brand-gray-medium text-brand-text-secondary hover:bg-brand-gray-dark'}`}
                    title={track.isSolo ? 'Un-solo' : 'Solo'}
                >
                    S
                </button>
                <input 
                    type="range" 
                    min="0" max="1.5" step="0.01" 
                    value={track.volume} 
                    onChange={(e) => onUpdateTrack(track.id, { volume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-brand-gray-medium rounded-lg appearance-none cursor-pointer accent-brand-green"
                    title={`Volume: ${Math.round(track.volume * 100)}%`}
                />
            </div>
        </div>
    );
};
