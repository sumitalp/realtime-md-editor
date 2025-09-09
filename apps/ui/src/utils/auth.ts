export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth-token');
  };
  
  export const setAuthToken = (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth-token', token);
  };
  
  export const removeAuthToken = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth-token');
  };
  
  export const createAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };