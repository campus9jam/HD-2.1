import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Module 0: Google Analytics
export let analytics: any;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
      console.log("House of Daraja: Analytics node active.");
    }
  });
}

// Connectivity Fix for sandboxed environments: Experimental Long Polling
// We use a combination of settings that are known to work in restricted preview environments.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)');

// Module 1: Firebase App Check (Cryptographic Attestation)
// Disabled by default for development/sandbox stability unless specifically required
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !window.location.hostname.includes('ais-dev')) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'default_key'),
      isTokenAutoRefreshEnabled: true
    });
  } catch (e) {
    console.warn("App Check failed to initialize, continuing without it:", e);
  }
}

import { doc, getDocFromCache, getDocFromServer, enableNetwork, enableIndexedDbPersistence } from 'firebase/firestore';

// Enable Persistence for local cache indexing (Resilience)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore Persistence: Multiple tabs open, instance cached locally but persistence disabled.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore Persistence: Browser unsupported.');
    }
  });
}

async function testConnection() {
  try {
    // Attempt to proactively enable network just in case it was disabled by a failure
    await enableNetwork(db);
    
    // Force a server fetch to test connectivity accurately
    const serverPromise = getDocFromServer(doc(db, 'products', 'connection_test'));
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connectivity Timeout (15s)')), 15000));
    
    await Promise.race([serverPromise, timeoutPromise]);
    console.log("House of Daraja: Sovereign Data Link established.");
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('offline') || errorMessage.includes('reach Cloud Firestore') || errorMessage.includes('Timeout')) {
      console.error("Connectivity Protocol: Offline mode active. Operating using local archival cache.");
    } else if (error?.code === 'permission-denied') {
      // If we get permission denied, it actually means we ARE connected, just restricted
      console.log("House of Daraja: Sovereign Data Link verified (Protocol restricted).");
    } else {
      console.warn("Connection handshake unstable:", error);
    }
  }
}
testConnection();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
  }
}

import { logToSystem, LogLevel } from '../services/LoggerService';

export const handleFirestoreError = (error: any, op: FirestoreErrorInfo['operationType'], path: string | null = null) => {
  const info: FirestoreErrorInfo = {
    error: error?.message || 'Unknown Error',
    operationType: op,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || 'anonymous',
      email: auth.currentUser?.email || 'none',
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || true
    }
  };

  if (error?.code === 'permission-denied') {
    logToSystem(LogLevel.CRITICAL, `Firewall Breach Attempt: ${op} on ${path}`, info);
    throw new Error(JSON.stringify(info));
  }
  
  logToSystem(LogLevel.ERROR, `Database Breakdown: ${op} on ${path}`, info);
  throw error;
};
