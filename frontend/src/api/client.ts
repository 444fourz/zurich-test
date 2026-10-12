/**
 * API client for communicating with the backend.
 * 
 * All health data is sent over HTTPS in production.
 * No sensitive data is logged to the console (GDPR compliance).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApplicationData {
  personal: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postcode: string;
  };
  lifestyle: {
    smoker: string;
    alcoholConsumption: string;
    exerciseFrequency: string;
    occupation: string;
    hazardousActivities: string;
  };
  medical: {
    height: string;
    weight: string;
    existingConditions: string[];
    medications: string;
    familyHistory: string;
    recentHospitalisation: string;
  };
}

interface ApplicationResponse {
  id: number;
  reference: string;
  status: string;
  message: string;
}

/**
 * Submit a new application to the backend.
 * 
 * @param data - Complete application data from the form
 * @returns Application reference and ID
 */
export async function submitApplication(data: ApplicationData): Promise<ApplicationResponse> {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit application');
  }

  return response.json();
}

/**
 * Health check to verify backend connectivity.
 */
export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
