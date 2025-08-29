/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Spinner from './Spinner';
import { UploadIcon, DownloadIcon, SparklesIcon } from './icons';
import { nanoBananaService, ImageGenerationOptions } from '../services/nanoBananaService';

interface ImageEditorProps {
  onBackToStart: () => void;
  onShowCreations: () => void;
  onShowVideoEditor: () => void;
  hasCreations: boolean;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ 
  onBackToStart, 
  onShowCreations, 
  onShowVideoEditor, 
  hasCreations 
}) => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editType, setEditType] = useState<'generate' | 'edit' | 'inpaint' | 'style'>('generate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a description for your image');
      return;
    }

    if (editType !== 'generate' && !selectedImage) {
      setError('Please upload an image for editing');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Use Google Nano Banana (Gemini 2.5 Flash) for image generation
      const options: ImageGenerationOptions = {
        prompt,
        type: editType,
        inputImage: selectedImage || undefined,
        width: 512,
        height: 512
      };

      const result = await nanoBananaService.generateImage(options);
      setResult(result.imageUrl);
      
      // TODO: Save to database and Google Drive
      console.log('✅ Image generated successfully:', result.metadata);
      
    } catch (err) {
      console.error('Image generation error:', err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const editTypes = [
    { value: 'generate', label: 'Text-to-Image', description: 'Create images from text descriptions' },
    { value: 'edit', label: 'Image-to-Image', description: 'Edit existing images with text prompts' },
    { value: 'inpaint', label: 'Inpainting', description: 'Fill in or replace parts of an image' },
    { value: 'style', label: 'Style Transfer', description: 'Apply artistic styles to images' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 animate-fade-in p-4">
        <Header 
          onShowGallery={onShowCreations}
          onBackToStart={onBackToStart}
          onShowEditor={onShowVideoEditor}
          hasCreations={hasCreations}
          currentView="editor"
        />

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={onShowVideoEditor}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20"
          >
            📹 Video Generator
          </button>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium border border-blue-500"
          >
            🎨 Image Editor
          </button>
        </div>

        <div className="w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">AI Image Editor</h2>
          <p className="text-gray-300 text-center mb-8">Powered by Google Nano Banana (Gemini 2.5 Flash)</p>

          {/* Edit Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Choose Edit Type</label>
            <div className="grid grid-cols-2 gap-3">
              {editTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setEditType(type.value as any)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    editType === type.value
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-white/5 border-gray-600 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium mb-1">{type.label}</div>
                  <div className="text-xs text-gray-400">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload (for editing modes) */}
          {editType !== 'generate' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Upload Image</label>
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                ) : (
                  <div>
                    <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">Click or drag to upload an image</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {editType === 'generate' ? 'Describe your image' : 'Describe your edit'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                editType === 'generate' 
                  ? "e.g., A majestic mountain landscape at sunset with purple clouds..."
                  : "e.g., Change the background to a beach scene, make the person smile..."
              }
              className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
              rows={4}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !prompt || (editType !== 'generate' && !selectedImage)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition-all duration-300 shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <Spinner />
                Processing...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                {editType === 'generate' ? 'Generate Image' : 'Edit Image'}
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-8 p-6 bg-white/5 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Generated Image</h3>
              <img src={result} alt="Generated" className="w-full rounded-lg mb-4" />
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = 'ai-generated-image.png';
                    link.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setPrompt('');
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
