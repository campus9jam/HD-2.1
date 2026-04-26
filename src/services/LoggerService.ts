import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface SystemLog {
  level: LogLevel;
  message: string;
  context: any;
  timestamp: any;
  userId: string | null;
  userAgent: string;
  url: string;
}

export const logToSystem = async (level: LogLevel, message: string, context: any = {}) => {
  try {
    const userId = auth.currentUser?.uid || null;
    const logEntry: SystemLog = {
      level,
      message,
      context,
      timestamp: serverTimestamp(),
      userId,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console for dev visibility
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      console.error(`[SYSTEM_${level.toUpperCase()}] ${message}`, context);
    } else {
      console.log(`[SYSTEM_${level.toUpperCase()}] ${message}`, context);
    }

    // Only persist errors and criticals to Firestore to save quota
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      await addDoc(collection(db, 'system_logs'), logEntry);
    }
  } catch (err) {
    // Fail silently to avoid infinite loops if logging itself fails
    console.warn("Telemetry failure:", err);
  }
};
