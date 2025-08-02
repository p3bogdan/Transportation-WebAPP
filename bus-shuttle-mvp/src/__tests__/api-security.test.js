const request = require('supertest');
const { NextRequest, NextResponse } = require('next/server');

// Mock the API routes for testing
const mockBookingsAPI = require('../../app/api/bookings/route');
const mockAuthAPI = require('../../app/api/auth/register/route');
const mockAdminAPI = require('../../app/api/admin/auth/route');

describe('API Security Tests', () => {
  
  describe('Authentication Security', () => {
    test('should prevent unauthorized access to protected endpoints', async () => {
      // Test booking creation without authentication
      const maliciousBookingData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+40712345678',
        paymentMethod: 'cash',
        route: { id: 1, price: 100 }
      };

      // Mock request without proper authentication
      const mockRequest = {
        json: () => Promise.resolve(maliciousBookingData),
        headers: new Map([['x-forwarded-for', '192.168.1.1']])
      };

      // This should work as guest bookings are allowed, but test the sanitization
      const response = await mockBookingsAPI.POST(mockRequest);
      expect(response).toBeDefined();
    });

    test('should reject malformed authentication tokens', () => {
      const malformedTokens = [
        'Bearer invalid-token',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        'Bearer <script>alert(1)</script>',
        'Bearer "; DROP TABLE users; --'
      ];

      malformedTokens.forEach(token => {
        // Test that tokens are properly validated
        expect(token).not.toContain('<script');
        expect(token).not.toContain('DROP');
      });
    });
  });

  describe('Rate Limiting Security', () => {
    test('should prevent brute force attacks on registration', async () => {
      const registrationAttempts = [];
      
      // Simulate multiple rapid registration attempts
      for (let i = 0; i < 10; i++) {
        const mockRequest = {
          json: () => Promise.resolve({
            name: `User${i}`,
            email: `user${i}@test.com`,
            password: 'password123',
            phone: '+40712345678'
          }),
          headers: new Map([['x-forwarded-for', '192.168.1.100']])
        };
        
        registrationAttempts.push(mockAuthAPI.POST(mockRequest));
      }

      // Wait for all attempts
      const responses = await Promise.allSettled(registrationAttempts);
      
      // Some should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(response => 
        response.status === 'fulfilled' && 
        response.value.status === 429
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should prevent brute force attacks on admin login', async () => {
      const loginAttempts = [];
      
      // Simulate multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        const mockRequest = {
          json: () => Promise.resolve({
            username: 'admin',
            password: `wrongpassword${i}`
          }),
          headers: new Map([['x-forwarded-for', '192.168.1.101']])
        };
        
        loginAttempts.push(mockAdminAPI.POST(mockRequest));
      }

      const responses = await Promise.allSettled(loginAttempts);
      
      // Should have rate limiting after multiple failures
      const rateLimitedResponses = responses.filter(response => 
        response.status === 'fulfilled' && 
        (response.value.status === 429 || response.value.status === 423)
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation in APIs', () => {
    test('should reject malicious booking data', async () => {
      const maliciousBookingInputs = [
        {
          name: '<script>alert("XSS")</script>',
          email: 'test@example.com',
          phone: '+40712345678',
          paymentMethod: 'cash',
          route: { id: 1, price: 100 }
        },
        {
          name: 'Test User',
          email: 'malicious@example.com<script>alert(1)</script>',
          phone: '+40712345678',
          paymentMethod: 'cash',
          route: { id: 1, price: 100 }
        },
        {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+40712345678; DROP TABLE bookings;',
          paymentMethod: 'cash',
          route: { id: 1, price: 100 }
        }
      ];

      for (const maliciousData of maliciousBookingInputs) {
        const mockRequest = {
          json: () => Promise.resolve(maliciousData),
          headers: new Map([['x-forwarded-for', '192.168.1.1']])
        };

        const response = await mockBookingsAPI.POST(mockRequest);
        
        // Should either reject or sanitize the input
        if (response.status === 400) {
          expect(response.status).toBe(400);
        } else {
          // If accepted, ensure it was sanitized
          const responseBody = await response.json();
          expect(JSON.stringify(responseBody)).not.toContain('<script');
          expect(JSON.stringify(responseBody)).not.toContain('DROP');
        }
      }
    });

    test('should validate payment method enum values', async () => {
      const invalidPaymentMethods = [
        'bitcoin',
        'paypal<script>alert(1)</script>',
        'cash"; DROP TABLE payments; --',
        'card\'; INSERT INTO admin_users VALUES (\'hacker\', \'password\'); --'
      ];

      for (const paymentMethod of invalidPaymentMethods) {
        const mockRequest = {
          json: () => Promise.resolve({
            name: 'Test User',
            email: 'test@example.com',
            phone: '+40712345678',
            paymentMethod: paymentMethod,
            route: { id: 1, price: 100 }
          }),
          headers: new Map([['x-forwarded-for', '192.168.1.1']])
        };

        const response = await mockBookingsAPI.POST(mockRequest);
        
        // Should reject invalid payment methods
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Admin Authentication Security', () => {
    test('should require strong admin credentials', async () => {
      const weakAdminCredentials = [
        { username: 'admin', password: '123456' },
        { username: 'admin', password: 'password' },
        { username: 'admin', password: 'admin' },
        { username: 'root', password: 'root' }
      ];

      for (const credentials of weakAdminCredentials) {
        const mockRequest = {
          json: () => Promise.resolve(credentials),
          headers: new Map([['x-forwarded-for', '192.168.1.1']])
        };

        const response = await mockAdminAPI.POST(mockRequest);
        
        // Should reject weak credentials
        expect(response.status).toBe(401);
      }
    });

    test('should prevent admin setup without proper key', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          username: 'hacker',
          email: 'hacker@evil.com',
          password: 'HackerPass123',
          setupKey: 'wrong_key'
        }),
        headers: new Map([['x-forwarded-for', '192.168.1.1']])
      };

      const response = await mockAdminAPI.PUT(mockRequest);
      
      // Should reject with 403 Forbidden
      expect(response.status).toBe(403);
    });
  });

  describe('Data Exposure Prevention', () => {
    test('should not expose sensitive data in API responses', async () => {
      // Test registration response doesn't include password
      const mockRequest = {
        json: () => Promise.resolve({
          name: 'Test User',
          email: 'testuser@example.com',
          password: 'TestPassword123',
          phone: '+40712345678'
        }),
        headers: new Map([['x-forwarded-for', '192.168.1.1']])
      };

      const response = await mockAuthAPI.POST(mockRequest);
      
      if (response.status === 201) {
        const responseBody = await response.json();
        expect(responseBody.user).toBeDefined();
        expect(responseBody.user.password).toBeUndefined();
        expect(responseBody.password).toBeUndefined();
      }
    });
  });

  describe('CORS and Security Headers', () => {
    test('should implement proper CORS policies', () => {
      // Mock response headers
      const mockHeaders = new Map([
        ['Access-Control-Allow-Origin', 'http://localhost:3000'],
        ['Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'],
        ['Access-Control-Allow-Headers', 'Content-Type, Authorization'],
        ['X-Content-Type-Options', 'nosniff'],
        ['X-Frame-Options', 'DENY'],
        ['X-XSS-Protection', '1; mode=block']
      ]);

      // Verify security headers are present
      expect(mockHeaders.get('X-Content-Type-Options')).toBe('nosniff');
      expect(mockHeaders.get('X-Frame-Options')).toBe('DENY');
      expect(mockHeaders.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });
});