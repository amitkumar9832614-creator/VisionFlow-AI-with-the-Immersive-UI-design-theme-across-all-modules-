import { ParsedAICommand, CanvasImageObject, VisionAnalysisResult } from '../types';

export async function parseNaturalLanguageCommand(
  input: string,
  context?: { activeImageTitle?: string; activePrompt?: string; sourceType?: string; isAirCanvasActive?: boolean }
): Promise<ParsedAICommand> {
  const res = await fetch('/api/ai/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input,
      currentImageTitle: context?.activeImageTitle,
      hasImage: !!context?.activeImageTitle,
      isAirCanvasActive: context?.isAirCanvasActive,
    }),
  });

  if (!res.ok) {
    throw new Error(`Command parse failed: ${res.statusText}`);
  }
  return res.json();
}

export async function searchAuthenticImage(query: string): Promise<{ success: boolean; image: CanvasImageObject; images: CanvasImageObject[]; message: string }> {
  const res = await fetch('/api/ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`Image search failed: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    ...data,
    images: data.image ? [data.image] : [],
  };
}

export async function generateAIImage(
  prompt: string,
  options?: { style?: string; stylePreset?: string; aspectRatio?: string }
): Promise<{ success: boolean; image: CanvasImageObject; imageUrl?: string; title?: string; message: string }> {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      style: options?.stylePreset || options?.style || 'photorealistic',
      aspectRatio: options?.aspectRatio || '16:9',
    }),
  });

  if (!res.ok) {
    throw new Error(`Image generation failed: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    ...data,
    imageUrl: data.image?.url,
    title: data.image?.title,
  };
}

export async function editAIImage(
  imageUrl: string,
  instruction: string,
  style?: string
): Promise<{ success: boolean; image: CanvasImageObject; imageUrl?: string; title?: string; message: string }> {
  const res = await fetch('/api/ai/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instruction, imageUrl, style }),
  });

  if (!res.ok) {
    throw new Error(`Image edit failed: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    ...data,
    imageUrl: data.image?.url,
    title: data.image?.title,
  };
}

export async function analyzeVisionFrame(
  imageBase64: string,
  question?: string
): Promise<{ success: boolean; analysis: VisionAnalysisResult; description: string; creativeSuggestions: string[]; spokenResponse: string }> {
  const res = await fetch('/api/ai/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, question }),
  });

  if (!res.ok) {
    throw new Error(`Vision analysis failed: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    ...data,
    description: data.analysis?.description || data.spokenResponse || '',
    creativeSuggestions: data.analysis?.creativeSuggestions || [],
  };
}

export async function convertAirCanvasToImage(
  sketchBase64: string,
  prompt?: string
): Promise<{ success: boolean; image: CanvasImageObject; spokenResponse: string }> {
  const res = await fetch('/api/ai/air-canvas-to-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sketchBase64, prompt }),
  });

  if (!res.ok) {
    throw new Error(`Air canvas conversion failed: ${res.statusText}`);
  }
  return res.json();
}

export async function checkServerHealth(): Promise<{ status: string; hasGeminiKey: boolean; features: string[] }> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    return { status: 'error', hasGeminiKey: false, features: [] };
  }
  return res.json();
}

export const geminiApiClient = {
  parseCommand: parseNaturalLanguageCommand,
  searchImages: searchAuthenticImage,
  generateImage: generateAIImage,
  editImage: editAIImage,
  analyzeVisionSnapshot: analyzeVisionFrame,
  convertAirCanvas: convertAirCanvasToImage,
  checkHealth: checkServerHealth,
};
