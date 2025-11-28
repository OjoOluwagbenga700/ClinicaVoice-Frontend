import { getAuthToken } from '../utils/auth';
import { get, post, put, del } from 'aws-amplify/api';

// Mock API service for demo
const mockDB = {
  users: [{ email: 'demo@clinicavoice.ca', password: 'demo123', name: 'Dr. Demo' }],
  stats: { activePatients: 128, recentTranscriptions: 24, pendingReviews: 7 },
  transcriptions: [
    { id: 1, patient: 'John Doe', date: '2025-09-30', status: 'Reviewed' },
    { id: 2, patient: 'Jane Roe', date: '2025-09-29', status: 'Pending' }
  ]
}

/**
 * Creates headers with authentication token for API requests (Requirement 15.4)
 * @returns {Promise<Object>} Headers object with Authorization token
 */
async function getAuthHeaders() {
  const token = await getAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
}

/**
 * Makes an authenticated GET request to the API
 * @param {string} path - API endpoint path
 * @returns {Promise<any>} Response data
 */
export async function apiGet(path) {
  try {
    const headers = await getAuthHeaders();
    const restOperation = get({
      apiName: 'ClinicaVoiceAPI',
      path,
      options: { headers }
    });
    const response = await restOperation.response;
    return await response.body.json();
  } catch (error) {
    console.error('API GET error:', error);
    throw error;
  }
}

/**
 * Makes an authenticated POST request to the API
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body
 * @returns {Promise<any>} Response data
 */
export async function apiPost(path, body) {
  try {
    const headers = await getAuthHeaders();
    const restOperation = post({
      apiName: 'ClinicaVoiceAPI',
      path,
      options: {
        headers,
        body
      }
    });
    const response = await restOperation.response;
    return await response.body.json();
  } catch (error) {
    console.error('API POST error:', error);
    throw error;
  }
}

/**
 * Makes an authenticated PUT request to the API
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body
 * @returns {Promise<any>} Response data
 */
export async function apiPut(path, body) {
  try {
    const headers = await getAuthHeaders();
    const restOperation = put({
      apiName: 'ClinicaVoiceAPI',
      path,
      options: {
        headers,
        body
      }
    });
    const response = await restOperation.response;
    return await response.body.json();
  } catch (error) {
    console.error('API PUT error:', error);
    throw error;
  }
}

/**
 * Makes an authenticated DELETE request to the API
 * @param {string} path - API endpoint path
 * @returns {Promise<any>} Response data
 */
export async function apiDelete(path) {
  try {
    const headers = await getAuthHeaders();
    const restOperation = del({
      apiName: 'ClinicaVoiceAPI',
      path,
      options: { headers }
    });
    const response = await restOperation.response;
    return await response.body.json();
  } catch (error) {
    console.error('API DELETE error:', error);
    throw error;
  }
}

// Mock implementation for development - will be replaced with real API calls
const USE_MOCK_API = false;

// Import mock functions
import { 
  getReports as mockGetReports, 
  getReportById as mockGetReportById,
  getStats as mockGetStats,
  getActivityChart as mockGetActivityChart,
  getRecentNotes as mockGetRecentNotes,
  getPatientStats as mockGetPatientStats,
  getPatientRecentReports as mockGetPatientRecentReports
} from '../api/mockApi';

/**
 * Fetches all reports for the current user (Requirement 11.1)
 * For clinicians: returns all their reports
 * For patients: returns only their own reports
 * @returns {Promise<Array>} Array of report objects
 */
export async function fetchReports() {
  if (USE_MOCK_API) {
    return await mockGetReports();
  }
  
  try {
    return await apiGet('/reports');
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    throw error;
  }
}

/**
 * Fetches a specific report by ID (Requirement 11.4, 11.5)
 * @param {string} reportId - The report ID
 * @returns {Promise<Object>} Report object
 */
export async function fetchReportById(reportId) {
  if (USE_MOCK_API) {
    return await mockGetReportById(reportId);
  }
  
  try {
    return await apiGet(`/reports/${reportId}`);
  } catch (error) {
    console.error('Failed to fetch report:', error);
    throw error;
  }
}

// Legacy mock functions for backward compatibility
export async function loginUser(email, password) {
  await new Promise(r => setTimeout(r, 400));
  const user = mockDB.users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid credentials');
  sessionStorage.setItem('clinica_token', 'mock-token');
  sessionStorage.setItem('clinica_user', JSON.stringify(user));
  return user;
}

export async function registerUser(name, email, password) {
  await new Promise(r => setTimeout(r, 600));
  const exists = mockDB.users.find(u => u.email === email);
  if (exists) throw new Error('Email already registered');
  const newUser = { name, email, password };
  mockDB.users.push(newUser);
  sessionStorage.setItem('clinica_token', 'mock-token');
  sessionStorage.setItem('clinica_user', JSON.stringify(newUser));
  return newUser;
}

export async function getDashboardStats() {
  await new Promise(r => setTimeout(r, 300));
  return mockDB.stats;
}

export async function getTranscriptions() {
  await new Promise(r => setTimeout(r, 300));
  return mockDB.transcriptions;
}

/**
 * Fetches dashboard statistics for clinicians (Requirements 10.1, 10.2, 10.3)
 * @returns {Promise<Object>} Statistics object with activePatients, recentTranscriptions, pendingReviews
 */
export async function fetchDashboardStats() {
  if (USE_MOCK_API) {
    return await mockGetStats();
  }
  
  try {
    return await apiGet('/dashboard/stats');
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    throw error;
  }
}

/**
 * Fetches activity chart data for clinicians (Requirements 10.4, 19.4)
 * @returns {Promise<Array>} Array of activity data points with date and transcription count
 */
export async function fetchActivityChart() {
  if (USE_MOCK_API) {
    return await mockGetActivityChart();
  }
  
  try {
    return await apiGet('/dashboard/activity');
  } catch (error) {
    console.error('Failed to fetch activity chart:', error);
    throw error;
  }
}

/**
 * Fetches recent notes/transcriptions for clinicians (Requirements 10.5, 19.5)
 * @returns {Promise<Array>} Array of recent notes with patient, status, and date
 */
export async function fetchRecentNotes() {
  if (USE_MOCK_API) {
    return await mockGetRecentNotes();
  }
  
  try {
    return await apiGet('/dashboard/recent-notes');
  } catch (error) {
    console.error('Failed to fetch recent notes:', error);
    throw error;
  }
}

/**
 * Fetches dashboard statistics for patients
 * @returns {Promise<Object>} Statistics object with totalReports, upcomingAppointments, lastVisit
 */
export async function fetchPatientDashboardStats() {
  if (USE_MOCK_API) {
    return await mockGetPatientStats();
  }
  
  try {
    return await apiGet('/dashboard/patient/stats');
  } catch (error) {
    console.error('Failed to fetch patient dashboard stats:', error);
    throw error;
  }
}

/**
 * Fetches recent reports for patients
 * @returns {Promise<Array>} Array of recent reports with title, status, and date
 */
export async function fetchPatientRecentReports() {
  if (USE_MOCK_API) {
    return await mockGetPatientRecentReports();
  }
  
  try {
    return await apiGet('/dashboard/patient/recent-reports');
  } catch (error) {
    console.error('Failed to fetch patient recent reports:', error);
    throw error;
  }
}
