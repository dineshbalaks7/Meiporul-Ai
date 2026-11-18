import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s for RAG LLM query processing
});

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  duplicateData?: {
    document_id: string;
    filename: string;
    status: string;
  };
}

export function parseApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string | { message?: string; existing_document?: any } }>;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    // Handle 409 Duplicate document response
    if (status === 409 && typeof data?.detail === 'object' && data.detail !== null) {
      return {
        message: data.detail.message || 'This document has already been uploaded.',
        statusCode: 409,
        duplicateData: data.detail.existing_document,
      };
    }

    if (data?.detail) {
      if (typeof data.detail === 'string') {
        return { message: data.detail, statusCode: status };
      }
      if (typeof data.detail === 'object' && 'message' in data.detail) {
        return { message: String(data.detail.message), statusCode: status };
      }
    }

    if (axiosError.code === 'ECONNABORTED') {
      return { message: 'The request timed out. Please try again.', statusCode: status };
    }

    if (!axiosError.response) {
      return {
        message: 'Unable to connect to Meiporul AI server. Please verify the backend is running.',
        statusCode: 0,
      };
    }

    return {
      message: axiosError.message || 'An unexpected error occurred.',
      statusCode: status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'An unknown error occurred.' };
}

export async function checkBackendHealth(): Promise<{ healthy: boolean; statusText: string }> {
  try {
    const res = await apiClient.get('/health', { timeout: 4000 });
    return {
      healthy: res.status === 200 && res.data?.status === 'healthy',
      statusText: res.data?.status || 'healthy',
    };
  } catch (err) {
    return {
      healthy: false,
      statusText: 'offline',
    };
  }
}
