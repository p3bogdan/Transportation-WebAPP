// Input Sanitization Utilities for Cyber Security
// Protects against XSS, injection attacks, and malicious input

// HTML/XSS Protection
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;')
    .replace(/=/g, '&#61;');
}

// SQL Injection Protection
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/'/g, "''")  // Escape single quotes
    .replace(/;/g, '')    // Remove semicolons
    .replace(/--/g, '')   // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment starts
    .replace(/\*\//g, '') // Remove multi-line comment ends
    .replace(/xp_/gi, '') // Remove extended procedures
    .replace(/sp_/gi, '') // Remove stored procedures
    .replace(/exec/gi, '') // Remove exec commands
    .replace(/execute/gi, ''); // Remove execute commands
}

// General Input Sanitization
export function sanitizeInput(input: string, maxLength?: number): string {
  if (typeof input !== 'string') return '';
  
  let sanitized = input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove Unicode control characters
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove JavaScript protocols
    .replace(/vbscript:/gi, '') // Remove VBScript protocols
    .replace(/data:/gi, '') // Remove data URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/style\s*=/gi, ''); // Remove inline styles
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Email Sanitization
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, '') // Only allow word chars, @, ., -
    .substring(0, 254); // RFC limit
}

// Phone Number Sanitization
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  return phone
    .trim()
    .replace(/[^\d+\-\s()]/g, '') // Only allow digits, +, -, space, parentheses
    .substring(0, 20);
}

// Name Sanitization
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') return '';
  
  return name
    .trim()
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100);
}

// Address Sanitization
export function sanitizeAddress(address: string): string {
  if (typeof address !== 'string') return '';
  
  return address
    .trim()
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 200);
}

// Number Sanitization
export function sanitizeNumber(input: string | number, min?: number, max?: number): number {
  let num: number;
  
  if (typeof input === 'number') {
    num = input;
  } else {
    const cleaned = String(input).replace(/[^\d.-]/g, '');
    num = parseFloat(cleaned);
  }
  
  if (isNaN(num)) return 0;
  
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  return num;
}

// URL Sanitization
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  
  const cleaned = url.trim().toLowerCase();
  
  // Only allow http and https protocols
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    return '';
  }
  
  return url
    .replace(/[<>"']/g, '')
    .substring(0, 2048);
}

// File Name Sanitization
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return '';
  
  return fileName
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
    .replace(/\.\./g, '') // Remove directory traversal
    .substring(0, 255);
}

// CSV Content Sanitization
export function sanitizeCsvContent(content: string): string {
  if (typeof content !== 'string') return '';
  
  return content
    .replace(/=([+\-@])/g, "'=$1") // Prevent CSV injection
    .replace(/^\+/gm, "'+")
    .replace(/^-/gm, "'-")
    .replace(/^@/gm, "'@");
}

// Password Validation (not sanitization - passwords shouldn't be sanitized)
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
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
}

// Comprehensive Data Sanitization for Objects
export function sanitizeUserData(data: any): any {
  const sanitized: any = {};
  
  if (data.name) sanitized.name = sanitizeName(data.name);
  if (data.email) sanitized.email = sanitizeEmail(data.email);
  if (data.phone) sanitized.phone = sanitizePhone(data.phone);
  if (data.address) sanitized.address = sanitizeAddress(data.address);
  if (data.pickupAddress) sanitized.pickupAddress = sanitizeAddress(data.pickupAddress);
  if (data.destination) sanitized.destination = sanitizeAddress(data.destination);
  if (data.company) sanitized.company = sanitizeName(data.company);
  if (data.provider) sanitized.provider = sanitizeName(data.provider);
  if (data.origin) sanitized.origin = sanitizeAddress(data.origin);
  if (data.arrival) sanitized.arrival = sanitizeAddress(data.arrival);
  if (data.departure) sanitized.departure = sanitizeAddress(data.departure);
  if (data.vehicleType) sanitized.vehicleType = sanitizeName(data.vehicleType);
  
  // Payment method validation (only allow specific values)
  if (data.paymentMethod && ['cash', 'card'].includes(data.paymentMethod)) {
    sanitized.paymentMethod = data.paymentMethod;
  }
  
  // Payment status validation
  if (data.paymentStatus && ['paid', 'pending', 'failed', 'not_required'].includes(data.paymentStatus)) {
    sanitized.paymentStatus = data.paymentStatus;
  }
  
  // Numbers
  if (data.price !== undefined) sanitized.price = sanitizeNumber(data.price, 0, 10000);
  if (data.seats !== undefined) sanitized.seats = sanitizeNumber(data.seats, 1, 100);
  if (data.amount !== undefined) sanitized.amount = sanitizeNumber(data.amount, 0, 10000);
  
  // Preserve route object if it exists
  if (data.route) sanitized.route = data.route;
  
  return sanitized;
}

// Rate Limiting Helper
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const userRequests = requests.get(identifier) || [];
    
    // Remove expired requests
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    // Cleanup old entries
    if (requests.size > 1000) {
      const cutoff = now - windowMs;
      const keysToDelete: string[] = [];
      
      requests.forEach((times: number[], key: string) => {
        if (times.every((time: number) => time < cutoff)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => requests.delete(key));
    }
    
    return true;
  };
}