/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useEffect } from 'react';
import { generate360Video } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import { UploadIcon, CloseIcon, VideoIcon } from './components/icons';
import StartScreen from './components/StartScreen';

const MAX_IMAGES = 4;

// Stitches multiple images into a single panoramic image file
const stitchImages = async (files: File[]): Promise<File> => {
    const images = await Promise.all(
      files.map(file => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });
      })
    );

    const totalWidth = images.reduce((sum, img) => sum + img.naturalWidth, 0);
    const maxHeight = Math.max(...images.map(img => img.naturalHeight));

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    let currentX = 0;
    for (const img of images) {
      // Draw image centered vertically if heights differ
      const yOffset = (maxHeight - img.naturalHeight) / 2;
      ctx.drawImage(img, currentX, yOffset);
      currentX += img.naturalWidth;
      URL.revokeObjectURL(img.src); // Clean up object URLs
    }

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
        }
        resolve(new File([blob], 'stitched-panorama.png', { type: 'image/png' }));
      }, 'image/png');
    });
};


const App: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('AI is working its magic...');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Effect to create and revoke object URLs for image thumbnails
  useEffect(() => {
    const urls = uploadedImages.map(file => URL.createObjectURL(file));
    setImageUrls(urls);
    
    return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [uploadedImages]);


  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    setError(null);
    const newFiles = Array.from(files);
    setUploadedImages(prev => {
        const combined = [...prev, ...newFiles];
        if (combined.length > MAX_IMAGES) {
            setError(`You can only upload a maximum of ${MAX_IMAGES} images.`);
            return prev;
        }
        return combined;
    });
  }, []);

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (uploadedImages.length === 0) {
      setError('Please upload at least one image to generate a video.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);
    setLoadingMessage('Stitching images into a panorama...');

    try {
        const panoramicImage = await stitchImages(uploadedImages);
        const videoPrompt = prompt.trim() || 'Create a seamless, silent, 360-degree video that smoothly pans from left to right across the entire width of the provided panoramic image. The video should loop perfectly. Do not add any elements or alter the image content.';
        const generatedVideoUrl = await generate360Video(panoramicImage, videoPrompt, (message) => {
            setLoadingMessage(message);
        });
        setVideoUrl(generatedVideoUrl);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the video. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
        setLoadingMessage('AI is working its magic...');
    }
  }, [uploadedImages, prompt]);

  const handleStartOver = useCallback(() => {
      setUploadedImages([]);
      setVideoUrl(null);
      setError(null);
      setIsLoading(false);
      setPrompt('');
  }, []);
  
  const handleDownloadVideo = useCallback(() => {
      if (videoUrl) {
          const link = document.createElement('a');
          link.href = videoUrl;
          link.download = `pixshop-video-${Date.now()}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }, [videoUrl]);

  const renderContent = () => {
    if (isLoading) {
       return (
           <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in text-center p-4">
               <Spinner />
               <p className="text-gray-300">{loadingMessage}</p>
           </div>
       );
    }

    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    if (videoUrl) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
                <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-auto max-h-[70vh] rounded-xl shadow-2xl"
                />
                <div className="flex items-center justify-center gap-4 mt-4">
                    <button 
                        onClick={handleStartOver}
                        className="text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                    >
                        Start Over
                    </button>
                    <button 
                        onClick={handleDownloadVideo}
                        className="bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
                    >
                        Download Video
                    </button>
                </div>
            </div>
        );
    }

    if (uploadedImages.length === 0) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-4 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-gray-200">Your Images</h2>
            <p className="text-gray-400 -mt-2">Arrange your images if needed. Up to {MAX_IMAGES} allowed.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4">
                {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden group shadow-lg">
                        <img src={url} alt={`upload-preview-${index}`} className="w-full h-full object-cover"/>
                        <button 
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            aria-label="Remove image"
                        >
                            <CloseIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
                 {uploadedImages.length < MAX_IMAGES && (
                    <label htmlFor="add-more-images" className="relative flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-gray-600 text-gray-400 cursor-pointer hover:bg-gray-700/50 hover:border-gray-500 transition-colors">
                        <UploadIcon className="w-8 h-8 mb-2" />
                        <span className="text-sm font-semibold">Add More</span>
                        <input id="add-more-images" type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} />
                    </label>
                 )}
            </div>
        </div>

        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-4 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-gray-200">Describe Your Video</h2>
            <p className="text-gray-400 -mt-2">Optionally, provide a custom prompt to guide the AI.</p>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A slow pan from left to right, cinematic style. If left blank, a default 360° video will be created."
                className="w-full h-24 bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                disabled={isLoading}
            />
        </div>

        <button
            onClick={handleGenerateVideo}
            disabled={isLoading || uploadedImages.length === 0}
            className="mt-4 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-5 px-10 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
        >
            <VideoIcon className="w-6 h-6" />
            Generate 360° Video
      </button>

      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center items-center`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;