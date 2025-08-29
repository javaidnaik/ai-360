/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon } from './icons';

interface StartScreenProps {
  onFilesSelect: (files: FileList) => void;
  onShowGallery: () => void;
  hasCreations: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFilesSelect, onShowGallery, hasCreations }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelect(e.target.files);
    }
  };

  return (
    <div 
      className={`w-full h-full flex flex-col items-center justify-center text-center p-8 transition-all duration-300 rounded-2xl ${isDraggingOver ? 'bg-blue-500/10' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFilesSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in max-w-3xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-8xl leading-tight">
          Create Immersive <span className="text-purple-400">360°</span>
        </h1>
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-8xl -mt-4 sm:-mt-6">
          <span className="text-purple-400">Videos</span>
        </h1>
        <p className="max-w-xl text-lg text-gray-400 md:text-xl mt-4">
          Upload up to 4 photos to generate a seamless, panoramic video. No sound, just a pure visual experience.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-blue-600 rounded-lg cursor-pointer group hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px">
                <UploadIcon className="w-6 h-6 mr-3" />
                Upload Images
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} multiple />
            <p className="text-sm text-gray-500">or drag and drop files</p>
        </div>

        {hasCreations && (
           <div className="mt-12 border-t border-gray-700/50 pt-6">
              <button 
                  onClick={onShowGallery}
                  className="bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-6 rounded-lg transition-all hover:bg-white/20 active:scale-95"
              >
                  View My Creations
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default StartScreen;