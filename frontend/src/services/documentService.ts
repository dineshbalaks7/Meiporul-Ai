import { apiClient } from './api';
import {
  DocumentItem,
  DocumentListResponse,
  DocumentUploadResponse,
  DocumentDeleteResponse,
} from '../types/document';

export const documentService = {
  /**
   * Fetch all indexed documents
   */
  async getDocuments(): Promise<DocumentItem[]> {
    const response = await apiClient.get<DocumentListResponse>('/api/documents/');
    return response.data.documents || [];
  },

  /**
   * Upload and index a document (PDF, TXT, DOCX)
   */
  async uploadDocument(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<DocumentUploadResponse>(
      '/api/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );

    return response.data;
  },

  /**
   * Delete a document by ID
   */
  async deleteDocument(documentId: string): Promise<DocumentDeleteResponse> {
    const response = await apiClient.delete<DocumentDeleteResponse>(
      `/api/documents/${encodeURIComponent(documentId)}`
    );
    return response.data;
  },
};
