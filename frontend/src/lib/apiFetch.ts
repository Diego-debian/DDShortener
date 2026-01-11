/**
 * Custom API error class for consistent error handling
 */
export class ApiError extends Error {
    status: number;
    isHtml?: boolean;

    constructor(message: string, status: number, isHtml?: boolean) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.isHtml = isHtml;
    }
}

/**
 * Centralized fetch wrapper for all API calls
 * 
 * Features:
 * - Automatic token injection (reads from localStorage)
 * - JSON and HTML error response handling
 * - Throws ApiError for consistent error handling in UI
 * 
 * @param url - API endpoint (relative path, e.g., '/api/auth/login-json')
 * @param options - Fetch options with optional skipAuth flag
 * @returns Parsed JSON response
 * @throws ApiError with status and message
 */
export async function apiFetch<T = any>(
    url: string,
    options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;

    // Prepare headers using Headers object for type safety
    const headers = new Headers({
        'Content-Type': 'application/json',
    });

    // Add existing headers from options
    if (fetchOptions.headers) {
        const existingHeaders = new Headers(fetchOptions.headers);
        existingHeaders.forEach((value, key) => {
            headers.set(key, value);
        });
    }

    // Add Authorization header if token exists and not skipped
    if (!skipAuth) {
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
        });

        // Handle successful responses
        if (response.ok) {
            const contentType = response.headers.get('content-type');

            // Parse JSON if response is JSON
            if (contentType?.includes('application/json')) {
                return await response.json();
            }

            // For non-JSON success responses (rare), return as text
            const text = await response.text();
            return text as unknown as T;
        }

        // Handle error responses
        const contentType = response.headers.get('content-type');

        // Try to parse JSON error
        if (contentType?.includes('application/json')) {
            try {
                const errorData = await response.json();
                const message = errorData.detail || errorData.message || 'An error occurred';
                throw new ApiError(message, response.status, false);
            } catch (parseError) {
                // If JSON parsing fails, fall through to HTML handling
                if (parseError instanceof ApiError) {
                    throw parseError;
                }
            }
        }

        // Handle HTML error responses (e.g., 503 from nginx)
        const genericMessage = response.status === 503
            ? 'Service temporarily unavailable. Please try again later.'
            : `Server error (${response.status}). Please try again.`;

        throw new ApiError(genericMessage, response.status, true);

    } catch (error) {
        // Re-throw ApiError as-is
        if (error instanceof ApiError) {
            throw error;
        }

        // Handle network errors
        if (error instanceof TypeError) {
            throw new ApiError(
                'Network error. Please check your connection.',
                0,
                false
            );
        }

        // Handle unexpected errors
        throw new ApiError(
            'An unexpected error occurred. Please try again.',
            0,
            false
        );
    }
}
