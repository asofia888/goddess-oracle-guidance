import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProductionCSP } from '../utils/csp';

// Enhanced security configuration
const SECURITY_CONFIG = {
  RATE_LIMIT: 10,
  RATE_LIMIT_WINDOW: 60 * 1000,
  MAX_CARD_NAME_LENGTH: 100,
  MAX_CARD_DESC_LENGTH: 200,
  MAX_REQUEST_SIZE: 10000,
  BLOCKED_PATTERNS: [/script/gi, /<[^>]*>/g, /javascript:/gi, /vbscript:/gi]
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

// Enhanced security validation
const validateSecurity = (content: string): { isValid: boolean; error?: string } => {
  for (const pattern of SECURITY_CONFIG.BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return { isValid: false, error: 'Content contains blocked patterns' };
    }
  }
  return { isValid: true };
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

  const { cards, mode } = body;

  if (!Array.isArray(cards) || cards.length === 0) {
    return { isValid: false, error: 'Cards array is required and must not be empty' };
  }

  if (mode !== 'single' && mode !== 'three') {
    return { isValid: false, error: 'Mode must be either "single" or "three"' };
  }

  if (mode === 'single' && cards.length !== 1) {
    return { isValid: false, error: 'Single mode requires exactly 1 card' };
  }

  if (mode === 'three' && cards.length !== 3) {
    return { isValid: false, error: 'Three mode requires exactly 3 cards' };
  }

  // Enhanced card structure validation
  for (const card of cards) {
    if (!card || typeof card !== 'object') {
      return { isValid: false, error: 'Invalid card structure' };
    }

    if (!card.name || typeof card.name !== 'string' || card.name.length > SECURITY_CONFIG.MAX_CARD_NAME_LENGTH) {
      return { isValid: false, error: 'Invalid card name' };
    }

    if (!card.description || typeof card.description !== 'string' || card.description.length > SECURITY_CONFIG.MAX_CARD_DESC_LENGTH) {
      return { isValid: false, error: 'Invalid card description' };
    }

    // Security validation for card content
    const nameValidation = validateSecurity(card.name);
    if (!nameValidation.isValid) {
      return nameValidation;
    }

    const descValidation = validateSecurity(card.description);
    if (!descValidation.isValid) {
      return descValidation;
    }
  }

  return { isValid: true };
};

// Enhanced rate limiting with security monitoring
const checkRateLimit = (ip: string): { allowed: boolean; error?: string } => {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);
  const securityData = securityLogMap.get(ip);

  // Security monitoring
  if (securityData) {
    securityData.attempts++;
    securityData.lastAttempt = now;

    // Block suspicious IPs with too many attempts
    if (securityData.attempts > 100 && (now - securityData.lastAttempt) < 3600000) { // 1 hour
      console.warn(`Suspicious activity detected from IP: ${ip}`);
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
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return { allowed: false, error: 'Rate limit exceeded. Please try again later.' };
  }

  clientData.count++;
  return { allowed: true };
};

const generateSingleCardMessagePrompt = (card: any) =>
  `あなたは神聖な神託です。女神「${card.name}」（${card.description}）からのメッセージを伝えてください。元のメッセージは「${card.message}」です。この情報に基づき、より深く、洞察に満ちた、パーソナライズされた神託のメッセージを、女神自身が語りかけるような、優しく力強い口調で生成してください。メッセージは550文字以内とし、適度に改行を入れて読みやすくしてください。`;

const generateThreeCardSpreadMessagePrompt = (cards: any[]) =>
  `あなたは神聖な神託です。過去、現在、未来を占う3枚引きのリーディングを行います。
過去のカードは「${cards[0].name}」（${cards[0].description}）。
現在のカードは「${cards[1].name}」（${cards[1].description}）。
未来のカードは「${cards[2].name}」（${cards[2].description}）。
これら3枚のカードの組み合わせを解釈し、それぞれのカードについて、その位置（過去、現在、未来）に応じた、深く洞察に満ちたメッセージを生成してください。3つのメッセージは互いに関連し合い、一つの物語のように繋がるようにしてください。女神が直接語りかけるような、優しく力強い口調でお願いします。`;

const threeCardResponseSchema = {
    type: Type.OBJECT,
    properties: {
        past: { type: Type.STRING, description: "過去のカードに関するメッセージです。" },
        present: { type: Type.STRING, description: "現在のカードに関するメッセージです。" },
        future: { type: Type.STRING, description: "未来のカードに関するメッセージです。" },
    },
    required: ["past", "present", "future"],
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
  res.setHeader('Content-Security-Policy', getProductionCSP());

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
    console.error('API key validation failed:', apiKeyValidation.error);
    return res.status(500).json({ error: 'Service temporarily unavailable' });
  }

  try {
    const { cards, mode } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    if (mode === 'single' && cards.length === 1) {
      const prompt = generateSingleCardMessagePrompt(cards[0]);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.8,
          candidateCount: 1,
        },
      });
      return res.status(200).json({ messages: [response.text] });

    } else if (mode === 'three' && cards.length === 3) {
      const prompt = generateThreeCardSpreadMessagePrompt(cards);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.8,
          candidateCount: 1,
          responseMimeType: "application/json",
          responseSchema: threeCardResponseSchema,
        },
      });
      const jsonResponse = JSON.parse(response.text);
      return res.status(200).json({ messages: [jsonResponse.past, jsonResponse.present, jsonResponse.future] });

    } else {
      return res.status(400).json({ error: 'Invalid request body' });
    }
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

    console.error('GenAI API Error:', errorLog);

    // Return more specific error information
    let errorMessage = 'Failed to generate content from AI';
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