import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    // Relative or short date formatting
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatScore(score?: number | null): string {
  if (score === null || score === undefined) return '';
  if (score >= 0 && score <= 1) {
    const percentage = Math.round(score * 100);
    return `${percentage}% relevance`;
  }
  return `${score > 0 ? '+' : ''}${score.toFixed(2)} score`;
}

export function cleanDocumentName(filename: string): string {
  if (!filename) return 'Document';
  // If it has path or extra info, take the base filename
  const clean = filename.split(/[/\\]/).pop() || filename;
  return clean;
}
