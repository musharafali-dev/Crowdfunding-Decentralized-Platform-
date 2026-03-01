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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow flex flex-col">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-2">
            <Compass className="h-9 w-9 text-cyan-400" />
            Explore Campaigns
          </h1>
          <p className="text-slate-400 mt-2">Support innovative projects, creative arts, and community initiatives.</p>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent border-none text-slate-300 w-full focus:outline-none cursor-pointer text-sm"
          >
            <option value="All" className="bg-slate-950 text-slate-300">All Statuses</option>
            <option value="Active" className="bg-slate-950 text-slate-300">Active Only</option>
            <option value="Ended" className="bg-slate-950 text-slate-300">Completed & Ended</option>
          </select>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
              selectedCategory === cat
                ? 'bg-cyan-500/10 border-indigo-500/50 text-cyan-400 font-semibold'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-card rounded-2xl h-[420px] animate-pulse" />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center glass-panel rounded-2xl p-16 text-center border border-dashed border-slate-800 my-8">
          <Compass className="h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Campaigns Found</h3>
          <p className="text-slate-400 max-w-sm">We couldn&apos;t find any campaigns matching your search filter or category selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign: any) => {
            const progress = campaign.goal > 0n 
              ? Number((campaign.amountRaised * 100n) / campaign.goal) 
              : 0;

            const isPassed = Number(campaign.deadline) * 1000 <= Date.now();
            const statusLabel = getStatusText(campaign.status, campaign.deadline);

            return (
              <Link 
                href={`/campaign/${campaign.id}`} 
                key={campaign.id} 
                className="glass-card rounded-2xl overflow-hidden flex flex-col h-[450px] group"
              >
                {/* Image */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img 
                    src={getIPFSGatewayUrl(campaign.imageHash, campaign.category)} 
                    alt={campaign.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-cyan-300">
                    {campaign.category}
                  </div>
                  {/* Status Badge */}
                  <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-lg backdrop-blur-md border text-xs font-semibold flex items-center gap-1.5 ${
                    statusLabel === 'Active' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : statusLabel === 'Successful'
                      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
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
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                    {campaign.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed flex-grow">
                    {campaign.description}
                  </p>

                  {/* Progress details */}
                  <div className="mt-6 space-y-4">
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <p className="text-slate-500 uppercase font-medium tracking-wider">Raised</p>
                        <p className="text-sm font-semibold text-cyan-400 mt-0.5">
                          {formatEther(campaign.amountRaised)} ETH
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 uppercase font-medium tracking-wider">Goal</p>
                        <p className="text-sm font-semibold text-slate-300 mt-0.5">
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
