import { API_CONFIG } from '../../config/api';

export interface HomeActivity {
  id: string;
  homeId: string;
  userId?: string;
  personId?: string;
  deviceId?: string;
  activityType: string;
  priority: string;
  title: string;
  description?: string;
  location?: string;
  imagePath?: string;
  confidence?: number;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedByUserId?: string;
  additionalData?: string;
  activityTimestamp: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityCounts {
  unacknowledged: number;
  unresolved: number;
}

class HomeActivityService {
  private baseUrl = API_CONFIG.SPRING_API_BASE_URL;
  private endpoint = '/home-activities';

  /**
   * Get all activities for a home (no time limit)
   */
  async getRecentActivities(homeId: string, hours?: number): Promise<HomeActivity[]> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/homes/${homeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Extract activities from paginated response
      return data.content || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get unacknowledged activities for a home
   */
  async getUnacknowledgedActivities(homeId: string): Promise<HomeActivity[]> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/homes/${homeId}/unacknowledged`, {
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
      throw error;
    }
  }

  /**
   * Get critical activities for a home
   */
  async getCriticalActivities(homeId: string): Promise<HomeActivity[]> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/homes/${homeId}/critical`, {
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
      throw error;
    }
  }

  /**
   * Get activity counts for a home
   */
  async getActivityCounts(homeId: string): Promise<ActivityCounts> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/homes/${homeId}/counts`, {
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
      throw error;
    }
  }

  /**
   * Acknowledge an activity
   */
  async acknowledgeActivity(activityId: string, userId: string): Promise<HomeActivity> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/${activityId}/acknowledge?userId=${userId}`, {
        method: 'POST',
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
      throw error;
    }
  }

  /**
   * Resolve an activity
   */
  async resolveActivity(activityId: string, userId: string): Promise<HomeActivity> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}/${activityId}/resolve?userId=${userId}`, {
        method: 'POST',
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
      throw error;
    }
  }

  /**
   * Create a new activity
   */
  async createActivity(activity: {
    homeId: string;
    userId?: string;
    personId?: string;
    deviceId?: string;
    activityType: string;
    priority?: string;
    title: string;
    description?: string;
    location?: string;
    imagePath?: string;
    confidence?: number;
    additionalData?: string;
    activityTimestamp: string;
  }): Promise<HomeActivity> {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP error! status: ${response.status}` };
        }
        console.error('Activity creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestBody: activity,
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  /**
   * Get all activities for all homes that a user has access to
   * This method fetches activities from each home individually and combines them
   */
  async getGlobalRecentActivities(homeIds: string[], hours?: number): Promise<HomeActivity[]> {
    try {
      // Fetch activities from all homes in parallel
      const activityPromises = homeIds.map(homeId => 
        this.getRecentActivities(homeId, hours).catch(error => {
          console.warn(`Failed to fetch activities for home ${homeId}:`, error);
          return []; // Return empty array if one home fails
        })
      );

      const activityArrays = await Promise.all(activityPromises);
      
      // Flatten and sort by timestamp (most recent first)
      const allActivities = activityArrays.flat();
      return allActivities.sort((a, b) => 
        new Date(b.activityTimestamp).getTime() - new Date(a.activityTimestamp).getTime()
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get unacknowledged activities for all homes that a user has access to
   * This method fetches activities from each home individually and combines them
   */
  async getGlobalUnacknowledgedActivities(homeIds: string[]): Promise<HomeActivity[]> {
    try {
      // Fetch unacknowledged activities from all homes in parallel
      const activityPromises = homeIds.map(homeId => 
        this.getUnacknowledgedActivities(homeId).catch(error => {
          console.warn(`Failed to fetch unacknowledged activities for home ${homeId}:`, error);
          return []; // Return empty array if one home fails
        })
      );

      const activityArrays = await Promise.all(activityPromises);
      
      // Flatten and sort by timestamp (most recent first)
      const allActivities = activityArrays.flat();
      return allActivities.sort((a, b) => 
        new Date(b.activityTimestamp).getTime() - new Date(a.activityTimestamp).getTime()
      );
    } catch (error) {
      throw error;
    }
  }
}

export const homeActivityService = new HomeActivityService();
