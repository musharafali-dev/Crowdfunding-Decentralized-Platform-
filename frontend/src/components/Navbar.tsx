'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X, Coins, Compass, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Create Campaign', href: '/create', icon: PlusCircle },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#090909]/80 border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-[#F7931A]/10 rounded-xl group-hover:bg-[#F7931A]/20 transition-all duration-300">
                <Coins className="h-7 w-7 text-[#F7931A] group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-amber-200 to-[#F7931A] bg-clip-text text-transparent tracking-tight">
                DeCrowdfund
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:text-[#F7931A] ${
                    isActive(item.href) ? 'text-[#F7931A]' : 'text-[#B8B8B8]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Wallet Connect Button */}
          <div className="hidden md:flex items-center">
            <ConnectButton 
              chainStatus="icon" 
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <ConnectButton 
              chainStatus="none" 
              showBalance={false}
              accountStatus="avatar"
            />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-[#B8B8B8] hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#141414] border-b border-white/5">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-[#F7931A]/10 text-[#F7931A]'
                      : 'text-[#B8B8B8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
