'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';
import { Toaster } from 'react-hot-toast';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#06b6d4', // Cyan-500
          accentColorForeground: 'white',
          borderRadius: 'large',
          overlayBlur: 'small',
        })}>
          {children}
          <Toaster 
            position="top-right" 
            toastOptions={{ 
              style: { 
                background: '#0a0f1e', 
                color: '#f8fafc', 
                border: '1px solid rgba(6, 182, 212, 0.15)',
                borderRadius: '16px',
                fontSize: '14px',
              } 
            }} 
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
