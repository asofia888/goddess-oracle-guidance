import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logCSPViolation, type CSPViolationReport } from '../utils/csp';

// Rate limiting for CSP reports to prevent spam
const reportRateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_REPORTS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

const checkReportRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const clientData = reportRateLimit.get(ip);

  if (!clientData || now > clientData.resetTime) {
    reportRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= MAX_REPORTS_PER_MINUTE) {
    return false;
  }

  clientData.count++;
  return true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers for CSP report endpoint
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CSP reports from anywhere
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.toString() || req.headers['x-real-ip']?.toString() || 'unknown';
  if (!checkReportRateLimit(clientIp)) {
    console.warn(`CSP report rate limit exceeded for IP: ${clientIp}`);
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    const report = req.body as CSPViolationReport;

    // Validate CSP report structure
    if (!report || !report['csp-report']) {
      console.warn('Invalid CSP report structure:', req.body);
      return res.status(400).json({ error: 'Invalid report format' });
    }

    const violation = report['csp-report'];

    // Basic validation of required fields
    if (!violation['violated-directive'] || !violation['document-uri']) {
      console.warn('CSP report missing required fields:', violation);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Enhanced logging with additional context
    const enhancedReport = {
      ...violation,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown',
      clientIp,
      referer: req.headers.referer || 'unknown'
    };

    // Log the violation
    logCSPViolation(report);

    // Additional security analysis
    const isHighSeverity = checkHighSeverityViolation(violation);
    if (isHighSeverity) {
      console.error('HIGH SEVERITY CSP VIOLATION:', enhancedReport);

      // In production, this could trigger alerts
      if (process.env.NODE_ENV === 'production') {
        // Example: sendSecurityAlert(enhancedReport);
      }
    }

    // Store violation data for analysis (in production, use proper database)
    if (process.env.NODE_ENV === 'development') {
      console.log('CSP Violation Report:', JSON.stringify(enhancedReport, null, 2));
    }

    return res.status(204).end(); // 204 No Content for successful CSP reports

  } catch (error: any) {
    console.error('Error processing CSP report:', {
      error: error.message,
      ip: clientIp,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Check if CSP violation indicates high-severity security threat
function checkHighSeverityViolation(violation: any): boolean {
  const highSeverityPatterns = [
    /eval/i,
    /javascript:/i,
    /data:text\/html/i,
    /inline/i,
    /unsafe-eval/i
  ];

  const blockedUri = violation['blocked-uri'] || '';
  const violatedDirective = violation['violated-directive'] || '';
  const scriptSample = violation['script-sample'] || '';

  return highSeverityPatterns.some(pattern =>
    pattern.test(blockedUri) ||
    pattern.test(violatedDirective) ||
    pattern.test(scriptSample)
  );
}