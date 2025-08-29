/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generate360Video } from '../services/geminiService';
import * as db from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Spinner from './Spinner';
import StartScreen from './StartScreen';
import { AddIcon, TrashIcon, VideoIcon } from './icons';
import { VideoCreation } from '../types';

type View = 'start' | 'editor' | 'loading' | 'result' | 'gallery' | 'error';
const MAX_IMAGES = 4;

// Helper to combine images into a horizontal strip
const combineImages = (imageFiles: File[]): Promise<File> => {
  return new Promise(async (resolve, reject) => {
    const images = await Promise.all(
      imageFiles.map(file => {
        return new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
          const img = new Image();
          img.onload = () => resolveImg(img);
          img.onerror = rejectImg;
          img.src = URL.createObjectURL(file);
        });
      })
    );

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Could not create canvas context.'));
    
    const totalWidth = images.reduce((sum, img) => sum + img.width, 0);
    const maxHeight = Math.max(...images.map(img => img.height));
    
    canvas.width = totalWidth;
    canvas.height = maxHeight;
    
    let currentX = 0;
    images.forEach(img => {
      ctx.drawImage(img, currentX, 0);
      currentX += img.width;
      URL.revokeObjectURL(img.src);
    });
    
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas to Blob conversion failed.'));
      resolve(new File([blob], 'combined-image.png', { type: 'image/png' }));
    }, 'image/png');
  });
};

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<View>('start');
  const [images, setImages] = useState<File[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [animationStyle, setAnimationStyle] = useState<string>('Slow Spin');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [galleryVideos, setGalleryVideos] = useState<VideoCreation[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Load user's videos from DB on initial load
    const fetchVideos = async () => {
      if (user) {
        const userVideos = await db.getVideosByUserId(user.id);
        setGalleryVideos(userVideos);
      } else {
        // For backward compatibility, load all videos if no user
        const videos = await db.getAllVideos();
        setGalleryVideos(videos);
      }
    };
    fetchVideos();
  }, [user]);

  const handleFilesSelect = useCallback((files: FileList) => {
    const newImages = Array.from(files).slice(0, MAX_IMAGES - images.length);
    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      setView('editor');
    }
  }, [images.length]);

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (images.length === 0) {
      setError('Please upload at least one image.');
      setView('error');
      return;
    }

    setView('loading');
    setError(null);
    
    let animationPrompt = '';
    switch(animationStyle) {
        case 'Slow Spin':
            animationPrompt = 'Create a video with a slow, smooth 360-degree spin of the object.';
            break;
        case 'Fast Spin':
            animationPrompt = 'Create a video with a fast, dynamic 360-degree spin of the object.';
            break;
        case 'Orbit':
            animationPrompt = 'Create a video where the camera orbits around the object, showing it from all angles.';
            break;
        default:
            animationPrompt = 'Create a 360-degree video of the object.';
    }

    const finalPrompt = `${animationPrompt} ${prompt}`.trim();
    
    try {
      const combinedImageFile = await combineImages(images);
      const generatedBlob = await generate360Video(combinedImageFile, finalPrompt, setLoadingMessage);
      
      const newCreation: Omit<VideoCreation, 'id' | 'url'> = {
        prompt: finalPrompt,
        videoBlob: generatedBlob,
        timestamp: Date.now(),
        userId: user?.id // Associate with current user
      };
      
      const savedId = await db.addVideo(newCreation);
      const savedVideoWithUrl = { ...newCreation, id: savedId, url: URL.createObjectURL(generatedBlob) };
      
      setGalleryVideos(prev => [savedVideoWithUrl, ...prev]);
      setVideoUrl(savedVideoWithUrl.url);
      setView('result');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the video. ${errorMessage}`);
      setView('error');
      console.error(err);
    }
  }, [images, prompt, animationStyle, user]);
  
  const handleDeleteVideo = async (id: number) => {
    await db.deleteVideo(id);
    const updatedVideos = galleryVideos.filter(video => {
      if (video.id === id) {
        URL.revokeObjectURL(video.url); // Clean up blob URL
        return false;
      }
      return true;
    });
    setGalleryVideos(updatedVideos);
  };

  const handleReset = useCallback(() => {
    setImages([]);
    setPrompt('');
    setAnimationStyle('Slow Spin');
    setLoadingMessage('');
    setError(null);
    // videoUrl is revoked when the component unmounts or when a new video is made
    setVideoUrl(null);
    setView('start');
  }, []);

  useEffect(() => {
    // Cleanup blob URLs when component unmounts
    return () => {
      galleryVideos.forEach(video => URL.revokeObjectURL(video.url));
      if(videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [galleryVideos, videoUrl]);

  const renderContent = () => {
    switch (view) {
      case 'start':
        return <StartScreen onFilesSelect={handleFilesSelect} onShowGallery={() => setView('gallery')} hasCreations={galleryVideos.length > 0} />;
      
      case 'editor':
        return (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 animate-fade-in p-4">
            <Header onShowGallery={() => setView('gallery')} hasCreations={galleryVideos.length > 0}/>
            <div className="w-full bg-black/20 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-100 mb-1">Your Images</h2>
                <p className="text-gray-400 mb-4">Arrange your images if needed. Up to {MAX_IMAGES} allowed.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="relative group rounded-md overflow-hidden border-2 border-gray-600 bg-gray-800/30">
                            <div className="aspect-square flex items-center justify-center p-2">
                                <img 
                                    src={URL.createObjectURL(image)} 
                                    alt={`upload-preview-${index}`} 
                                    className="max-w-full max-h-full object-contain rounded"
                                />
                            </div>
                            <button 
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                              aria-label="Remove image"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-gray-600 text-gray-400 hover:bg-gray-700/50 hover:border-gray-500 transition-colors"
                        >
                           <AddIcon className="w-8 h-8" />
                           <span className="text-sm font-semibold mt-1">Add More</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full bg-black/20 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-100 mb-1">Animation Style</h2>
                <p className="text-gray-400 mb-4">Choose a preset animation for your video.</p>
                <select
                    value={animationStyle}
                    onChange={(e) => setAnimationStyle(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                >
                    <option>Slow Spin</option>
                    <option>Fast Spin</option>
                    <option>Orbit</option>
                </select>
            </div>

            <div className="w-full bg-black/20 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-100 mb-1">Describe Your Video</h2>
                <p className="text-gray-400 mb-4">Optionally, add more details to guide the AI.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., cinematic style, on a wooden table, with a soft background blur..."
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 text-base focus:ring-2 focus:ring-purple-500 focus:outline-none transition h-28 resize-none"
                />
            </div>
            
            <button 
                onClick={handleGenerate}
                disabled={images.length === 0}
                className="w-full max-w-sm bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-5 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-700 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
                <VideoIcon className="w-6 h-6" />
                Generate 360° Video
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && handleFilesSelect(e.target.files)} />
          </div>
        );

      case 'loading':
        return (
          <div className="text-center animate-fade-in flex flex-col items-center justify-center gap-4">
            <Spinner />
            <h2 className="text-2xl font-bold text-gray-200">Generating Your Video...</h2>
            <p className="text-md text-gray-400 max-w-sm">{loadingMessage}</p>
          </div>
        );

      case 'result':
        return (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in p-4">
            <h2 className="text-4xl font-bold text-gray-100">Your 360° Video is Ready!</h2>
            {videoUrl && (
              <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-2xl border border-gray-700" />
            )}
            <div className="flex items-center gap-4 mt-4">
              <button 
                  onClick={() => setView('editor')}
                  className="bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-6 rounded-lg transition-all hover:bg-white/20 active:scale-95"
              >
                  Create Another
              </button>
              <a 
                  href={videoUrl ?? undefined}
                  download="generated-video.mp4"
                  className="bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-px"
              >
                  Download Video
              </a>
            </div>
             <button onClick={() => setView('gallery')} className="text-gray-400 hover:text-white transition mt-4">
                View All Creations
              </button>
          </div>
        );
      
      case 'gallery':
        return (
           <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 animate-fade-in p-4">
             <Header onShowGallery={() => setView('gallery')} hasCreations={galleryVideos.length > 0} />
             <h2 className="text-4xl font-bold text-gray-100">My Creations</h2>
             {galleryVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {galleryVideos.map((video) => (
                  <div key={video.id} className="bg-black/20 border border-gray-700/50 rounded-lg overflow-hidden group">
                    <video src={video.url} controls loop className="w-full aspect-video" />
                    <div className="p-4">
                      <p className="text-gray-400 text-sm truncate" title={video.prompt}>{video.prompt}</p>
                      <p className="text-gray-500 text-xs mt-1">{new Date(video.timestamp).toLocaleString()}</p>
                      <div className="flex items-center justify-between mt-4">
                        <a href={video.url} download={`video-${video.id}.mp4`} className="text-sm font-semibold text-green-400 hover:text-green-300">Download</a>
                        <button onClick={() => handleDeleteVideo(video.id)} className="text-sm font-semibold text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
             ) : (
              <div className="text-center py-16">
                <p className="text-gray-400">You haven't created any videos yet.</p>
                <button onClick={handleReset} className="mt-4 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg">
                  Create Your First Video
                </button>
              </div>
             )}
              <button onClick={handleReset} className="mt-4 bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-6 rounded-lg transition-all hover:bg-white/20 active:scale-95">
                  Back to Start
              </button>
           </div>
        );

      case 'error':
        return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors mt-4"
              >
                Start Over
            </button>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col items-center justify-center p-4">
      <main className="w-full flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default MainApp;
