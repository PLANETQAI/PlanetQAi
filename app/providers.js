'use client';

import { GeneratorProvider } from '@/context/GeneratorContext';
import { UserProvider } from '@/context/UserContext';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <UserProvider>
        <GeneratorProvider>
          <WebSocketProvider>
            {children}
            </WebSocketProvider>
        </GeneratorProvider>
      </UserProvider>
    </SessionProvider>
  );
}