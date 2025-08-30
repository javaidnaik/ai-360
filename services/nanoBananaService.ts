/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Google Nano Banana (Gemini 2.5 Flash) Image Generation Service
 * 
 * This service integrates with Google's Nano Banana model for:
 * - Text-to-Image Generation
 * - Image-to-Image Editing
 * - Inpainting and Outpainting
 * - Style Transfer
 * - Character Consistency
 */

interface ImageGenerationOptions {
  prompt: string;
  type: 'generate' | 'edit' | 'inpaint' | 'style';
  inputImage?: File;
  width?: number;
  height?: number;
  style?: string;
}

interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  type: string;
  metadata: {
    model: string;
    timestamp: number;
    dimensions: { width: number; height: number };
  };
}

class NanoBananaService {
  private static instance: NanoBananaService;
  private apiKey: string;
  private baseUrl: string;

  private constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    if (!this.apiKey) {
      console.warn('⚠️ Google API Key not found. Gemini Image Preview service will use mock responses.');
    }
  }

  static getInstance(): NanoBananaService {
    if (!NanoBananaService.instance) {
      NanoBananaService.instance = new NanoBananaService();
    }
    return NanoBananaService.instance;
  }

  /**
   * Generate image using Google Gemini 2.5 Flash Image Preview
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      console.log('🎨 Generating image with Gemini Image Preview...', options);

      // If no API key, return mock response
      if (!this.apiKey) {
        return this.getMockResponse(options);
      }

      // Prepare the request based on the type
      const requestData = await this.prepareRequest(options);
      
      // Make the API call to Gemini 2.5 Flash Image Preview
      const response = await fetch(`${this.baseUrl}/models/gemini-2.5-flash-image-preview:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Gemini Image Preview API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Process the response and extract image data
      const imageData = this.processResponse(result, options);
      
      return {
        imageUrl: imageData.url,
        prompt: options.prompt,
        type: options.type,
        metadata: {
          model: 'Google Gemini 2.5 Flash Image Preview',
          timestamp: Date.now(),
          dimensions: {
            width: options.width || 512,
            height: options.height || 512
          }
        }
      };

    } catch (error) {
      console.error('❌ Gemini Image Preview generation failed:', error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare request data based on generation type (following official API format)
   */
  private async prepareRequest(options: ImageGenerationOptions): Promise<any> {
    // For text-to-image generation (simple string as per docs)
    if (!options.inputImage || options.type === 'generate') {
      return {
        contents: this.buildPrompt(options)
      };
    }

    // For image editing (array format as per docs)
    const contents: any[] = [
      { text: this.buildPrompt(options) }
    ];

    // Add image data for editing operations
    const imageData = await this.fileToBase64(options.inputImage);
    contents.push({
      inlineData: {
        mimeType: options.inputImage.type,
        data: imageData
      }
    });

    return {
      contents
    };
  }

  /**
   * Build appropriate prompt based on operation type
   */
  private buildPrompt(options: ImageGenerationOptions): string {
    const basePrompt = options.prompt;
    
    switch (options.type) {
      case 'generate':
        return `Generate a high-quality image: ${basePrompt}. Style: photorealistic, detailed, professional quality.`;
      
      case 'edit':
        return `Edit the provided image according to this instruction: ${basePrompt}. Maintain the original style and quality while making the requested changes.`;
      
      case 'inpaint':
        return `Fill in or replace parts of the provided image: ${basePrompt}. Ensure seamless integration with the existing image content.`;
      
      case 'style':
        return `Apply the following style to the provided image: ${basePrompt}. Maintain the subject and composition while transforming the artistic style.`;
      
      default:
        return basePrompt;
    }
  }

  /**
   * Convert file to base64 for API upload
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Process API response and extract image URL (following official API response format)
   */
  private processResponse(result: any, options: ImageGenerationOptions): { url: string } {
    try {
      // According to the official documentation, the response format is:
      // response.candidates[0].content.parts[0].inlineData.data (base64)
      
      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const parts = result.candidates[0].content.parts;
      
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          // Convert base64 data to blob URL
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          
          // Create blob URL from base64 data
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const imageUrl = URL.createObjectURL(blob);
          
          return { url: imageUrl };
        }
      }
      
      throw new Error('No image data found in API response');
      
    } catch (error) {
      console.error('Error processing Gemini API response:', error);
      throw new Error(`Failed to process image data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mock response for development/testing
   */
  private async getMockResponse(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    const mockImages = [
      'https://picsum.photos/512/512?random=1',
      'https://picsum.photos/512/512?random=2',
      'https://picsum.photos/512/512?random=3',
      'https://picsum.photos/512/512?random=4',
      'https://picsum.photos/512/512?random=5'
    ];
    
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    
    return {
      imageUrl: randomImage,
      prompt: options.prompt,
      type: options.type,
      metadata: {
        model: 'Google Nano Banana (Gemini 2.5 Flash) - Mock',
        timestamp: Date.now(),
        dimensions: {
          width: options.width || 512,
          height: options.height || 512
        }
      }
    };
  }

  /**
   * Get available style presets
   */
  getStylePresets(): Array<{ name: string; description: string }> {
    return [
      { name: 'Photorealistic', description: 'High-quality realistic photography style' },
      { name: 'Digital Art', description: 'Modern digital artwork style' },
      { name: 'Oil Painting', description: 'Classic oil painting technique' },
      { name: 'Watercolor', description: 'Soft watercolor painting style' },
      { name: 'Anime', description: 'Japanese anime/manga art style' },
      { name: 'Sketch', description: 'Hand-drawn pencil sketch style' },
      { name: 'Pop Art', description: 'Bold pop art style' },
      { name: 'Impressionist', description: 'Impressionist painting style' }
    ];
  }
}

export const nanoBananaService = NanoBananaService.getInstance();
export type { ImageGenerationOptions, ImageGenerationResult };
