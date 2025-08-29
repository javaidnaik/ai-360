/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import * as db from './db';

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
    // Get active AI model configuration from database
    let apiKey = process.env.API_KEY;
    let modelId = 'veo-2.0-generate-001';
    
    try {
        const models = await db.getAllAIModels();
        const activeModel = models.find(model => model.isActive);
        
        if (activeModel) {
            apiKey = activeModel.apiKey;
            modelId = activeModel.modelId;
            onProgress(`Using AI model: ${activeModel.name}`);
        } else {
            onProgress('Using default AI model configuration');
        }
    } catch (error) {
        console.warn('Could not load AI models from database, using defaults:', error);
        onProgress('Using default AI model configuration');
    }

    if (!apiKey) {
        throw new Error("No API key available. Please configure an AI model in Super Admin or set API_KEY environment variable.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    onProgress('Preparing images for the AI...');
    const imageBytes = await fileToBase64(combinedImage);

    onProgress('Sending request to the video model...');
    let operation = await ai.models.generateVideos({
        model: modelId,
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
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
        throw new Error(`Failed to download the generated video. Status: ${response.status}`);
    }

    return await response.blob();
};