/**
 * URL History item structure
 */
export interface URLHistoryItem {
    short_code: string;
    long_url: string;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
}

const HISTORY_KEY = 'url_shortener_history';

/**
 * Get URL creation history from localStorage
 * @returns Array of URL history items (most recent first)
 */
export function getHistory(): URLHistoryItem[] {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to load URL history:', error);
        return [];
    }
}

/**
 * Add a new URL to history
 * @param item - URL history item to add
 */
export function addToHistory(item: URLHistoryItem): void {
    try {
        const history = getHistory();
        // Add to beginning (most recent first)
        history.unshift(item);
        // Keep only last 50 items
        const trimmed = history.slice(0, 50);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save URL to history:', error);
    }
}

/**
 * Remove a URL from history by short_code
 * @param short_code - Short code of URL to remove
 */
export function removeFromHistory(short_code: string): void {
    try {
        const history = getHistory();
        const filtered = history.filter(item => item.short_code !== short_code);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to remove URL from history:', error);
    }
}

/**
 * Clear all URL history
 */
export function clearHistory(): void {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Failed to clear URL history:', error);
    }
}
