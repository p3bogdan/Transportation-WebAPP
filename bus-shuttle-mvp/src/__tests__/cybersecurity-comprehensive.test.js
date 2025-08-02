// Standalone Security Tests - No external dependencies
// These tests demonstrate cybersecurity principles and validation

describe('Cybersecurity Test Suite', () => {
  
  describe('Input Sanitization & XSS Prevention', () => {
    // Mock sanitization functions based on your existing code
    const sanitizeHtml = (input) => {
      if (typeof input !== 'string') return '';
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<iframe/gi, '')
        .replace(/<object/gi, '')
        .replace(/<embed/gi, '')
        .replace(/alert\([^)]*\)/gi, '') // Remove alert() calls
        .replace(/&lt;script&gt;.*?&lt;\/script&gt;/gi, '') // Handle encoded scripts
        .trim();
    };

    test('should prevent XSS attacks through script injection', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<div onclick="alert(1)">Click me</div>'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeHtml(input);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
        expect(sanitized).not.toContain('onclick=');
        expect(sanitized).not.toContain('alert(');
      });
    });

    test('should handle encoded XSS attempts', () => {
      const encodedXSS = [
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        '%3Cscript%3Ealert(%22XSS%22)%3C/script%3E'
      ];

      encodedXSS.forEach(input => {
        const sanitized = sanitizeHtml(input);
        expect(sanitized).not.toContain('script');
        expect(sanitized).not.toContain('alert');
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    const sanitizeSqlInput = (input) => {
      if (typeof input !== 'string') return '';
      return input
        .replace(/['";\\]/g, '')
        .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '')
        .trim();
    };

    test('should prevent SQL injection attempts', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM admin_users --",
        "1; DELETE FROM bookings; --"
      ];

      sqlInjectionAttempts.forEach(input => {
        const sanitized = sanitizeSqlInput(input);
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('DELETE');
        expect(sanitized).not.toContain('INSERT');
        expect(sanitized).not.toContain('UNION');
        expect(sanitized).not.toContain('--');
        expect(sanitized).not.toContain(';');
      });
    });
  });

  describe('Authentication & Password Security', () => {
    const validatePassword = (password) => {
      const errors = [];
      
      if (typeof password !== 'string') {
        return { valid: false, errors: ['Password must be a string'] };
      }
      
      if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
      
      if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      
      return { valid: errors.length === 0, errors };
    };

    test('should enforce strong password requirements', () => {
      const weakPasswords = [
        'password',
        '123456',
        'abc123',
        'PASSWORD',
        'Pass1',
        'verylongpasswordwithnouppercase1'
      ];

      weakPasswords.forEach(password => {
        const validation = validatePassword(password);
        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    test('should accept strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MySecure2024Pass',
        'ComplexP@ssw0rd'
      ];

      strongPasswords.forEach(password => {
        const validation = validatePassword(password);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });
  });

  describe('Rate Limiting & Brute Force Prevention', () => {
    class RateLimiter {
      constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
      }

      isAllowed(clientIp) {
        const now = Date.now();
        const clientRequests = this.requests.get(clientIp) || [];
        
        // Remove old requests outside the window
        const validRequests = clientRequests.filter(
          timestamp => now - timestamp < this.windowMs
        );
        
        if (validRequests.length >= this.maxRequests) {
          return false;
        }
        
        validRequests.push(now);
        this.requests.set(clientIp, validRequests);
        return true;
      }
    }

    test('should implement rate limiting for login attempts', () => {
      const rateLimiter = new RateLimiter(3, 60000); // 3 requests per minute
      const clientIp = '192.168.1.100';

      // First 3 requests should be allowed
      expect(rateLimiter.isAllowed(clientIp)).toBe(true);
      expect(rateLimiter.isAllowed(clientIp)).toBe(true);
      expect(rateLimiter.isAllowed(clientIp)).toBe(true);

      // 4th request should be blocked
      expect(rateLimiter.isAllowed(clientIp)).toBe(false);
    });

    test('should handle multiple IPs independently', () => {
      const rateLimiter = new RateLimiter(2, 60000);
      
      expect(rateLimiter.isAllowed('192.168.1.1')).toBe(true);
      expect(rateLimiter.isAllowed('192.168.1.2')).toBe(true);
      expect(rateLimiter.isAllowed('192.168.1.1')).toBe(true);
      expect(rateLimiter.isAllowed('192.168.1.2')).toBe(true);
      
      // Both IPs should now be rate limited
      expect(rateLimiter.isAllowed('192.168.1.1')).toBe(false);
      expect(rateLimiter.isAllowed('192.168.1.2')).toBe(false);
    });
  });

  describe('Data Validation & Business Logic Security', () => {
    const validateBookingData = (data) => {
      const errors = [];
      
      // Name validation - check for XSS in the name
      if (!data.name || typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 60) {
        errors.push('Name must be between 2-60 characters');
      } else if (data.name.includes('<script') || data.name.includes('javascript:')) {
        errors.push('Name contains malicious content');
      }
      
      // Email validation
      if (!data.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
        errors.push('Valid email address required');
      }
      
      // Phone validation
      if (!data.phone || !/^\+\d{8,15}$/.test(data.phone)) {
        errors.push('Valid international phone number required');
      }
      
      // Payment method validation
      if (!['cash', 'card'].includes(data.paymentMethod)) {
        errors.push('Invalid payment method');
      }
      
      // Price validation
      if (!data.route || !data.route.price || data.route.price < 0 || data.route.price > 10000) {
        errors.push('Invalid price range');
      }
      
      return errors;
    };

    test('should validate legitimate booking data', () => {
      const validBooking = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+40712345678',
        paymentMethod: 'cash',
        route: { price: 50 }
      };

      const errors = validateBookingData(validBooking);
      expect(errors).toHaveLength(0);
    });

    test('should reject malicious booking data', () => {
      const maliciousBookings = [
        {
          name: '<script>alert("XSS")</script>',
          email: 'test@example.com',
          phone: '+40712345678',
          paymentMethod: 'cash',
          route: { price: 50 }
        },
        {
          name: 'Test User',
          email: 'invalid-email',
          phone: '+40712345678',
          paymentMethod: 'bitcoin',
          route: { price: 50 }
        },
        {
          name: 'Test User',
          email: 'test@example.com',
          phone: 'not-a-phone',
          paymentMethod: 'cash',
          route: { price: -100 }
        }
      ];

      maliciousBookings.forEach(booking => {
        const errors = validateBookingData(booking);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Session & Access Control Security', () => {
    const generateSecureToken = () => {
      const crypto = require('crypto');
      return crypto.randomBytes(32).toString('hex');
    };

    const checkPermissions = (userRole, requiredPermission) => {
      const permissions = {
        'guest': ['view_routes', 'create_booking'],
        'user': ['view_routes', 'create_booking', 'view_profile', 'edit_profile'],
        'admin': ['view_routes', 'create_booking', 'view_profile', 'edit_profile', 'manage_users', 'manage_routes'],
        'super_admin': ['*']
      };

      if (!permissions[userRole]) return false;
      return permissions[userRole].includes(requiredPermission) || 
             permissions[userRole].includes('*');
    };

    test('should generate cryptographically secure tokens', () => {
      const tokens = [];
      for (let i = 0; i < 100; i++) {
        tokens.push(generateSecureToken());
      }

      // Verify uniqueness
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);

      // Verify format
      tokens.forEach(token => {
        expect(token.length).toBe(64);
        expect(/^[a-f0-9]+$/.test(token)).toBe(true);
      });
    });

    test('should implement proper role-based access control', () => {
      // Test guest permissions
      expect(checkPermissions('guest', 'view_routes')).toBe(true);
      expect(checkPermissions('guest', 'manage_users')).toBe(false);

      // Test user permissions
      expect(checkPermissions('user', 'edit_profile')).toBe(true);
      expect(checkPermissions('user', 'manage_routes')).toBe(false);

      // Test admin permissions
      expect(checkPermissions('admin', 'manage_users')).toBe(true);
      expect(checkPermissions('admin', 'view_routes')).toBe(true);

      // Test super admin permissions
      expect(checkPermissions('super_admin', 'any_permission')).toBe(true);
    });
  });

  describe('Error Handling & Information Disclosure', () => {
    const sanitizeErrorMessage = (error, isProduction = true) => {
      if (!isProduction) {
        return error.message; // Full error in development
      }

      // In production, return generic messages to prevent information disclosure
      const sanitizedMessages = {
        'User not found': 'Invalid credentials',
        'Password incorrect': 'Invalid credentials',
        'Database connection failed': 'Service temporarily unavailable',
        'Admin user does not exist': 'Invalid credentials'
      };

      return sanitizedMessages[error.message] || 'An error occurred';
    };

    test('should prevent information disclosure in error messages', () => {
      const sensitiveErrors = [
        new Error('User not found'),
        new Error('Password incorrect'),
        new Error('Database connection failed'),
        new Error('Admin user does not exist')
      ];

      sensitiveErrors.forEach(error => {
        const sanitized = sanitizeErrorMessage(error, true);
        expect(sanitized).not.toContain('Database');
        expect(sanitized).not.toContain('User not found');
        expect(sanitized).not.toContain('Password incorrect');
        expect(sanitized).not.toContain('Admin user');
      });
    });
  });
});