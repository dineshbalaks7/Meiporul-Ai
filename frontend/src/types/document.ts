export interface DocumentItem {
  document_id: string;
  filename: string;
  file_type: string;
  total_chunks: number;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
}

export interface DocumentUploadResponse {
  message: string;
  document_id: string;
  filename: string;
  total_chunks: number;
  [key: string]: unknown;
}

export interface DuplicateDocumentInfo {
  document_id: string;
  filename: string;
  status: string;
}

export interface DuplicateErrorDetail {
  message: string;
  existing_document: DuplicateDocumentInfo;
}

export interface DocumentDeleteResponse {
  status: 'deleted' | 'not_found';
  document_id: string;
  deleted_chunks?: number;
  deleted_file?: boolean;
  message?: string;
}
