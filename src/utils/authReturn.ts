// src/utils/authReturn.ts
export const RETURN_TO_KEY = 'returnTo';

export const isBrowser = () => typeof window !== 'undefined';

export const getReturnToFromCurrentUrl = () => {
  if (!isBrowser()) return '/';
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}` || '/';
};

export const saveReturnTo = (value: string) => {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(RETURN_TO_KEY, value || '/');
  } catch (error) {
    // Silently ignore sessionStorage errors - not critical
    console.error('Failed to save returnTo:', error);
  }
};

export const readAndClearReturnTo = () => {
  if (!isBrowser()) return null;
  try {
    const v = sessionStorage.getItem(RETURN_TO_KEY);
    if (v) sessionStorage.removeItem(RETURN_TO_KEY);
    return v;
  } catch {
    return null;
  }
};

// Prevent open-redirect + prevent returning back to /login
export const sanitizeReturnTo = (candidate: string | null | undefined) => {
  if (!candidate) return '/';
  
  try {
    // ✅ If candidate is accidentally percent-encoded, decode once
    let c = candidate;
    if (/%2F|%3F|%23|%26/i.test(c)) {
      try { 
        c = decodeURIComponent(c); 
      } catch (error) {
        // Silently ignore decode errors - use original value
        console.error('Failed to decode returnTo:', error);
      }
    }
    
    // Allow only same-origin relative URLs
    const url = new URL(c, window.location.origin);
    
    if (url.origin !== window.location.origin) return '/';
    if (url.pathname.startsWith('/login')) return '/';
    
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
};
