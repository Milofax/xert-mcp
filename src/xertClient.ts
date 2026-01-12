/**
 * XERT API Client
 *
 * Handles all communication with the XERT API including
 * automatic token refresh.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const tokenFilePath = path.join(projectRoot, 'xert-tokens.json');

const XERT_BASE_URL = 'https://www.xertonline.com';
const XERT_TOKEN_URL = `${XERT_BASE_URL}/oauth/token`;
const XERT_PUBLIC_CLIENT = { username: 'xert_public', password: 'xert_public' };

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  timestamp: string;
}

// Types for XERT API responses

export interface FitnessSignature {
  ftp: number;
  ltp: number;
  hie: number;
  pp: number;
}

export interface TrainingLoad {
  low: number;
  high: number;
  peak: number;
  total: number;
}

export interface WorkoutOfTheDay {
  type: 'None' | 'Forecast' | 'Scheduled';
  name?: string;
  workoutId?: string;
  description?: string;
  difficulty?: number;
  url?: string;
}

export interface TrainingInfo {
  success: boolean;
  weight: number;
  status: string;
  signature: FitnessSignature;
  tl: TrainingLoad;
  targetXSS: TrainingLoad;
  source: string;
  wotd?: WorkoutOfTheDay;
}

export interface Workout {
  path: string;
  name: string;
  description: string;
  last_modified: number;
}

export interface WorkoutInterval {
  name: string;
  index: number;
  power: number;
  duration: number;
  power_rest?: number;
  duration_rest?: number;
  interval_count: number;
}

export interface WorkoutDetail {
  success: boolean;
  name: string;
  description: string;
  workout: WorkoutInterval[];
}

export interface ActivitySummary {
  name: string;
  start_date: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
  description: string;
  path: string;
  activity_type: string;
}

export interface SessionDataPoint {
  power: number;
  unix_time: number;
  mpa: number;
  cad: number | null;
  alt: number;
  hr: number | null;
  spd: number;
  tgt: number | null;
  lat: number;
  lng: number;
  dist: number;
  tws: number;
  xds: number;
}

export interface ActivityDetail {
  success: boolean;
  name: string;
  description: string;
  session_data?: SessionDataPoint[];
  summary: {
    session?: {
      max_power: number;
      avg_power: number;
      max_cadence: number;
      total_elevation_gain: number;
      total_calories: number;
    };
    xss: number;
    xlss: number;
    xhss: number;
    xpss: number;
    xep: number;
    focus: string;
    mep: number;
    tws: number;
    sp: number;
    sfd: number;
    specificity: string;
    difficulty: number;
    difficulty_rating: string;
    distance: number;
    duration: number;
    sig: FitnessSignature & { atc?: number };
    medal?: number;
    breakthrough?: number;
    prev_sig?: FitnessSignature & { atc?: number };
    activity_type: string;
    start_date: {
      date: string;
      timezone_type: number;
      timezone: string;
    };
    total_grams_carbs?: number;
    total_grams_fat?: number;
    progression?: {
      date: string;
      tl: { ftp: number; hie: number; pp: number };
      rl: { ftp: number; hie: number; pp: number };
      form: number;
    };
    training_status?: number;
    freshness?: string;
    street_view?: string;
    activity_map?: string;
    chart_view?: string;
  };
}

export interface UploadResponse {
  success: boolean;
  json?: {
    files: Array<{
      name: string;
      size: number;
      type: string;
      url: string;
      deleteType: string;
      deleteUrl: string;
    }>;
  };
}

// Token management

let accessToken: string | null = null;
let refreshToken: string | null = null;

function loadTokensFromFile(): boolean {
  try {
    if (fs.existsSync(tokenFilePath)) {
      const data = JSON.parse(fs.readFileSync(tokenFilePath, 'utf-8')) as StoredTokens;
      if (data.accessToken && data.refreshToken) {
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        console.error(`[XERT] Loaded tokens from file (saved: ${data.timestamp})`);
        return true;
      }
    }
  } catch (error) {
    console.error('[XERT] Failed to load tokens from file:', error);
  }
  return false;
}

function loadTokensFromEnv(): void {
  // First try to load from token file (persisted after refresh)
  if (loadTokensFromFile()) {
    return;
  }

  // Fallback to environment variables
  accessToken = process.env.XERT_ACCESS_TOKEN || null;
  refreshToken = process.env.XERT_REFRESH_TOKEN || null;

  if (accessToken && refreshToken) {
    console.error('[XERT] Loaded tokens from environment variables');
  }
}

function saveTokensToFile(newAccessToken: string, newRefreshToken: string): void {
  const tokenData: StoredTokens = {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData, null, 2) + '\n');
  console.error(`[XERT] Saved tokens to file: ${tokenFilePath}`);
}

function updateTokens(newAccessToken: string, newRefreshToken: string): void {
  // Save to token file (primary storage)
  saveTokensToFile(newAccessToken, newRefreshToken);

  // Also update .env file for backwards compatibility
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update or add tokens
  if (envContent.includes('XERT_ACCESS_TOKEN=')) {
    envContent = envContent.replace(/XERT_ACCESS_TOKEN=.*/g, `XERT_ACCESS_TOKEN=${newAccessToken}`);
  } else {
    envContent += `\nXERT_ACCESS_TOKEN=${newAccessToken}`;
  }

  if (envContent.includes('XERT_REFRESH_TOKEN=')) {
    envContent = envContent.replace(/XERT_REFRESH_TOKEN=.*/g, `XERT_REFRESH_TOKEN=${newRefreshToken}`);
  } else {
    envContent += `\nXERT_REFRESH_TOKEN=${newRefreshToken}`;
  }

  envContent = envContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  fs.writeFileSync(envPath, envContent);

  // Update in-memory tokens
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  process.env.XERT_ACCESS_TOKEN = newAccessToken;
  process.env.XERT_REFRESH_TOKEN = newRefreshToken;
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshToken) {
    throw new Error('No refresh token available. Please run: npm run setup-auth');
  }

  console.error('[XERT] Refreshing access token...');

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  try {
    const response = await axios.post(XERT_TOKEN_URL, params.toString(), {
      auth: XERT_PUBLIC_CLIENT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    updateTokens(response.data.access_token, response.data.refresh_token);
    console.error('[XERT] Token refreshed successfully');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error('Refresh token expired. Please run: npm run setup-auth');
    }
    throw error;
  }
}

// API Client

function createApiClient(): AxiosInstance {
  loadTokensFromEnv();

  const client = axios.create({
    baseURL: XERT_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth header
  client.interceptors.request.use((config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  // Response interceptor for token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && originalRequest && !('_retry' in originalRequest)) {
        (originalRequest as typeof originalRequest & { _retry: boolean })._retry = true;

        await refreshAccessToken();

        // Update the auth header with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return client(originalRequest);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

const apiClient = createApiClient();

// API Methods

export async function getTrainingInfo(format?: 'zwo' | 'erg'): Promise<TrainingInfo> {
  const params = format ? { format } : {};
  const response = await apiClient.get<TrainingInfo>('/oauth/training_info', { params });
  return response.data;
}

export async function listWorkouts(): Promise<Workout[]> {
  const response = await apiClient.get<{ success: boolean; workouts: Workout[] }>('/oauth/workouts');
  return response.data.workouts;
}

export async function listDefaultWorkouts(): Promise<Workout[]> {
  // This endpoint doesn't require authentication
  const response = await axios.get<{ success: boolean; workouts: Workout[] }>(
    `${XERT_BASE_URL}/oauth/workout`
  );
  return response.data.workouts;
}

export async function getWorkout(workoutId: string): Promise<WorkoutDetail> {
  const response = await apiClient.get<WorkoutDetail>(`/oauth/workout/${workoutId}`);
  return response.data;
}

export async function downloadWorkout(workoutId: string, format: 'zwo' | 'erg' = 'zwo'): Promise<string> {
  const response = await apiClient.get<string>(`/oauth/workout-download/${workoutId}.${format}`, {
    responseType: 'text',
  });
  return response.data;
}

export async function listActivities(from: number, to: number, updatedFrom?: number): Promise<ActivitySummary[]> {
  const params: Record<string, number> = { from, to };
  if (updatedFrom) {
    params.updated_from = updatedFrom;
  }

  const response = await apiClient.get<{ success: boolean; activities: ActivitySummary[] }>(
    '/oauth/activity',
    { params }
  );
  return response.data.activities;
}

export async function getActivity(activityId: string, includeSessionData = false): Promise<ActivityDetail> {
  const params = includeSessionData ? { include_session_data: 1 } : {};
  const response = await apiClient.get<ActivityDetail>(`/oauth/activity/${activityId}`, { params });
  return response.data;
}

export async function uploadFitFile(filePath: string, name?: string): Promise<UploadResponse> {
  const FormData = (await import('form-data')).default;
  const form = new FormData();

  form.append('file', fs.createReadStream(filePath));
  if (name) {
    form.append('name', name);
  }

  const response = await apiClient.post<UploadResponse>('/oauth/upload', form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

// Initialize tokens on module load
loadTokensFromEnv();
