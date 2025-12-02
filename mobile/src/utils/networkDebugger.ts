/**
 * Network Debugger Utility
 * Helps diagnose network issues in React Native
 */

import { getApiConfig } from '../config/api';
import { networkRequest } from './networkClient';

interface NetworkTestResult {
  endpoint: string;
  success: boolean;
  status?: number;
  duration: number;
  error?: string;
}

/**
 * Test if backend is reachable
 */
export async function testBackendConnectivity(): Promise<NetworkTestResult[]> {
  const config = getApiConfig();
  const baseUrl = config.SPRING_API_BASE_URL;
  
  console.log('🔍 Testing backend connectivity...');
  console.log('Base URL:', baseUrl);
  
  const tests: NetworkTestResult[] = [];
  
  // Test 1: Health endpoint
  try {
    const startTime = Date.now();
    const response = await networkRequest(`${baseUrl}/health`, {
      timeout: 5000,
      skipDeduplication: true,
    });
    const duration = Date.now() - startTime;
    
    tests.push({
      endpoint: '/health',
      success: response.ok,
      status: response.status,
      duration,
    });
  } catch (error: any) {
    tests.push({
      endpoint: '/health',
      success: false,
      duration: 0,
      error: error.message,
    });
  }
  
  // Test 2: Actuator health
  try {
    const startTime = Date.now();
    const response = await networkRequest(`${baseUrl.replace('/api/v1', '')}/actuator/health`, {
      timeout: 5000,
      skipDeduplication: true,
    });
    const duration = Date.now() - startTime;
    
    tests.push({
      endpoint: '/actuator/health',
      success: response.ok,
      status: response.status,
      duration,
    });
  } catch (error: any) {
    tests.push({
      endpoint: '/actuator/health',
      success: false,
      duration: 0,
      error: error.message,
    });
  }
  
  return tests;
}

/**
 * Test a specific endpoint with a user ID
 */
export async function testUserEndpoint(userId: string): Promise<NetworkTestResult> {
  const config = getApiConfig();
  const baseUrl = config.SPRING_API_BASE_URL;
  
  const endpoint = `${baseUrl}/users/${userId}`;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Testing user endpoint: ${endpoint}`);
    const response = await networkRequest(endpoint, {
      timeout: 15000,
      skipDeduplication: true,
    });
    
    const duration = Date.now() - startTime;
    const data = await response.json().catch(() => null);
    
    return {
      endpoint: `/users/${userId}`,
      success: response.ok,
      status: response.status,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      endpoint: `/users/${userId}`,
      success: false,
      duration,
      error: error.message,
    };
  }
}

/**
 * Get network diagnostics information
 */
export function getNetworkDiagnostics() {
  const config = getApiConfig();
  
  return {
    baseUrl: config.SPRING_API_BASE_URL,
    isLocalhost: config.SPRING_API_BASE_URL.includes('localhost'),
    isIPAddress: /^\d+\.\d+\.\d+\.\d+/.test(config.SPRING_API_BASE_URL.replace('http://', '').split(':')[0]),
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'unknown',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log network diagnostics to console
 */
export function logNetworkDiagnostics() {
  const diagnostics = getNetworkDiagnostics();
  
  console.log('📊 Network Diagnostics:');
  console.log('  Base URL:', diagnostics.baseUrl);
  console.log('  Is Localhost:', diagnostics.isLocalhost);
  console.log('  Is IP Address:', diagnostics.isIPAddress);
  console.log('  Environment:', diagnostics.environment);
  console.log('  Timestamp:', diagnostics.timestamp);
}

