'use client';

import { SessionProvider } from 'next-auth/react';
import { GeneratorProvider } from '@/context/GeneratorContext';
import { UserProvider } from '@/context/UserContext';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <UserProvider>
        <GeneratorProvider>
          {children}
        </GeneratorProvider>
      </UserProvider>
    </SessionProvider>
  );
}