import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeCrowdfund | Decentralized Crowdfunding Platform',
  description: 'Launch campaigns, raise funds securely, and manage contributions transparently using decentralized smart contracts on the Sepolia network.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.className} min-h-screen flex flex-col bg-slate-950 text-slate-100`}>
        <Providers>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          {/* Simple premium footer */}
          <footer className="border-t border-white/5 py-8 mt-auto backdrop-blur-sm bg-slate-950/40">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
              <p>&copy; {new Date().getFullYear()} DeCrowdfund. Built with Solidity, Hardhat, Next.js, and IPFS.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
