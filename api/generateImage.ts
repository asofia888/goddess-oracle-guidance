import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting tracking
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // requests per minute (more restrictive for image generation)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Input validation
const validateRequest = (body: any): { isValid: boolean; error?: string } => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  const { prompt } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { isValid: false, error: 'Prompt is required and must be a non-empty string' };
  }

  if (prompt.length > 1000) {
    return { isValid: false, error: 'Prompt is too long (max 1000 characters)' };
  }

  return { isValid: true };
};

// Rate limiting check
const checkRateLimit = (ip: string): { allowed: boolean; error?: string } => {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (clientData.count >= RATE_LIMIT) {
    return { allowed: false, error: 'Rate limit exceeded. Please try again later.' };
  }

  clientData.count++;
  return { allowed: true };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.toString() || req.headers['x-real-ip']?.toString() || 'unknown';
  const rateLimitCheck = checkRateLimit(clientIp);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({ error: rateLimitCheck.error });
  }

  // Input validation
  const validation = validateRequest(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not configured.' });
  }

  try {
    const { prompt } = req.body;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        includeRaiReason: false,
        aspectRatio: '3:4',
        outputMimeType: 'image/jpeg'
      }
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('Error calling Imagen API:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      details: error.details
    });

    // Return more specific error information
    let errorMessage = 'Failed to generate image from AI';
    if (error.message?.includes('API key')) {
      errorMessage = 'API key is invalid or missing';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded';
    } else if (error.message?.includes('permission')) {
      errorMessage = 'API permission denied';
    }

    return res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}