const {
  sanitizeHtml,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeAddress,
  sanitizeNumber,
  sanitizeUrl,
  validatePassword,
  sanitizeUserData
} = require('../../utils/sanitization');

describe('Input Sanitization Security Tests', () => {
  
  describe('XSS Prevention Tests', () => {
    test('should prevent basic XSS attacks in HTML sanitization', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<div onclick="alert(1)">Click me</div>',
        '<a href="javascript:void(0)" onclick="alert(1)">Link</a>'
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
        '%3Cscript%3Ealert(%22XSS%22)%3C/script%3E',
        '&#60;script&#62;alert(&#34;XSS&#34;)&#60;/script&#62;'
      ];

      encodedXSS.forEach(input => {
        const sanitized = sanitizeHtml(input);
        expect(sanitized).not.toContain('script');
        expect(sanitized).not.toContain('alert');
      });
    });
  });

  describe('SQL Injection Prevention Tests', () => {
    test('should sanitize SQL injection attempts in names', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM admin_users --",
        "1; DELETE FROM bookings; --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ];

      sqlInjectionAttempts.forEach(input => {
        const sanitized = sanitizeName(input);
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('DELETE');
        expect(sanitized).not.toContain('INSERT');
        expect(sanitized).not.toContain('UNION');
        expect(sanitized).not.toContain('--');
        expect(sanitized).not.toContain(';');
      });
    });
  });

  describe('Email Validation and Sanitization', () => {
    test('should validate legitimate email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const sanitized = sanitizeEmail(email);
        expect(sanitized).toBe(email.toLowerCase());
        expect(sanitized).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
      });
    });

    test('should reject malicious email attempts', () => {
      const maliciousEmails = [
        'user@example.com<script>alert(1)</script>',
        'user"@example.com',
        'user@example..com',
        'user@.example.com',
        'user@example.com.',
        'javascript:alert(1)@example.com'
      ];

      maliciousEmails.forEach(email => {
        const sanitized = sanitizeEmail(email);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('..');
      });
    });
  });

  describe('Phone Number Sanitization', () => {
    test('should accept valid international phone numbers', () => {
      const validPhones = [
        '+40712345678',
        '+1234567890',
        '+447123456789'
      ];

      validPhones.forEach(phone => {
        const sanitized = sanitizePhone(phone);
        expect(sanitized).toMatch(/^\+\d{8,15}$/);
      });
    });

    test('should reject malicious phone number attempts', () => {
      const maliciousPhones = [
        '+40712345678<script>alert(1)</script>',
        '+40712345678; DROP TABLE users;',
        'javascript:alert(1)',
        '+40712345678" OR "1"="1'
      ];

      maliciousPhones.forEach(phone => {
        const sanitized = sanitizePhone(phone);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('OR');
      });
    });
  });

  describe('Password Security Validation', () => {
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

  describe('Comprehensive User Data Sanitization', () => {
    test('should sanitize all user input fields', () => {
      const maliciousUserData = {
        name: '<script>alert("XSS")</script>John Doe',
        email: 'user@example.com<script>alert(1)</script>',
        phone: '+40712345678; DROP TABLE users;',
        address: '<img src="x" onerror="alert(1)">123 Main St',
        paymentMethod: 'cash"; DROP TABLE bookings; --'
      };

      const sanitized = sanitizeUserData(maliciousUserData);

      expect(sanitized.name).not.toContain('<script');
      expect(sanitized.email).not.toContain('<script');
      expect(sanitized.phone).not.toContain('DROP');
      expect(sanitized.address).not.toContain('<img');
      expect(sanitized.paymentMethod).toBe('cash'); // Should only allow valid payment methods
    });
  });

  describe('URL Sanitization', () => {
    test('should prevent malicious URL schemes', () => {
      const maliciousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("XSS")',
        'file:///etc/passwd'
      ];

      maliciousUrls.forEach(url => {
        const sanitized = sanitizeUrl(url);
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('data:');
        expect(sanitized).not.toContain('vbscript:');
        expect(sanitized).not.toContain('file:');
      });
    });
  });

  describe('Number Input Validation', () => {
    test('should prevent numeric overflow attacks', () => {
      const maliciousNumbers = [
        Number.MAX_SAFE_INTEGER + 1,
        -Number.MAX_SAFE_INTEGER - 1,
        Infinity,
        -Infinity,
        NaN
      ];

      maliciousNumbers.forEach(num => {
        const sanitized = sanitizeNumber(num, 0, 10000);
        expect(sanitized).toBeGreaterThanOrEqual(0);
        expect(sanitized).toBeLessThanOrEqual(10000);
        expect(Number.isFinite(sanitized)).toBe(true);
      });
    });
  });
});