import { API_CONFIG } from '../../config/api';

export interface FaceRecognitionSettingsRequest {
  aiDetectionEnabled?: boolean;
  confidenceThreshold?: number;
  faceTolerance?: number;
  maxRecognitionAttempts?: number;
  recognitionCooldownSeconds?: number;
  requireMultipleAngles?: boolean;
}

export interface FaceRecognitionSettingsResponse {
  id: string;
  homeId: string;
  aiDetectionEnabled: boolean;
  confidenceThreshold: number;
  faceTolerance: number;
  maxRecognitionAttempts: number;
  recognitionCooldownSeconds: number;
  requireMultipleAngles: boolean;
  createdAt: string;
  updatedAt: string;
}

class FaceRecognitionSettingsService {
  private baseUrl = API_CONFIG.SPRING_API_BASE_URL;
  private endpoint = '/face-recognition-settings';

  /**
   * Get face recognition settings for a home
   */
  async getSettingsByHomeId(homeId: string): Promise<FaceRecognitionSettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/home/${homeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting face recognition settings:', error);
      throw error;
    }
  }

  /**
   * Update face recognition settings for a home
   */
  async updateSettingsByHomeId(
    homeId: string,
    request: FaceRecognitionSettingsRequest
  ): Promise<FaceRecognitionSettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/home/${homeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating face recognition settings:', error);
      throw error;
    }
  }

  /**
   * Delete face recognition settings for a home
   */
  async deleteSettingsByHomeId(homeId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/home/${homeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting face recognition settings:', error);
      throw error;
    }
  }
}

export const faceRecognitionSettingsService = new FaceRecognitionSettingsService();

