/**
 * Google Drive Sovereign Storage Service
 * Manages high-capacity archival of artifact media (4K videos, high-res photos).
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.readonly'
].join(' ');

import { driveLimiter } from '../lib/rateLimit';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Handshake with Google Identity Services for storage access.
 */
export const getAccessToken = async (): Promise<string> => {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('VITE_GOOGLE_CLIENT_ID not configured'));
      return;
    }

    try {
      driveLimiter.acquire(0.1).then(() => {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.access_token) {
              accessToken = response.access_token;
              tokenExpiry = Date.now() + (response.expires_in * 1000);
              resolve(accessToken!);
            } else {
              console.error('OAuth Response Error:', response);
              reject(new Error('Failed to get access token: ' + (response.error || 'User cancelled or unknown error')));
            }
          },
        });
        client.requestAccessToken();
      });
    } catch (error) {
      console.error('GIS initialization error:', error);
      reject(error);
    }
  });
};

/**
 * Helper for exponential backoff retries
 */
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  await driveLimiter.acquire(1);
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Only retry on rate limit (429) or server errors (5xx)
      if (error?.status !== 429 && !(error?.status >= 500)) {
        throw error;
      }
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn(`[Drive] Request failed. Retrying in ${Math.round(delay)}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

/**
 * Uploads a file to Google Drive with sovereign archival protocol.
 * Returns the file ID and metadata.
 */
export const uploadToDrive = async (file: File, folderId?: string) => {
  return withRetry(async () => {
    const token = await getAccessToken();
    
    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: folderId ? [folderId] : []
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    if (!response.ok) {
      const err = new Error('Failed to upload to Drive') as any;
      err.status = response.status;
      throw err;
    }

    return await response.json();
  });
};

/**
 * Opens the Google Picker to select existing archive nodes.
 */
export const openPicker = async (onSelect: (files: any[]) => void) => {
  const token = await getAccessToken();
  
  if (!(window as any).google) {
    throw new Error('Google Identity Services not loaded');
  }

  const picker = new (window as any).google.picker.PickerBuilder()
    .addView((window as any).google.picker.ViewId.DOCS)
    .setOAuthToken(token)
    .setDeveloperKey(API_KEY)
    .setCallback((data: any) => {
      if (data.action === (window as any).google.picker.Action.PICKED) {
        onSelect(data.docs);
      }
    })
    .build();
    
  picker.setVisible(true);
};
