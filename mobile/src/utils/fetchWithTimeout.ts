/**
 * React Native-compatible fetch with timeout
 * Does NOT use AbortSignal.timeout() which is not available in RN
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<Response> {
  return new Promise((resolve, reject) => {
    // Create AbortController for manual cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout after ${timeoutMs}ms: ${url}`));
    }, timeoutMs);

    // Merge abort signal with existing options
    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
    };

    fetch(url, fetchOptions)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          reject(new Error(`Request timeout after ${timeoutMs}ms: ${url}`));
        } else {
          reject(error);
        }
      });
  });
}

