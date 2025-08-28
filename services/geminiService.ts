/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";

// Helper function to convert a File object to base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            if (base64) {
                resolve(base64);
            } else {
                reject(new Error("Could not extract base64 from data URL"));
            }
        };
        reader.onerror = error => reject(error);
    });
};

/**
 * Generates a 360 video from an image.
 * @param originalImage The original image file.
 * @param prompt The user-provided or default prompt for the video.
 * @param onProgress Callback to report progress messages.
 * @returns A promise that resolves to the object URL of the generated video.
 */
export const generate360Video = async (
    originalImage: File,
    prompt: string,
    onProgress: (message: string) => void
): Promise<string> => {
    onProgress('Preparing your image for video generation...');
    console.log(`Starting 360 video generation with prompt: "${prompt}"`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const imageBytes = await fileToBase64(originalImage);

    onProgress('Sending request to the video model...');
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: imageBytes,
        mimeType: originalImage.type,
      },
      config: {
        numberOfVideos: 1
      }
    });

    onProgress('AI is creating your video. This may take a few minutes...');
    console.log('Video generation operation started:', operation);

    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      // Poll every 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000)); 
      onProgress(`Checking video status (attempt ${pollCount})...`);
      operation = await ai.operations.getVideosOperation({operation: operation});
      console.log('Polling video operation status:', operation);
    }

    if (operation.error) {
        console.error('Video generation failed:', operation.error);
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        console.error('No download link found in the video operation response.', operation);
        throw new Error('Could not retrieve the generated video. Please try again.');
    }

    onProgress('Downloading finalized video...');
    console.log(`Fetching video from: ${downloadLink}`);

    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!response.ok) {
        throw new Error(`Failed to download the video file. Status: ${response.status}`);
    }
    
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    onProgress('Video generation complete!');
    return videoUrl;
};