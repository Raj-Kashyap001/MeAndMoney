
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [currency, setCurrency] = useState('USD');
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (userProfile?.currency) {
      setCurrency(userProfile.currency);
    }
  }, [userProfile]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isLoading: isProfileLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

    