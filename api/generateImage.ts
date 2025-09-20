import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Enhanced security configuration for image generation
const SECURITY_CONFIG = {
  RATE_LIMIT: 5,
  RATE_LIMIT_WINDOW: 60 * 1000,
  MAX_PROMPT_LENGTH: 800,
  MAX_REQUEST_SIZE: 5000,
  BLOCKED_PATTERNS: [/script/gi, /<[^>]*>/g, /javascript:/gi, /vbscript:/gi, /nude/gi, /nsfw/gi, /explicit/gi]
};

// Rate limiting tracking
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const securityLogMap = new Map<string, { attempts: number; lastAttempt: number }>();

// Enhanced API key validation
const validateApiKey = (apiKey: string | undefined): { isValid: boolean; error?: string } => {
  if (!apiKey) {
    return { isValid: false, error: 'API key is not configured' };
  }

  if (apiKey.includes('PLACEHOLDER') || apiKey.length < 20) {
    return { isValid: false, error: 'Invalid API key configuration' };
  }

  return { isValid: true };
};

// Enhanced security validation for image prompts
const validateSecurity = (content: string): { isValid: boolean; error?: string } => {
  for (const pattern of SECURITY_CONFIG.BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return { isValid: false, error: 'Content contains inappropriate or blocked patterns' };
    }
  }
  return { isValid: true };
};

// Sanitize prompt for safe image generation
const sanitizePrompt = (prompt: string): string => {
  return prompt
    .replace(/[<>"']/g, '') // Remove potential HTML/script characters
    .replace(/\b(nude|nsfw|explicit|sexual)\b/gi, '') // Remove inappropriate terms
    .trim();
};

// Enhanced input validation
const validateRequest = (body: any): { isValid: boolean; error?: string } => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  // Check request size
  const requestSize = JSON.stringify(body).length;
  if (requestSize > SECURITY_CONFIG.MAX_REQUEST_SIZE) {
    return { isValid: false, error: 'Request payload too large' };
  }

  const { prompt } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { isValid: false, error: 'Prompt is required and must be a non-empty string' };
  }

  if (prompt.length > SECURITY_CONFIG.MAX_PROMPT_LENGTH) {
    return { isValid: false, error: `Prompt is too long (max ${SECURITY_CONFIG.MAX_PROMPT_LENGTH} characters)` };
  }

  // Security validation for prompt content
  const securityValidation = validateSecurity(prompt);
  if (!securityValidation.isValid) {
    return securityValidation;
  }

  return { isValid: true };
};

// Enhanced rate limiting with security monitoring
const checkRateLimit = (ip: string): { allowed: boolean; error?: string } => {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);
  const securityData = securityLogMap.get(ip);

  // Security monitoring for image generation
  if (securityData) {
    securityData.attempts++;
    securityData.lastAttempt = now;

    // More restrictive blocking for image generation
    if (securityData.attempts > 50 && (now - securityData.lastAttempt) < 3600000) { // 1 hour
      console.warn(`Suspicious image generation activity from IP: ${ip}`);
      return { allowed: false, error: 'IP temporarily blocked due to suspicious activity' };
    }
  } else {
    securityLogMap.set(ip, { attempts: 1, lastAttempt: now });
  }

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (clientData.count >= SECURITY_CONFIG.RATE_LIMIT) {
    console.warn(`Image generation rate limit exceeded for IP: ${ip}`);
    return { allowed: false, error: 'Rate limit exceeded. Please try again later.' };
  }

  clientData.count++;
  return { allowed: true };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enhanced security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com;");

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

  // Enhanced API key validation
  const apiKey = process.env.GEMINI_API_KEY;
  const apiKeyValidation = validateApiKey(apiKey);
  if (!apiKeyValidation.isValid) {
    console.error('Image API key validation failed:', apiKeyValidation.error);
    return res.status(500).json({ error: 'Service temporarily unavailable' });
  }

  try {
    const { prompt } = req.body;

    // Sanitize prompt for security
    const sanitizedPrompt = sanitizePrompt(prompt);

    // Log sanitized prompt (security conscious)
    console.log('🔍 Processing image generation request from IP:', clientIp);
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Sanitized prompt:', sanitizedPrompt);
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: sanitizedPrompt,
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
    // Enhanced error logging with security awareness
    const errorLog = {
      timestamp: new Date().toISOString(),
      ip: clientIp,
      message: error.message,
      name: error.name,
      code: error.code,
      // Don't log full stack traces in production for security
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    console.error('Imagen API Error:', errorLog);

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