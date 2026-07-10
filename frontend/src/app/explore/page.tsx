'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/contracts';
import { formatEther } from 'viem';
import { Compass, Search, Filter, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { getIPFSGatewayUrl } from '@/utils/ipfs';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Read campaigns from contract
  const { data: campaignsRaw, isPending } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCampaigns',
  });

  // Categories list (will query from contract if we want, but local array is faster and syncs with contract defaults)
  const categories = ['All', 'Technology', 'Art', 'Community', 'Charity', 'Fashion', 'Film'];

  const getStatusText = (status: number, deadline: bigint) => {
    const isDeadlinePassed = Number(deadline) * 1000 <= Date.now();
    if (status === 3) return 'Cancelled';
    if (status === 1) return 'Successful';
    if (status === 2) return 'Failed';
    if (status === 0) {
      return isDeadlinePassed ? 'Ended (Pending claim)' : 'Active';
    }
    return 'Unknown';
  };

  const campaigns = campaignsRaw ? (campaignsRaw as any[]).map((c, idx) => ({ ...c, id: idx })) : [];

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign: any) => {
    // 1. Search Query filter
    const matchesSearch = 
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category filter
    const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory;

    // 3. Status filter
    const isDeadlinePassed = Number(campaign.deadline) * 1000 <= Date.now();
    let matchesStatus = true;
    if (selectedStatus === 'Active') {
      matchesStatus = campaign.status === 0 && !isDeadlinePassed;
    } else if (selectedStatus === 'Ended') {
      matchesStatus = campaign.status === 1 || campaign.status === 2 || isDeadlinePassed || campaign.status === 3;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  }).reverse(); // Newest first

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <Compass className="h-9 w-9 text-[#F7931A]" />
            Explore Campaigns
          </h1>
          <p className="text-[#B8B8B8] mt-2.5 text-sm">Support innovative projects, creative arts, and community initiatives.</p>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#7C7C7C]" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-white/8 rounded-[12px] pl-12 pr-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#F7931A]/40 focus:border-[#F7931A] transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-4 flex items-center gap-2 bg-[#141414] border border-white/8 rounded-[12px] px-4 py-3.5">
          <Filter className="h-4 w-4 text-[#7C7C7C]" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent border-none text-[#B8B8B8] w-full focus:outline-none cursor-pointer text-sm"
          >
            <option value="All" className="bg-[#141414] text-[#B8B8B8]">All Statuses</option>
            <option value="Active" className="bg-[#141414] text-[#B8B8B8]">Active Only</option>
            <option value="Ended" className="bg-[#141414] text-[#B8B8B8]">Completed & Ended</option>
          </select>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-2.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-[12px] text-sm font-semibold transition-all duration-200 border ${
              selectedCategory === cat
                ? 'bg-[#F7931A]/10 border-[#F7931A]/40 text-[#F7931A]'
                : 'bg-[#141414]/40 border-white/8 hover:border-[#F7931A]/30 text-[#B8B8B8] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-grow">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-card rounded-[20px] h-[480px] animate-pulse" />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center bg-[#141414] rounded-[20px] p-20 text-center border border-dashed border-white/8 my-4">
          <Compass className="h-16 w-16 text-[#7C7C7C] mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Campaigns Found</h3>
          <p className="text-[#B8B8B8] max-w-sm text-sm">We couldn&apos;t find any campaigns matching your search filter or category selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredCampaigns.map((campaign: any) => {
            const progress = campaign.goal > 0n 
              ? Number((campaign.amountRaised * 100n) / campaign.goal) 
              : 0;

            const statusLabel = getStatusText(campaign.status, campaign.deadline);

            return (
              <Link 
                href={`/campaign/${campaign.id}`} 
                key={campaign.id} 
                className="glass-card rounded-[20px] overflow-hidden flex flex-col h-[480px] group"
              >
                {/* Image */}
                <div className="relative h-52 w-full bg-[#141414] overflow-hidden">
                  <img 
                    src={getIPFSGatewayUrl(campaign.imageHash, campaign.category)} 
                    alt={campaign.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#090909]/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#F7931A]">
                    {campaign.category}
                  </div>
                  {/* Status Badge */}
                  <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-[8px] backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 ${
                    statusLabel === 'Active' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : statusLabel === 'Successful'
                      ? 'bg-[#F7931A]/10 border-[#F7931A]/20 text-[#F7931A]'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {statusLabel === 'Active' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ) : statusLabel === 'Successful' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {statusLabel}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow bg-[#1B1B1B]">
                  <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-[#F7931A] transition-colors">
                    {campaign.title}
                  </h3>
                  <p className="text-[#B8B8B8] text-sm mt-3 line-clamp-2 leading-relaxed flex-grow">
                    {campaign.description}
                  </p>

                  {/* Progress details */}
                  <div className="mt-8 space-y-4">
                    <div className="w-full bg-[#090909] rounded-full h-2.5 overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-[#F7931A] to-[#FF8C00] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[#7C7C7C] uppercase font-semibold tracking-wider">Raised</p>
                        <p className="text-sm font-bold text-[#F7931A] mt-1">
                          {formatEther(campaign.amountRaised)} ETH
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#7C7C7C] uppercase font-semibold tracking-wider">Goal</p>
                        <p className="text-sm font-bold text-white mt-1">
                          {formatEther(campaign.goal)} ETH ({progress}%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
