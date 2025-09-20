// Enhanced Content Security Policy configuration
export interface CSPConfig {
  nonce?: string;
  reportUri?: string;
  reportOnly?: boolean;
}

// Generate nonce for inline scripts
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Build CSP header with nonce support
export const buildCSPHeader = (config: CSPConfig = {}): string => {
  const { nonce, reportUri, reportOnly = false } = config;

  const directives = [
    "default-src 'self'",

    // Script sources with optional nonce
    nonce
      ? `script-src 'self' 'nonce-${nonce}' https://aistudiocdn.com https://cdn.tailwindcss.com`
      : "script-src 'self' 'unsafe-inline' https://aistudiocdn.com https://cdn.tailwindcss.com",

    // Style sources with optional nonce
    nonce
      ? `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`
      : "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Font sources
    "font-src 'self' https://fonts.gstatic.com",

    // Image sources (restricted for security)
    "img-src 'self' data: https://aistudiocdn.com https://generativelanguage.googleapis.com",

    // Connect sources for API calls
    "connect-src 'self' https://generativelanguage.googleapis.com",

    // Media sources
    "media-src 'none'",

    // Object sources (Flash, etc.)
    "object-src 'none'",

    // Base URI restriction
    "base-uri 'self'",

    // Form action restriction
    "form-action 'self'",

    // Frame ancestors (prevent clickjacking)
    "frame-ancestors 'none'",

    // Upgrade insecure requests
    "upgrade-insecure-requests"
  ];

  // Add report URI if specified
  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  const policyString = directives.join('; ');

  return reportOnly ? `${policyString}; report-only` : policyString;
};

// Strict CSP for high-security environments
export const getStrictCSP = (): string => {
  return buildCSPHeader({
    nonce: generateCSPNonce(),
    reportUri: '/api/csp-report'
  });
};

// Development CSP (more permissive)
export const getDevelopmentCSP = (): string => {
  return buildCSPHeader({
    reportOnly: true,
    reportUri: '/api/csp-report'
  });
};

// Production CSP (balanced security)
export const getProductionCSP = (): string => {
  return buildCSPHeader({
    reportUri: '/api/csp-report'
  });
};

// CSP violation reporting
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  };
}

// Log CSP violations for monitoring
export const logCSPViolation = (report: CSPViolationReport): void => {
  const violation = report['csp-report'];

  console.warn('CSP Violation Detected:', {
    directive: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    documentUri: violation['document-uri'],
    lineNumber: violation['line-number'],
    timestamp: new Date().toISOString()
  });

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToSecurityService(violation);
  }
};

// CSP meta tag generator for client-side
export const generateCSPMetaTag = (policy?: string): string => {
  const cspPolicy = policy || getProductionCSP();
  return `<meta http-equiv="Content-Security-Policy" content="${cspPolicy}">`;
};