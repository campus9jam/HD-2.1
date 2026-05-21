import { Dropbox } from 'dropbox';
import { driveLimiter } from '../lib/rateLimit';

/**
 * Dropbox Sovereign Storage Service
 * Manages high-capacity archival of artifact media.
 */

const CLIENT_ID = import.meta.env.VITE_DROPBOX_APP_KEY;

// Note: For client-side apps, we typically use the Dropbox Chooser for selection
// and pre-authorized access tokens or temporary links for uploads.

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
      if (error?.status !== 429 && !(error?.status >= 500)) {
        throw error;
      }
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn(`[Dropbox] Request failed. Retrying in ${Math.round(delay)}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

/**
 * Selection Protocol using Dropbox Chooser
 * requires https://www.dropbox.com/static/api/2/dropins.js
 */
export const openPicker = async (onSelect: (files: any[]) => void) => {
  if (!(window as any).Dropbox) {
    // Dynamically load Dropbox script if not present
    const script = document.createElement('script');
    script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
    script.id = 'dropboxjs';
    script.setAttribute('data-app-key', CLIENT_ID || '');
    document.body.appendChild(script);
    
    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }

  (window as any).Dropbox.choose({
    success: (files: any[]) => {
      // Map Dropbox files to a format compatible with the app's existing logic
      const mappedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        webViewLink: file.link,
        webContentLink: file.link, // Dropbox direct links differ but this satisfies the interface
        iconUrl: file.icon,
        size: file.bytes
      }));
      onSelect(mappedFiles);
    },
    cancel: () => {
      console.log('Dropbox Chooser cancelled');
    },
    linkType: 'preview', // or 'direct'
    multiselect: true,
  });
};

/**
 * Uploads a file to Dropbox.
 * Since client-side uploads to Dropbox usually require a user access token, 
 * we'll assume a pattern where we might use an API route or a pre-configured token.
 * For this implementation, we'll suggest using an Access Token from environment.
 */
export const uploadToDropbox = async (file: File) => {
  return withRetry(async () => {
    // In a real production app, we'd use a server-side proxy to keep keys safe
    // or a short-lived user token. 
    const ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;
    
    if (!ACCESS_TOKEN) {
      throw new Error('VITE_DROPBOX_ACCESS_TOKEN not configured');
    }

    const dbx = new Dropbox({ accessToken: ACCESS_TOKEN });
    
    const response = await dbx.filesUpload({
      path: `/${file.name}`,
      contents: file,
      mode: { '.tag': 'overwrite' }
    });

    // To get a link similar to Drive's webViewLink
    const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: response.result.path_display || `/${file.name}`
    });

    return {
      id: response.result.id,
      name: response.result.name,
      webViewLink: linkResponse.result.url,
      webContentLink: linkResponse.result.url.replace('?dl=0', '?dl=1')
    };
  });
};
