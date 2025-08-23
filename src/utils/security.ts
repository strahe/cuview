/**
 * Security utilities for endpoint validation and sanitization
 */

const ALLOWED_PROTOCOLS = ['ws:', 'wss:', 'http:', 'https:'] as const;
type AllowedProtocol = typeof ALLOWED_PROTOCOLS[number];
const LOCALHOST_PATTERNS = [
  /^(ws|wss|http|https):\/\/localhost(:\d+)?/,
  /^(ws|wss|http|https):\/\/127\.0\.0\.1(:\d+)?/,
  /^(ws|wss|http|https):\/\/\[::1\](:\d+)?/, // IPv6 localhost
] as const;

export const sanitizeEndpoint = (endpoint: string): string => {
  return endpoint.trim().replace(/\/+$/, ''); // Remove trailing slashes
};

export const isSecureEndpoint = (endpoint: string): boolean => {
  if (endpoint.startsWith('/')) return true; // Relative paths are safe
  
  try {
    const url = new URL(endpoint);
    
    // Only allow specific protocols
    if (!ALLOWED_PROTOCOLS.includes(url.protocol as AllowedProtocol)) {
      return false;
    }
    
    // Check for localhost/private network patterns
    const isLocalhost = LOCALHOST_PATTERNS.some(pattern => pattern.test(endpoint));
    const isPrivateNetwork = /^(ws|wss|http|https):\/\/(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(endpoint);
    
    return isLocalhost || isPrivateNetwork;
  } catch {
    return false;
  }
};

export const validateEndpointSecurity = (endpoint: string): { 
  isValid: boolean; 
  warning?: string; 
} => {
  const sanitized = sanitizeEndpoint(endpoint);
  
  if (!isSecureEndpoint(sanitized)) {
    return {
      isValid: false,
      warning: 'Only localhost and private network endpoints are allowed for security.'
    };
  }
  
  if (sanitized.startsWith('http:') && !sanitized.includes('localhost') && !sanitized.includes('127.0.0.1')) {
    return {
      isValid: true,
      warning: 'HTTP connections to remote hosts are not encrypted.'
    };
  }
  
  return { isValid: true };
};