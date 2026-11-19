import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDoc,
  writeBatch,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import { BookmarkItem, BrowserHistoryItem } from '../types';

export interface FirebaseSyncConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

const envConfig: FirebaseSyncConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export const isFirebaseConfigured = (): boolean => {
  return Boolean(envConfig.apiKey && envConfig.projectId);
};

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(envConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!auth && isFirebaseConfigured()) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      auth = getAuth(firebaseApp);
      // Ensure persistent login across sessions
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('[FirebaseSync] Could not set persistent auth:', err);
      });
    }
  }
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  if (!db && isFirebaseConfigured()) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      db = getFirestore(firebaseApp);
    }
  }
  return db;
}

// ---------------------------------------------------------------------------
// Authentication Helpers
// ---------------------------------------------------------------------------

export async function loginAnonymously(): Promise<User | null> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) return null;
  const credential = await signInAnonymously(authInstance);
  return credential.user;
}

export async function loginWithGoogle(): Promise<User | null> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) return null;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User | null> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) return null;
  const result = await signInWithEmailAndPassword(authInstance, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User | null> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) return null;
  const result = await createUserWithEmailAndPassword(authInstance, email, pass);
  return result.user;
}

export async function logout(): Promise<void> {
  const authInstance = getFirebaseAuth();
  if (authInstance) {
    await signOut(authInstance);
  }
}

export function onAuthStateChange(callback: (user: User | null) => void): Unsubscribe {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(authInstance, callback);
}

export function getCurrentUser(): User | null {
  const authInstance = getFirebaseAuth();
  return authInstance?.currentUser || null;
}

// ---------------------------------------------------------------------------
// Firestore Sync: Bookmarks (users/{uid}/bookmarks)
// ---------------------------------------------------------------------------

export async function syncBookmarkToFirestore(uid: string, bookmark: BookmarkItem): Promise<void> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid || !bookmark.id) return;

  const bookmarkRef = doc(firestore, 'users', uid, 'bookmarks', bookmark.id);
  await setDoc(bookmarkRef, {
    ...bookmark,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function deleteBookmarkFromFirestore(uid: string, bookmarkId: string): Promise<void> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid || !bookmarkId) return;

  const bookmarkRef = doc(firestore, 'users', uid, 'bookmarks', bookmarkId);
  await deleteDoc(bookmarkRef);
}

export async function fetchBookmarksFromFirestore(uid: string): Promise<BookmarkItem[]> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid) return [];

  const bookmarksCol = collection(firestore, 'users', uid, 'bookmarks');
  const snapshot = await getDocs(bookmarksCol);
  const results: BookmarkItem[] = [];
  snapshot.forEach((d) => {
    results.push(d.data() as BookmarkItem);
  });
  return results;
}

export function subscribeToBookmarks(uid: string, onUpdate: (bookmarks: BookmarkItem[]) => void): Unsubscribe {
  const firestore = getFirebaseDb();
  if (!firestore || !uid) {
    return () => {};
  }

  const bookmarksCol = collection(firestore, 'users', uid, 'bookmarks');
  return onSnapshot(bookmarksCol, (snapshot) => {
    const list: BookmarkItem[] = [];
    snapshot.forEach((d) => list.push(d.data() as BookmarkItem));
    onUpdate(list);
  }, (err) => {
    console.warn('[FirebaseSync] Bookmarks snapshot error:', err);
  });
}

export async function batchSyncBookmarks(uid: string, bookmarks: BookmarkItem[]): Promise<void> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid || bookmarks.length === 0) return;

  const batch = writeBatch(firestore);
  for (const b of bookmarks) {
    if (!b.id) continue;
    const ref = doc(firestore, 'users', uid, 'bookmarks', b.id);
    batch.set(ref, { ...b, updatedAt: new Date().toISOString() }, { merge: true });
  }
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Firestore Sync: Browsing History (users/{uid}/history)
// ---------------------------------------------------------------------------

export async function syncHistoryItemToFirestore(uid: string, item: BrowserHistoryItem): Promise<void> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid || !item.id) return;

  const historyRef = doc(firestore, 'users', uid, 'history', item.id);
  await setDoc(historyRef, {
    ...item,
    syncedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function deleteHistoryItemFromFirestore(uid: string, itemId: string): Promise<void> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid || !itemId) return;

  const historyRef = doc(firestore, 'users', uid, 'history', itemId);
  await deleteDoc(historyRef);
}

export async function clearHistoryInFirestore(uid: string): Promise<void> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid) return;

  const historyCol = collection(firestore, 'users', uid, 'history');
  const snapshot = await getDocs(historyCol);
  const batch = writeBatch(firestore);
  snapshot.forEach((d) => {
    batch.delete(d.ref);
  });
  await batch.commit();
}

export async function fetchHistoryFromFirestore(uid: string): Promise<BrowserHistoryItem[]> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid) return [];

  const historyCol = collection(firestore, 'users', uid, 'history');
  const snapshot = await getDocs(historyCol);
  const results: BrowserHistoryItem[] = [];
  snapshot.forEach((d) => {
    results.push(d.data() as BrowserHistoryItem);
  });
  return results;
}

export function subscribeToHistory(uid: string, onUpdate: (history: BrowserHistoryItem[]) => void): Unsubscribe {
  const firestore = getFirebaseDb();
  if (!firestore || !uid) {
    return () => {};
  }

  const historyCol = collection(firestore, 'users', uid, 'history');
  return onSnapshot(historyCol, (snapshot) => {
    const list: BrowserHistoryItem[] = [];
    snapshot.forEach((d) => list.push(d.data() as BrowserHistoryItem));
    onUpdate(list);
  }, (err) => {
    console.warn('[FirebaseSync] History snapshot error:', err);
  });
}

// ---------------------------------------------------------------------------
// Firestore Sync: Settings (users/{uid}/settings)
// ---------------------------------------------------------------------------

export async function syncSettingsToFirestore(uid: string, settings: Record<string, any>): Promise<void> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid) return;

  const settingsDocRef = doc(firestore, 'users', uid, 'settings', 'preferences');
  await setDoc(settingsDocRef, {
    ...settings,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function fetchSettingsFromFirestore(uid: string): Promise<Record<string, any> | null> {
  const firestore = getFirebaseDb();
  if (!firestore || !uid) return null;

  const settingsDocRef = doc(firestore, 'users', uid, 'settings', 'preferences');
  const snapshot = await getDoc(settingsDocRef);
  if (snapshot.exists()) {
    return snapshot.data() as Record<string, any>;
  }
  return null;
}

export function subscribeToSettings(uid: string, onUpdate: (settings: Record<string, any>) => void): Unsubscribe {
  const firestore = getFirebaseDb();
  if (!firestore || !uid) {
    return () => {};
  }

  const settingsDocRef = doc(firestore, 'users', uid, 'settings', 'preferences');
  return onSnapshot(settingsDocRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as Record<string, any>);
    }
  }, (err) => {
    console.warn('[FirebaseSync] Settings snapshot error:', err);
  });
}
