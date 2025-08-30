/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generate360Video } from '../services/geminiService';
import * as db from '../services/supabaseDb';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Spinner from './Spinner';
import StartScreen from './StartScreen';
import MyCreations from './MyCreations';
import ImageEditor from './ImageEditor';
import GoogleDriveAuth from './GoogleDriveAuth';
import { AddIcon, TrashIcon, VideoIcon, DownloadIcon } from './icons';
import { VideoCreation } from '../types';
import { googleDriveService } from '../services/googleDriveService';

type View = 'start' | 'editor' | 'loading' | 'result' | 'gallery' | 'error' | 'creations' | 'image-editor';
const MAX_IMAGES = 1;

// Helper to process the primary image for 360° video generation
const processImageForGeneration = (imageFiles: File[]): Promise<File> => {
  return new Promise(async (resolve, reject) => {
    // For 360° video generation, we use the first/primary image
    // Multiple images are for user reference/selection, but AI works best with single image
    const primaryImage = imageFiles[0];
    
    if (!primaryImage) {
      return reject(new Error('No image provided for processing.'));
    }

    // Load and potentially optimize the primary image
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not create canvas context.'));
      
      // Use original dimensions for best quality
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the primary image
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas to Blob conversion failed.'));
        resolve(new File([blob], 'primary-image.png', { type: 'image/png' }));
      }, 'image/png');
    };
    
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = URL.createObjectURL(primaryImage);
  });
};

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<View>(user ? 'editor' : 'start');
  const [images, setImages] = useState<File[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [animationStyle, setAnimationStyle] = useState<string>('Cinematic Zoom');
  const [videoDuration, setVideoDuration] = useState<number>(5); // Default 5 seconds
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [galleryVideos, setGalleryVideos] = useState<VideoCreation[]>([]);
  const [isDriveAuthenticated, setIsDriveAuthenticated] = useState(false);
  const [driveAuthError, setDriveAuthError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Initialize default super admin and load user's videos from DB on initial load
    const initializeAndFetchVideos = async () => {
      try {
        // Initialize default super admin
        await db.initializeDefaultSuperAdmin();
        
        // Load videos
        if (user) {
          const userVideos = await db.getVideosByUserId(user.id);
          setGalleryVideos(userVideos);
        } else {
          // For backward compatibility, load all videos if no user
          const videos = await db.getAllVideos();
          setGalleryVideos(videos);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    initializeAndFetchVideos();
  }, [user]);

  // Update view based on user login state
  useEffect(() => {
    if (user && view === 'start') {
      setView('editor');
    } else if (!user && (view === 'editor' || view === 'gallery')) {
      setView('start');
    }
  }, [user, view]);

  // Check Google Drive authentication status on load
  useEffect(() => {
    const checkDriveAuth = async () => {
      if (user) {
        try {
          // Set current user for Google Drive service
          await googleDriveService.setCurrentUser(user.id);
          
          // Load user settings from database
          const userSettings = await db.getUserSettings(user.id);
          setIsDriveAuthenticated(userSettings.googleDriveConnected && googleDriveService.isUserAuthenticated());
        } catch (error) {
          console.error('Failed to load Google Drive settings:', error);
          setIsDriveAuthenticated(false);
        }
      } else {
        // Clear user from Google Drive service
        googleDriveService.clearUser();
        setIsDriveAuthenticated(false);
      }
    };
    checkDriveAuth();
  }, [user]);

  const handleDriveAuthSuccess = async () => {
    setIsDriveAuthenticated(true);
    setDriveAuthError(null);
    
    // Save Google Drive connection status to database
    if (user) {
      try {
        await db.updateUserSettings(user.id, {
          googleDriveConnected: true
        });
      } catch (error) {
        console.error('Failed to save Google Drive connection status:', error);
      }
    }
  };

  const handleDriveAuthError = async (error: string) => {
    setDriveAuthError(error);
    setIsDriveAuthenticated(false);
    
    // Update database to reflect disconnected status
    if (user) {
      try {
        await db.updateUserSettings(user.id, {
          googleDriveConnected: false
        });
      } catch (dbError) {
        console.error('Failed to update Google Drive connection status:', dbError);
      }
    }
  };

  const handleFilesSelect = useCallback((files: FileList) => {
    // Only take the first file since we only allow one image
    const selectedFile = files[0];
    if (selectedFile) {
      setImages([selectedFile]); // Replace any existing image
      setView('editor');
    }
  }, []);

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
        case 'Cinematic Zoom':
            animationPrompt = 'Create a dramatic cinematic video with the camera slowly zooming in while rotating around the object, creating a professional film-like quality.';
            break;
        case 'Spiral Ascent':
            animationPrompt = 'Create a mesmerizing video where the camera spirals upward around the object while rotating, creating a dynamic ascending motion.';
            break;
        case 'Golden Hour':
            animationPrompt = 'Create a beautiful video with warm golden hour lighting that shifts around the object during a smooth 360-degree rotation, creating dramatic shadows and highlights.';
            break;
        case 'Floating Dream':
            animationPrompt = 'Create an ethereal video where the object gently floats and bobs while slowly rotating, as if suspended in a dreamlike state.';
            break;
        case 'Studio Turntable':
            animationPrompt = 'Create a professional product showcase video with clean studio lighting and a precise turntable rotation, perfect for commercial presentation.';
            break;
        case 'Figure-8 Orbit':
            animationPrompt = 'Create a dynamic video where the camera follows a figure-8 pattern around the object, showing unique angles and perspectives.';
            break;
        case 'Pulsing Energy':
            animationPrompt = 'Create an energetic video where the object subtly pulses and scales while rotating, as if radiating energy or power.';
            break;
        case 'Time Lapse Spin':
            animationPrompt = 'Create a fast-paced time lapse video with rapid rotation and motion blur effects, showing the object in an accelerated time flow.';
            break;
        case 'Spotlight Drama':
            animationPrompt = 'Create a dramatic video with a single moving spotlight that follows the rotation, creating strong contrasts and theatrical lighting effects.';
            break;
        case 'Kaleidoscope':
            animationPrompt = 'Create a mesmerizing kaleidoscope-style video with multiple reflections and symmetrical patterns of the object during rotation.';
            break;
        case 'Reverse Momentum':
            animationPrompt = 'Create an intriguing video that starts with fast rotation and dramatically slows down to a gentle stop, creating a sense of momentum loss.';
            break;
        case 'Dolly Zoom':
            animationPrompt = 'Create a cinematic dolly zoom effect (vertigo effect) where the camera zooms while moving, keeping the object the same size but changing the perspective dramatically.';
            break;
        default:
            animationPrompt = 'Create a 360-degree video of the object.';
    }

    const finalPrompt = `${animationPrompt} ${prompt} Duration: ${videoDuration} seconds.`.trim();
    
    try {
      const processedImageFile = await processImageForGeneration(images);
      const generatedBlob = await generate360Video(processedImageFile, finalPrompt, setLoadingMessage, videoDuration);
      
      let driveFileId: string | undefined;
      let driveViewLink: string | undefined;
      let driveDownloadLink: string | undefined;
      let isStoredInDrive = false;

      // Try to upload to Google Drive if authenticated
      if (isDriveAuthenticated && user) {
        try {
          setLoadingMessage('Saving to Google Drive...');
          const fileName = `pixshop_video_${Date.now()}.mp4`;
          const driveFile = await googleDriveService.uploadVideo(generatedBlob, fileName, user.id);
          
          driveFileId = driveFile.id;
          driveViewLink = driveFile.webViewLink;
          driveDownloadLink = driveFile.webContentLink;
          isStoredInDrive = true;
          setLoadingMessage('Video saved to Google Drive successfully!');
        } catch (driveError) {
          console.error('Failed to upload to Google Drive:', driveError);
          setLoadingMessage('Video generated successfully (Drive upload failed)');
          // Continue without Drive storage
        }
      }
      
      const newCreation: Omit<VideoCreation, 'id' | 'url'> = {
        prompt: finalPrompt,
        videoBlob: generatedBlob,
        timestamp: Date.now(),
        userId: user?.id, // Associate with current user
        driveFileId,
        driveViewLink,
        driveDownloadLink,
        isStoredInDrive
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

  const handleShowCreations = () => {
    setView('creations');
  };

  const handleBackToStart = () => {
    setView('start');
    setImages([]);
    setVideoUrl(null);
    setError(null);
  };

  const handleShowEditor = () => {
    setView('editor');
  };

  const handleShowImageEditor = () => {
    setView('image-editor');
  };

  const handleReset = useCallback(() => {
    setImages([]);
    setPrompt('');
    setAnimationStyle('Cinematic Zoom');
    setVideoDuration(5); // Reset to default 5 seconds
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
        return (
          <StartScreen 
            onFilesSelect={handleFilesSelect} 
            onShowGallery={handleShowCreations} 
            onShowVideoEditor={handleShowEditor}
            onShowImageEditor={handleShowImageEditor}
            hasCreations={galleryVideos.length > 0} 
          />
        );
      
      case 'editor':
        return (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 animate-fade-in p-4">
            <Header 
              onShowGallery={handleShowCreations}
              onBackToStart={handleBackToStart}
              onShowEditor={handleShowEditor}
              hasCreations={galleryVideos.length > 0}
              currentView="editor"
            />

            {/* Navigation Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium border border-blue-500"
              >
                📹 Video Generator
              </button>
              <button
                onClick={handleShowImageEditor}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20"
              >
                🎨 Image Editor
              </button>
            </div>
            
            {/* Google Drive Authentication */}
            <GoogleDriveAuth 
              onAuthSuccess={handleDriveAuthSuccess}
              onAuthError={handleDriveAuthError}
            />
            
            {driveAuthError && (
              <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{driveAuthError}</p>
              </div>
            )}
            
            <div className="w-full bg-black/20 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-100 mb-1">Your Image</h2>
                <p className="text-gray-400 mb-4">Upload one image to create your 360° video.</p>
                <div className="flex justify-center">
                    {images.length > 0 ? (
                        <div className="relative group rounded-md overflow-hidden border-2 border-gray-600 bg-gray-800/30 max-w-md w-full">
                            <div className="aspect-video flex items-center justify-center p-4">
                                <img 
                                    src={URL.createObjectURL(images[0])} 
                                    alt="Selected image for 360° video" 
                                    className="max-w-full max-h-full object-contain rounded"
                                />
                            </div>
                            <button 
                              onClick={() => handleRemoveImage(0)}
                              className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                              aria-label="Remove image"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                Ready for 360° generation
                            </div>
                        </div>
                    ) : (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center aspect-video rounded-md border-2 border-dashed border-gray-600 text-gray-400 hover:bg-gray-700/50 hover:border-gray-500 transition-colors max-w-md w-full p-8"
                        >
                           <AddIcon className="w-12 h-12 mb-4" />
                           <span className="text-lg font-semibold mb-2">Upload Image</span>
                           <span className="text-sm text-center">Click to select or drag & drop your image here</span>
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
                    <optgroup label="🎬 Cinematic">
                        <option>Cinematic Zoom</option>
                        <option>Golden Hour</option>
                        <option>Spotlight Drama</option>
                        <option>Dolly Zoom</option>
                    </optgroup>
                    <optgroup label="🌟 Creative">
                        <option>Spiral Ascent</option>
                        <option>Figure-8 Orbit</option>
                        <option>Floating Dream</option>
                        <option>Pulsing Energy</option>
                        <option>Kaleidoscope</option>
                        <option>Reverse Momentum</option>
                    </optgroup>
                    <optgroup label="⚡ Dynamic">
                        <option>Time Lapse Spin</option>
                        <option>Fast Spin</option>
                        <option>Orbit</option>
                    </optgroup>
                    <optgroup label="📐 Professional">
                        <option>Studio Turntable</option>
                        <option>Slow Spin</option>
                    </optgroup>
                </select>
            </div>

            <div className="w-full bg-black/20 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-100 mb-1">Video Duration</h2>
                <p className="text-gray-400 mb-4">Set the length of your 360° video (minimum 5 seconds).</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={videoDuration}
                        onChange={(e) => {
                          const value = Math.max(5, Math.min(30, Number(e.target.value)));
                          setVideoDuration(value);
                        }}
                        className="w-16 bg-gray-800 border border-gray-600 text-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <span className="text-gray-400 text-sm">sec</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5s</span>
                    <span className="text-gray-400">Duration: {videoDuration} seconds</span>
                    <span>30s</span>
                  </div>
                </div>
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
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFilesSelect(e.target.files)} />
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
             <button onClick={handleShowCreations} className="text-gray-400 hover:text-white transition mt-4">
                View All Creations
              </button>
          </div>
        );
      
      case 'creations':
        return <MyCreations onBackToStart={handleBackToStart} />;

      case 'image-editor':
        return (
          <ImageEditor 
            onBackToStart={handleBackToStart}
            onShowCreations={handleShowCreations}
            onShowVideoEditor={handleShowEditor}
            hasCreations={galleryVideos.length > 0}
          />
        );

      case 'gallery':
        return (
           <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 animate-fade-in p-4">
             <Header 
               onShowGallery={handleShowCreations}
               onBackToStart={handleBackToStart}
               onShowEditor={handleShowEditor}
               hasCreations={galleryVideos.length > 0}
               currentView="gallery"
             />
             <h2 className="text-4xl font-bold text-gray-100">My Creations</h2>
             {galleryVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {galleryVideos.map((video) => (
                  <div key={video.id} className="bg-black/20 border border-gray-700/50 rounded-lg overflow-hidden group">
                    <video src={video.url} controls loop className="w-full aspect-video" />
                    <div className="p-4">
                      <p className="text-gray-400 text-sm truncate" title={video.prompt}>{video.prompt}</p>
                      <p className="text-gray-500 text-xs mt-1">{new Date(video.timestamp).toLocaleString()}</p>
                      
                      {/* Drive Status */}
                      {video.isStoredInDrive && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-400">Saved to Google Drive</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4 gap-2">
                        <div className="flex gap-2">
                          {/* Local Download */}
                          <a 
                            href={video.url} 
                            download={`pixshop_video_${video.id}.mp4`} 
                            className="flex items-center gap-1 text-sm font-semibold text-green-400 hover:text-green-300 transition"
                          >
                            <DownloadIcon className="w-4 h-4" />
                            Local
                          </a>
                          
                          {/* Google Drive Download */}
                          {video.isStoredInDrive && video.driveViewLink && (
                            <a 
                              href={video.driveViewLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300 transition"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                              </svg>
                              Drive
                            </a>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => handleDeleteVideo(video.id)} 
                          className="text-sm font-semibold text-red-400 hover:text-red-300 transition"
                        >
                          Delete
                        </button>
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
