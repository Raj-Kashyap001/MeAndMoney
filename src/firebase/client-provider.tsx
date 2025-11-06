
'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// This function should only be called on the client side.
function initializeFirebaseClient(): FirebaseServices {
  if (getApps().length === 0) {
    // Ensure all config values are present before initializing
    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.authDomain ||
      !firebaseConfig.projectId
    ) {
      // This will be caught by the error boundary and show a user-friendly message.
      throw new Error(
        'Firebase configuration is missing. Please check your environment variables.'
      );
    }
    const app = initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  } else {
    const app = getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }
}

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // This effect runs only on the client-side after the component mounts.
    try {
      const firebaseServices = initializeFirebaseClient();
      setServices(firebaseServices);
    } catch (err: any) {
      console.error('Firebase initialization error:', err);
      setError(err);
    }
  }, []);

  if (error) {
    // You can render a more specific error UI here if needed
    return <div>Error initializing Firebase: {error.message}</div>;
  }
  
  if (!services) {
    // You can return a loading spinner or null while Firebase is initializing.
    // This prevents children from trying to access Firebase services before they are ready.
    return null; 
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
