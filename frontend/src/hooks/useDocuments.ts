import { useState, useEffect, useCallback, useMemo } from 'react';
import { documentService } from '../services/documentService';
import { DocumentItem, DocumentUploadResponse } from '../types/document';
import { parseApiError } from '../services/api';
import { useToast } from '../components/ui/Toast';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const { success, error: toastError, warning } = useToast();

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      toastError('Failed to load documents', parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(
    async (file: File): Promise<DocumentUploadResponse | null> => {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const result = await documentService.uploadDocument(file, (percent) => {
          setUploadProgress(percent);
        });

        success(
          'Document uploaded successfully',
          `"${result.filename}" indexed into ${result.total_chunks} chunks.`
        );

        await fetchDocuments();
        return result;
      } catch (err) {
        const parsed = parseApiError(err);

        if (parsed.statusCode === 409 && parsed.duplicateData) {
          warning(
            'Duplicate Document',
            `"${parsed.duplicateData.filename}" has already been uploaded previously.`,
            {
              label: 'Select Document',
              onClick: () => setSelectedDocumentId(parsed.duplicateData!.document_id),
            }
          );
        } else {
          toastError('Upload failed', parsed.message);
        }
        return null;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [fetchDocuments, success, toastError, warning]
  );

  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      try {
        await documentService.deleteDocument(documentId);
        success('Document deleted', 'The document and its chunks were removed.');

        // If the deleted document was currently selected, reset scope
        if (selectedDocumentId === documentId) {
          setSelectedDocumentId(null);
        }

        await fetchDocuments();
        return true;
      } catch (err) {
        const parsed = parseApiError(err);
        toastError('Failed to delete document', parsed.message);
        return false;
      }
    },
    [fetchDocuments, selectedDocumentId, success, toastError]
  );

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((doc) =>
      doc.filename.toLowerCase().includes(q) || doc.file_type.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  return {
    documents,
    filteredDocuments,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    searchQuery,
    setSearchQuery,
    selectedDocumentId,
    setSelectedDocumentId,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
}
