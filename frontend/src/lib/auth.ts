/**
 * Token storage key in localStorage
 */
const TOKEN_KEY = 'auth_token';

/**
 * Get authentication token from localStorage
 * @returns Token string or null if not found
 */
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Save authentication token to localStorage
 * @param token - JWT token to store
 */
export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove authentication token from localStorage
 */
export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated (has token)
 * @returns true if token exists, false otherwise
 */
export function isAuthenticated(): boolean {
    return getToken() !== null;
}
