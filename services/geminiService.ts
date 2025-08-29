/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";

// Helper to convert a File to a base64 string
const fileToBase64 = async (file: File): Promise<string> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    // Return only the base64 part
    return dataUrl.split(',')[1];
};

/**
 * Generates a 360-degree panoramic video from a combined image strip.
 * @param combinedImage The single image file created by stitching user uploads.
 * @param prompt The text prompt describing the desired video style.
 * @param onProgress Callback to update the UI with loading messages.
 * @returns A promise that resolves to the generated video Blob.
 */
export const generate360Video = async (
    combinedImage: File,
    prompt: string,
    onProgress: (message: string) => void,
): Promise<Blob> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    onProgress('Preparing images for the AI...');
    const imageBytes = await fileToBase64(combinedImage);

    onProgress('Sending request to the video model...');
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: imageBytes,
            mimeType: combinedImage.type,
        },
        config: {
            numberOfVideos: 1,
        }
    });

    onProgress('Video generation started. This may take a few minutes...');
    let pollCount = 0;
    while (!operation.done) {
        pollCount++;
        // Poll every 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000)); 
        
        if (pollCount === 3) { // After 30s
            onProgress('The AI is composing the scene and setting up the camera path...');
        } else if (pollCount === 6) { // After 60s
            onProgress('Rendering frames. This is the longest step, thank you for your patience.');
        }

        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation finished but no download link was provided.');
    }

    onProgress('Generation complete! Downloading video...');
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download the generated video. Status: ${response.status}`);
    }

    return await response.blob();
};