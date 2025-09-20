// CSP Testing Script
// This script helps validate the Content Security Policy implementation

const testCSPCompliance = () => {
  console.log('🔍 CSP Compliance Test Starting...');

  const tests = [
    {
      name: 'Inline Script Test',
      test: () => {
        try {
          eval('1+1'); // This should be blocked by CSP
          return { passed: false, message: 'eval() was not blocked - CSP may not be working' };
        } catch (e) {
          return { passed: true, message: 'eval() correctly blocked by CSP' };
        }
      }
    },

    {
      name: 'External Script Loading Test',
      test: () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.tailwindcss.com/3.3.0'; // Allowed by CSP
          script.onload = () => resolve({ passed: true, message: 'Allowed external script loaded successfully' });
          script.onerror = () => resolve({ passed: false, message: 'Allowed external script failed to load' });
          document.head.appendChild(script);
        });
      }
    },

    {
      name: 'Blocked External Script Test',
      test: () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://malicious-site.com/evil.js'; // Should be blocked
          script.onload = () => resolve({ passed: false, message: 'Malicious script was not blocked!' });
          script.onerror = () => resolve({ passed: true, message: 'Malicious script correctly blocked' });
          document.head.appendChild(script);

          // Timeout after 2 seconds
          setTimeout(() => resolve({ passed: true, message: 'Script blocked (timeout)' }), 2000);
        });
      }
    },

    {
      name: 'Image Source Test',
      test: () => {
        return new Promise((resolve) => {
          const img = document.createElement('img');
          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPgo=';
          img.onload = () => resolve({ passed: true, message: 'Data URI images work correctly' });
          img.onerror = () => resolve({ passed: false, message: 'Data URI images blocked unexpectedly' });
        });
      }
    },

    {
      name: 'Font Loading Test',
      test: () => {
        const fontLoaded = document.fonts.check('1em "Noto Serif JP"');
        return {
          passed: fontLoaded,
          message: fontLoaded ? 'Google Fonts loaded successfully' : 'Google Fonts may not be loaded yet'
        };
      }
    },

    {
      name: 'CSP Header Check',
      test: () => {
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return {
          passed: !!cspMeta,
          message: cspMeta
            ? 'CSP meta tag found in HTML'
            : 'CSP meta tag not found - relying on server headers'
        };
      }
    }
  ];

  // Run tests
  const runTests = async () => {
    console.log('\n📋 Running CSP Tests...\n');

    for (const testCase of tests) {
      try {
        console.log(`⏳ Running: ${testCase.name}`);
        const result = await testCase.test();

        if (result.passed) {
          console.log(`✅ ${testCase.name}: ${result.message}`);
        } else {
          console.log(`❌ ${testCase.name}: ${result.message}`);
        }

      } catch (error) {
        console.log(`❌ ${testCase.name}: Error - ${error.message}`);
      }
    }

    console.log('\n🔍 CSP Test Summary Complete');
    console.log('📊 Check browser console for any CSP violation reports');
  };

  runTests();
};

// Check for CSP violation reports
const monitorCSPViolations = () => {
  console.log('👀 Monitoring for CSP violations...');

  // Override console.error to catch CSP violations
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('Content Security Policy') || message.includes('CSP')) {
      console.log('🚨 CSP Violation Detected:', message);
    }
    originalError.apply(console, args);
  };

  // Listen for security policy violations
  document.addEventListener('securitypolicyviolation', (e) => {
    console.log('🚨 CSP Violation Event:', {
      violatedDirective: e.violatedDirective,
      blockedURI: e.blockedURI,
      documentURI: e.documentURI,
      effectiveDirective: e.effectiveDirective,
      lineNumber: e.lineNumber,
      columnNumber: e.columnNumber,
      sourceFile: e.sourceFile
    });
  });
};

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    monitorCSPViolations();
    setTimeout(testCSPCompliance, 1000); // Wait for resources to load
  });
} else {
  monitorCSPViolations();
  setTimeout(testCSPCompliance, 1000);
}

// Export for manual testing
window.testCSP = testCSPCompliance;
window.monitorCSP = monitorCSPViolations;

console.log('🛡️ CSP Testing Script Loaded');
console.log('💡 Run testCSP() in console to manually test CSP compliance');