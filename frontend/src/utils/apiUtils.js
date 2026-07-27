/**
 * Normalize API response data from the backend's successResponse wrapper.
 * 
 * Backend sends: { success: true, message: "...", data: { ... } }
 * Axios response.data = the full object above.
 * This utility safely extracts the `data` property or falls back to the input itself.
 * 
 * @param {any} responseData - The value from response.data (axios)
 * @param {string} [key] - Optional specific key to extract from data (e.g. 'counters', 'branches')
 * @returns {any} - The extracted payload
 */
export function extractData(responseData, key) {
  if (!responseData) return null;

  // If response has success + data wrapper (standard backend format)
  if (responseData.success !== undefined && responseData.data !== undefined) {
    const payload = responseData.data;
    if (key && payload && typeof payload === 'object' && key in payload) {
      return payload[key];
    }
    return payload;
  }

  // Fallback: return as-is or extract key
  if (key && responseData && typeof responseData === 'object' && key in responseData) {
    return responseData[key];
  }

  return responseData;
}

/**
 * Extract array data safely from API response.
 * Handles all variations of data nesting.
 */
export function extractArray(responseData, key, fallback = []) {
  const extracted = extractData(responseData, key);
  if (Array.isArray(extracted)) return extracted;
  if (Array.isArray(responseData)) return responseData;
  if (key && Array.isArray(responseData?.[key])) return responseData[key];
  return fallback;
}

