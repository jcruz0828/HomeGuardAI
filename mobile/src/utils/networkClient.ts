/**
 * React Native-Safe Network Client
 * 
 * Features:
 * - Proper timeout handling (no AbortSignal.timeout)
 * - Request deduplication (prevents double calls)
 * - Comprehensive error handling
 * - Request/response logging
 * - Network state detection
 */

interface RequestConfig extends RequestInit {
  timeout?: number;
  skipDeduplication?: boolean;
}

interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
}

// Request deduplication cache (prevents duplicate simultaneous requests)
const pendingRequests = new Map<string, PendingRequest>();
const REQUEST_DEDUP_WINDOW = 1000; // 1 second window

// Request ID generator for tracking
let requestIdCounter = 0;

/**
 * Generate a unique request key for deduplication
 */
function getRequestKey(url: string, options: RequestInit): string {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * Clean up stale pending requests
 */
function cleanupPendingRequests() {
  const now = Date.now();
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > REQUEST_DEDUP_WINDOW * 2) {
      pendingRequests.delete(key);
    }
  }
}

/**
 * React Native-compatible fetch with timeout
 * Does NOT use AbortSignal.timeout() which is not available in RN
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<Response> {
  const requestId = ++requestIdCounter;
  const startTime = Date.now();
  
  console.log(`[Network ${requestId}] 🌐 Starting request: ${options.method || 'GET'} ${url}`);
  console.log(`[Network ${requestId}] ⏱️  Timeout: ${timeoutMs}ms`);
  
  return new Promise((resolve, reject) => {
    // Create AbortController for manual cancellation
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const onSuccess = (response: Response) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      
      const duration = Date.now() - startTime;
      console.log(`[Network ${requestId}] ✅ Success: ${response.status} ${response.statusText} (${duration}ms)`);
      resolve(response);
    };

    const onError = (error: Error) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      
      const duration = Date.now() - startTime;
      console.error(`[Network ${requestId}] ❌ Error after ${duration}ms:`, error.message);
      reject(error);
    };

    // Set timeout
    timeoutId = setTimeout(() => {
      controller.abort();
      onError(new Error(`Request timeout after ${timeoutMs}ms: ${url}`));
    }, timeoutMs);

    // Merge abort signal with existing options
    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    // Make the actual fetch request
    fetch(url, fetchOptions)
      .then((response) => {
        onSuccess(response);
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          onError(new Error(`Request timeout after ${timeoutMs}ms: ${url}`));
        } else if (error.message?.includes('Network request failed')) {
          onError(new Error(`Network error: Cannot reach ${url}. Check your connection and ensure the backend is running.`));
        } else {
          onError(error);
        }
      });
  });
}

/**
 * Main network client with deduplication and error handling
 */
export async function networkRequest(
  url: string,
  config: RequestConfig = {}
): Promise<Response> {
  const { timeout = 15000, skipDeduplication = false, ...fetchOptions } = config;
  
  // Clean up stale requests periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    cleanupPendingRequests();
  }

  // Check for duplicate requests (unless explicitly skipped)
  if (!skipDeduplication) {
    const requestKey = getRequestKey(url, fetchOptions);
    const existingRequest = pendingRequests.get(requestKey);
    
    if (existingRequest) {
      const age = Date.now() - existingRequest.timestamp;
      if (age < REQUEST_DEDUP_WINDOW) {
        console.log(`[Network] 🔄 Deduplicating request: ${url} (existing request is ${age}ms old)`);
        return existingRequest.promise;
      } else {
        // Stale request, remove it
        pendingRequests.delete(requestKey);
      }
    }

    // Create new request and cache it
    const requestPromise = fetchWithTimeout(url, fetchOptions, timeout)
      .finally(() => {
        // Remove from cache after request completes (success or failure)
        setTimeout(() => {
          pendingRequests.delete(requestKey);
        }, REQUEST_DEDUP_WINDOW);
      });

    pendingRequests.set(requestKey, {
      promise: requestPromise,
      timestamp: Date.now(),
    });

    return requestPromise;
  } else {
    // Skip deduplication, make direct request
    return fetchWithTimeout(url, fetchOptions, timeout);
  }
}

/**
 * Convenience method for GET requests
 */
export async function get(url: string, config: RequestConfig = {}): Promise<Response> {
  return networkRequest(url, { ...config, method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function post(url: string, body: any, config: RequestConfig = {}): Promise<Response> {
  return networkRequest(url, {
    ...config,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Convenience method for PUT requests
 */
export async function put(url: string, body: any, config: RequestConfig = {}): Promise<Response> {
  return networkRequest(url, {
    ...config,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function del(url: string, config: RequestConfig = {}): Promise<Response> {
  return networkRequest(url, { ...config, method: 'DELETE' });
}

/**
 * Parse JSON response with error handling
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`);
  }
}

/**
 * Get pending requests count (for debugging)
 */
export function getPendingRequestsCount(): number {
  return pendingRequests.size;
}

/**
 * Clear all pending requests (for testing/debugging)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}

