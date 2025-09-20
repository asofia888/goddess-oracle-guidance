// Security middleware for enhanced protection
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://aistudiocdn.com https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com;"
};

// IP blocking list for known malicious IPs
const BLOCKED_IPS = new Set<string>();
const SUSPICIOUS_IPS = new Map<string, { attempts: number; lastAttempt: number; blocked: boolean }>();

// Security monitoring configuration
export const SECURITY_CONFIG = {
  MAX_ATTEMPTS_PER_HOUR: 100,
  MAX_FAILED_ATTEMPTS: 10,
  BLOCK_DURATION: 3600000, // 1 hour
  SUSPICIOUS_PATTERNS: [
    /script/gi,
    /<[^>]*>/g,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /eval\(/gi,
    /document\./gi,
    /window\./gi
  ]
};

// Enhanced IP monitoring and blocking
export const monitorIP = (ip: string, action: 'success' | 'failure' | 'suspicious') => {
  if (BLOCKED_IPS.has(ip)) {
    return { blocked: true, reason: 'IP permanently blocked' };
  }

  const now = Date.now();
  const ipData = SUSPICIOUS_IPS.get(ip) || { attempts: 0, lastAttempt: 0, blocked: false };

  // Reset counter if more than 1 hour has passed
  if (now - ipData.lastAttempt > SECURITY_CONFIG.BLOCK_DURATION) {
    ipData.attempts = 0;
    ipData.blocked = false;
  }

  ipData.lastAttempt = now;

  switch (action) {
    case 'failure':
    case 'suspicious':
      ipData.attempts++;

      // Temporary block for excessive attempts
      if (ipData.attempts > SECURITY_CONFIG.MAX_ATTEMPTS_PER_HOUR) {
        ipData.blocked = true;
        console.warn(`IP ${ip} temporarily blocked due to excessive attempts`);
      }

      // Permanent block for highly suspicious activity
      if (ipData.attempts > SECURITY_CONFIG.MAX_FAILED_ATTEMPTS * 5) {
        BLOCKED_IPS.add(ip);
        console.error(`IP ${ip} permanently blocked due to malicious activity`);
      }
      break;

    case 'success':
      // Reduce attempt count on successful requests
      if (ipData.attempts > 0) {
        ipData.attempts = Math.max(0, ipData.attempts - 1);
      }
      break;
  }

  SUSPICIOUS_IPS.set(ip, ipData);

  return {
    blocked: ipData.blocked || BLOCKED_IPS.has(ip),
    attempts: ipData.attempts,
    reason: ipData.blocked ? 'Too many failed attempts' : undefined
  };
};

// Validate and sanitize input content
export const validateContent = (content: string, maxLength: number = 1000): { isValid: boolean; sanitized: string; error?: string } => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, sanitized: '', error: 'Content must be a non-empty string' };
  }

  // Check length
  if (content.length > maxLength) {
    return { isValid: false, sanitized: '', error: `Content exceeds maximum length of ${maxLength} characters` };
  }

  // Check for suspicious patterns
  for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      return { isValid: false, sanitized: '', error: 'Content contains potentially malicious patterns' };
    }
  }

  // Sanitize content
  const sanitized = content
    .replace(/[<>\"']/g, '') // Remove HTML/script characters
    .replace(/\x00-\x1f\x7f-\x9f/g, '') // Remove control characters
    .trim();

  return { isValid: true, sanitized };
};

// Generate security report
export const generateSecurityReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    blockedIPs: BLOCKED_IPS.size,
    suspiciousIPs: SUSPICIOUS_IPS.size,
    activeBlocks: Array.from(SUSPICIOUS_IPS.entries())
      .filter(([_, data]) => data.blocked)
      .length,
    topSuspiciousIPs: Array.from(SUSPICIOUS_IPS.entries())
      .sort((a, b) => b[1].attempts - a[1].attempts)
      .slice(0, 10)
      .map(([ip, data]) => ({ ip, attempts: data.attempts, blocked: data.blocked }))
  };

  return report;
};

// Emergency security shutdown
export const emergencyShutdown = (reason: string) => {
  console.error(`EMERGENCY SHUTDOWN: ${reason}`);
  // In a real application, this would trigger alerts and potentially shut down the service
  return { shutdown: true, reason, timestamp: new Date().toISOString() };
};