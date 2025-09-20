// Client-side security utilities
export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/[<>\"'&]/g, (match) => {
      const htmlEntities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return htmlEntities[match] || match;
    })
    .trim();
};

// Validate URLs for security
export const isValidURL = (url: string): boolean => {
  try {
    const parsedURL = new URL(url);
    // Only allow HTTPS and data URLs for images
    return parsedURL.protocol === 'https:' ||
           (parsedURL.protocol === 'data:' && url.startsWith('data:image/'));
  } catch {
    return false;
  }
};

// Content Security Policy nonce generator
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Local storage security wrapper
export const secureStorage = {
  setItem: (key: string, value: any): boolean => {
    try {
      // Encrypt sensitive data before storing (in a real app, use proper encryption)
      const sanitizedValue = typeof value === 'string' ? sanitizeUserInput(value) : value;
      localStorage.setItem(key, JSON.stringify(sanitizedValue));
      return true;
    } catch (error) {
      console.error('Failed to store data securely:', error);
      return false;
    }
  },

  getItem: (key: string): any => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove data securely:', error);
      return false;
    }
  }
};

// Rate limiting for client-side actions
class ClientRateLimiter {
  private actions: Map<string, number[]> = new Map();

  public checkLimit(action: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const actionTimes = this.actions.get(action) || [];

    // Remove old entries outside the window
    const validTimes = actionTimes.filter(time => now - time < windowMs);

    if (validTimes.length >= limit) {
      return false; // Rate limit exceeded
    }

    // Add current action
    validTimes.push(now);
    this.actions.set(action, validTimes);

    return true;
  }

  public reset(action?: string): void {
    if (action) {
      this.actions.delete(action);
    } else {
      this.actions.clear();
    }
  }
}

export const rateLimiter = new ClientRateLimiter();

// Security event logger
export const logSecurityEvent = (event: string, details: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Security Event: ${event}`, details);
  }

  // In production, this would send to a security monitoring service
  // Example: sendToSecurityService({ event, details, timestamp: Date.now() });
};

// Detect potential XSS in dynamic content
export const detectXSS = (content: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<form[^>]*>/gi
  ];

  return xssPatterns.some(pattern => pattern.test(content));
};

// Secure random ID generator
export const generateSecureId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2);
  return `${timestamp}_${randomPart}`;
};