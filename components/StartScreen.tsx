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

// Feature icons
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.624l-.219.874-.219-.874a1.5 1.5 0 00-1.023-1.023l-.874-.219.874-.219a1.5 1.5 0 001.023-1.023l.219-.874.219.874a1.5 1.5 0 001.023 1.023l.874.219-.874.219a1.5 1.5 0 00-1.023 1.023z" />
  </svg>
);

const LightningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

const StartScreen: React.FC<StartScreenProps> = ({ onFilesSelect, onShowGallery, hasCreations }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelect(e.target.files);
    }
  };

  const features = [
    {
      icon: SparklesIcon,
      title: "Gemini AI Integration",
      description: "Leverages Google's advanced Gemini AI to transform static images into dynamic 360° video content"
    },
    {
      icon: LightningIcon,
      title: "Efficient Processing",
      description: "Streamlined workflow for our team to create professional video content quickly and consistently"
    },
    {
      icon: ShieldIcon,
      title: "Secure Internal Tool",
      description: "Built for our organization's content creation needs with secure processing and user authentication"
    },
    {
      icon: PlayIcon,
      title: "Professional Output",
      description: "Generate high-quality 360° videos suitable for marketing, presentations, and product showcases"
    }
  ];

  const useCases = [
    { title: "Marketing Content", description: "Create engaging visuals for campaigns" },
    { title: "Product Demos", description: "Showcase products from every angle" },
    { title: "Training Materials", description: "Interactive content for internal training" },
    { title: "Presentations", description: "Professional content for client meetings" }
  ];

  return (
    <div className="w-full min-h-screen">
      {/* Hero Section */}
      <div 
        className={`w-full flex flex-col items-center justify-center text-center p-8 min-h-screen transition-all duration-300 ${isDraggingOver ? 'bg-blue-500/10' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          onFilesSelect(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-center gap-6 animate-fade-in max-w-4xl">
          {/* Main Headline */}
          <div className="relative">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-8xl leading-tight">
              Create Immersive <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">360°</span>
            </h1>
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-8xl -mt-2 sm:-mt-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Videos</span>
            </h1>
            <div className="absolute -top-4 -right-4 animate-pulse">
              <SparklesIcon className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          {/* Subtitle */}
          <p className="max-w-2xl text-xl text-gray-300 md:text-2xl mt-4 leading-relaxed">
            Internal tool for creating <span className="text-purple-400 font-semibold">professional 360° videos</span> using Google's Gemini AI. 
            Designed for our team's content creation needs.
          </p>

          {/* CTA Section */}
          <div className="mt-10 flex flex-col items-center gap-6">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl cursor-pointer group hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1 transform">
              <UploadIcon className="w-7 h-7 mr-4" />
              Start Creating
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} multiple />
            
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <p className="text-sm">Drag & drop up to 4 images • Powered by Gemini AI • For internal team use</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">AI</div>
              <div className="text-sm text-gray-400">Powered Generation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">360°</div>
              <div className="text-sm text-gray-400">Immersive Videos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">HD</div>
              <div className="text-sm text-gray-400">Quality Output</div>
            </div>
          </div>

          {hasCreations && (
            <div className="mt-12 border-t border-gray-700/50 pt-8">
              <button 
                onClick={onShowGallery}
                className="bg-white/10 border border-white/20 text-gray-200 font-semibold py-4 px-8 rounded-xl transition-all hover:bg-white/20 hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                View My Creations →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-100 mb-4">Internal Video Creation Tool</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Streamline our team's 360° video production with Google's Gemini AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-black/30 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="w-full py-20 px-8 bg-black/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-100 mb-4">Team Use Cases</h2>
            <p className="text-xl text-gray-400">How our organization can leverage 360° video content</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:from-purple-800/30 hover:to-blue-800/30 transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">{useCase.title}</h3>
                <p className="text-gray-400 text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-100 mb-6">Ready to Create Content?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Start creating professional 360° videos for your projects. 
            Upload your images and let Gemini AI do the work.
          </p>
          
          <label htmlFor="image-upload-bottom" className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl cursor-pointer hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1 transform">
            <UploadIcon className="w-6 h-6 mr-3" />
            Start Creating
          </label>
          <input id="image-upload-bottom" type="file" className="hidden" accept="image/*" onChange={handleFileChange} multiple />
        </div>
      </div>
    </div>
  );
};

export default StartScreen;