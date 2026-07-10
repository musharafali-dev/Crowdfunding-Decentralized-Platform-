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
          accentColor: '#F7931A', // Bitcoin Orange
          accentColorForeground: 'white',
          borderRadius: 'large',
          overlayBlur: 'small',
        })}>
          {children}
          <Toaster 
            position="top-right" 
            toastOptions={{ 
              style: { 
                background: '#1B1B1B', 
                color: '#FFFFFF', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                fontSize: '14px',
              } 
            }} 
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
