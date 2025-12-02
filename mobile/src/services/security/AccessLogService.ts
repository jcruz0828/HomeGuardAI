import { API_CONFIG } from '../../config/api';

export interface AccessLogResponse {
  id: string;
  userId?: string;
  userName?: string;
  personId?: string;
  personName?: string;
  deviceId?: string;
  deviceName?: string;
  homeId?: string;
  homeName?: string;
  accessType: 'FACIAL_RECOGNITION' | 'RFID' | 'MOBILE_APP' | 'MANUAL_OVERRIDE' | 'EMERGENCY' | 'ADMIN_OVERRIDE' | 'LOCK' | 'UNLOCK';
  result: 'GRANTED' | 'DENIED' | 'ERROR' | 'TIMEOUT' | 'MANUAL_REQUIRED';
  reason?: string;
  imagePath?: string;
  location?: string;
  confidence?: number;
  faceId?: string;
  additionalData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessLogPageResponse {
  content: AccessLogResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
}

class AccessLogService {
  private baseUrl = API_CONFIG.SPRING_API_BASE_URL;
  private endpoint = API_CONFIG.ENDPOINTS.ACCESS_LOGS;

  /**
   * Get access logs for a specific home
   */
  async getAccessLogsByHomeId(
    homeId: string,
    page: number = 0,
    size: number = 50
  ): Promise<AccessLogPageResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoint}/homes/${homeId}?page=${page}&size=${size}&sort=createdAt,desc`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching access logs by home ID:', error);
      throw error;
    }
  }

  /**
   * Get access logs for a specific device
   */
  async getAccessLogsByDeviceId(deviceId: string): Promise<AccessLogResponse[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoint}/devices/${deviceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching access logs by device ID:', error);
      throw error;
    }
  }

  /**
   * Get access logs for a specific person
   */
  async getAccessLogsByPersonId(personId: string): Promise<AccessLogResponse[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoint}/persons/${personId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching access logs by person ID:', error);
      throw error;
    }
  }

  /**
   * Get access logs for a home within a time range
   */
  async getAccessLogsByHomeIdAndTimeRange(
    homeId: string,
    startTime: string,
    endTime: string
  ): Promise<AccessLogResponse[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoint}/homes/${homeId}/time-range?startTime=${startTime}&endTime=${endTime}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching access logs by time range:', error);
      throw error;
    }
  }
}

export const accessLogService = new AccessLogService();

