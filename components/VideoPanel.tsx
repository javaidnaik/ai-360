/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface VideoPanelProps {
  onGenerateVideo: () => void;
  isLoading: boolean;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ onGenerateVideo, isLoading }) => {
  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-xl font-semibold text-center text-gray-200">Create a 360° Video</h3>
      <p className="text-md text-gray-400 text-center max-w-md">
        Turn your static image into an immersive, cinematic 360-degree panning video. This process can take several minutes.
      </p>
      <button
        onClick={onGenerateVideo}
        disabled={isLoading}
        className="mt-4 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-5 px-10 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        Generate Video
      </button>
    </div>
  );
};

export default VideoPanel;
