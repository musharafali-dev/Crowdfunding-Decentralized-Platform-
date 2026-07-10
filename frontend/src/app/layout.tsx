import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#090909] text-white`}>
        <Providers>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          {/* Simple premium footer */}
          <footer className="border-t border-white/5 py-12 mt-auto bg-[#141414]">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#7C7C7C]">
              <p>&copy; {new Date().getFullYear()} DeCrowdfund. Built with Solidity, Hardhat, Next.js, and IPFS.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
