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
      title: "AI-Powered Magic",
      description: "Advanced AI transforms your static images into dynamic 360° videos with seamless motion"
    },
    {
      icon: LightningIcon,
      title: "Lightning Fast",
      description: "Generate professional-quality videos in minutes, not hours. Perfect for social media and presentations"
    },
    {
      icon: ShieldIcon,
      title: "Privacy First",
      description: "Your images are processed securely. We never store or share your personal content"
    },
    {
      icon: PlayIcon,
      title: "Cinema Quality",
      description: "Export high-resolution videos ready for any platform - Instagram, TikTok, YouTube, or presentations"
    }
  ];

  const useCases = [
    { title: "Product Showcases", description: "Perfect for e-commerce and marketing" },
    { title: "Real Estate Tours", description: "Immersive property presentations" },
    { title: "Art & Design", description: "Showcase creative work dynamically" },
    { title: "Social Media", description: "Eye-catching content that stands out" }
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
            Transform your photos into <span className="text-purple-400 font-semibold">cinematic 360° experiences</span> with the power of AI. 
            No technical skills required.
          </p>

          {/* CTA Section */}
          <div className="mt-10 flex flex-col items-center gap-6">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl cursor-pointer group hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1 transform">
              <UploadIcon className="w-7 h-7 mr-4" />
              Start Creating Now
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} multiple />
            
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-sm">Drag & drop up to 4 images • Free to use • No signup required</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-3xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">10K+</div>
              <div className="text-sm text-gray-400">Videos Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">30 sec</div>
              <div className="text-sm text-gray-400">Average Process Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">4K</div>
              <div className="text-sm text-gray-400">Max Resolution</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">100%</div>
              <div className="text-sm text-gray-400">Free Forever</div>
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
            <h2 className="text-4xl font-bold text-gray-100 mb-4">Why Choose Pixshop?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The most advanced 360° video generator, powered by cutting-edge AI technology
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
            <h2 className="text-4xl font-bold text-gray-100 mb-4">Perfect For Every Creator</h2>
            <p className="text-xl text-gray-400">From businesses to artists, everyone can create stunning 360° content</p>
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
          <h2 className="text-4xl font-bold text-gray-100 mb-6">Ready to Create Magic?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of creators who are already making stunning 360° videos. 
            Upload your first images and see the magic happen.
          </p>
          
          <label htmlFor="image-upload-bottom" className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl cursor-pointer hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1 transform">
            <UploadIcon className="w-6 h-6 mr-3" />
            Get Started - It's Free!
          </label>
          <input id="image-upload-bottom" type="file" className="hidden" accept="image/*" onChange={handleFileChange} multiple />
        </div>
      </div>
    </div>
  );
};

export default StartScreen;