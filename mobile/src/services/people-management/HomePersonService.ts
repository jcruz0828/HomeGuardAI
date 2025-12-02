import { API_CONFIG } from '../../config/api';

export interface HomePersonRequest {
  homeId: string;
  personId: string;
  accessLevel: 'FULL_ACCESS' | 'LIMITED_HOURS' | 'WEEKDAYS_ONLY' | 'TEMPORARY' | 'EMERGENCY_ONLY';
  accessExpiresAt?: string;
  notes?: string;
  isActive?: boolean;
  automaticAccessEnabled?: boolean;
  automaticAccessLimit?: number;
  automaticAccessResetPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'NEVER';
}

export interface HomePersonResponse {
  id: string;
  homeId: string;
  personId: string;
  accessLevel: 'FULL_ACCESS' | 'LIMITED_HOURS' | 'WEEKDAYS_ONLY' | 'TEMPORARY' | 'EMERGENCY_ONLY';
  accessExpiresAt?: string;
  isActive: boolean;
  notes?: string;
  lastAccessed?: string;
  createdAt: string;
  updatedAt: string;
  automaticAccessEnabled?: boolean;
  automaticAccessCount?: number;
  automaticAccessLimit?: number;
  automaticAccessResetPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'NEVER';
  automaticAccessLastReset?: string;
  person?: {
    id: string;
    name: string;
    personType: string;
    profileImagePath?: string;
  };
}

class HomePersonService {
  private baseUrl = API_CONFIG.SPRING_API_BASE_URL;
  private endpoint = '/home-persons'; // This endpoint needs to be created in the backend

  /**
   * Link a person to a home
   */
  async linkPersonToHome(request: HomePersonRequest): Promise<HomePersonResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}`, {
        method: 'POST',
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
      throw error;
    }
  }

  /**
   * Get all persons linked to a home
   */
  async getPersonsByHomeId(homeId: string): Promise<HomePersonResponse[]> {
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
      console.error('Error getting persons by home ID:', error);
      throw error;
    }
  }

  /**
   * Update person's access level for a home
   */
  async updatePersonAccess(id: string, request: Partial<HomePersonRequest>): Promise<HomePersonResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/${id}`, {
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
      console.error('Error updating person access:', error);
      throw error;
    }
  }

  /**
   * Remove person from home
   */
  async removePersonFromHome(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/${id}`, {
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
      console.error('Error removing person from home:', error);
      throw error;
    }
  }
}

export const homePersonService = new HomePersonService();
