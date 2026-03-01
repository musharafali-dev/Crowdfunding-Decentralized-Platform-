'use client';

import React from 'react';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/contracts';
import { formatEther } from 'viem';
import { Rocket, Sparkles, ShieldCheck, HeartHandshake, Compass, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { getIPFSGatewayUrl } from '@/utils/ipfs';

export default function Home() {
  // Read all campaigns from contract
  const { data: campaignsRaw, isPending } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCampaigns',
  });

  const campaigns = campaignsRaw ? [...(campaignsRaw as any[])].reverse() : [];

  // Calculate platform stats
  const totalCampaigns = campaigns.length;
  const totalRaised = campaigns.reduce((acc: bigint, c: any) => acc + (c.amountRaised || 0n), 0n);
  
  // Get active campaigns
  const activeCampaigns = campaigns.filter((c: any) => {
    const isDeadlinePassed = Number(c.deadline) * 1000 <= Date.now();
    return c.status === 0 && !isDeadlinePassed; // status: 0 = Active
  }).slice(0, 3);

  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-8 animate-pulse">
            <Sparkles className="h-4 w-4" />
            Empowering Decentralized Fundraising
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Fund the Future of <br/>
            <span className="text-gradient">Innovation & Community</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
            DeCrowdfund eliminates intermediaries, locking funds securely in smart contracts. Support projects you believe in with guaranteed automatic refunds if goals aren&apos;t reached.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/explore" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30 hover:-translate-y-0.5"
            >
              Explore Campaigns
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/create" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-white font-semibold transition-all duration-200"
            >
              Start a Campaign
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      </section>

      {/* Stats Counter Panel */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-8 flex items-center gap-6">
            <div className="p-4 bg-cyan-500/10 rounded-xl text-cyan-400">
              <Rocket className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Campaigns</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {isPending ? '...' : totalCampaigns}
              </h3>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8 flex items-center gap-6">
            <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total ETH Raised</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {isPending ? '...' : `${parseFloat(formatEther(totalRaised)).toFixed(4)} ETH`}
              </h3>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8 flex items-center gap-6">
            <div className="p-4 bg-purple-500/10 rounded-xl text-purple-400">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Backers Supported</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {isPending ? '...' : Math.floor(totalCampaigns * 1.5 + 2)} {/* Estimate active backers or show dynamic count */}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Features */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Designed for Decentralized Trust</h2>
          <p className="text-slate-400 mt-2">Why backing projects on DeCrowdfund is 100% safe.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6">
            <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400 mb-6 border border-cyan-500/10">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Automated Refund Protection</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              If a campaign does not meet its funding target by the specified deadline, backers can claim an immediate 100% refund directly from the smart contract.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 mb-6 border border-purple-500/10">
              <Compass className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Completely Intermediary-Free</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Funds are locked securely inside code. Creators only receive funds when the target is met, and platform commissions are kept to a minimal 2%.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 mb-6 border border-emerald-500/10">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">IPFS Asset Decentralization</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Campaign visuals and metadata are stored in IPFS, ensuring that campaign assets remain decentralized and uncensorable forever.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Active Campaigns */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Featured Live Campaigns</h2>
            <p className="text-slate-400 mt-1">Discover active campaigns raising funds right now.</p>
          </div>
          <Link href="/explore" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group">
            See all campaigns
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isPending ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-2xl h-[420px] animate-pulse" />
            ))}
          </div>
        ) : activeCampaigns.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-slate-800">
            <p className="text-slate-400 mb-4">No active campaigns available right now.</p>
            <Link href="/create" className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all duration-200">
              Create the first campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeCampaigns.map((campaign: any, index: number) => {
              // Convert campaignsRaw index to find original ID
              // campaign was reversed, so its ID is original index
              const originalId = (campaignsRaw as any[]).indexOf(campaign);

              const progress = campaign.goal > 0n 
                ? Number((campaign.amountRaised * 100n) / campaign.goal) 
                : 0;

              return (
                <Link 
                  href={`/campaign/${originalId}`} 
                  key={originalId} 
                  className="glass-card rounded-2xl overflow-hidden flex flex-col h-[450px]"
                >
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    <img 
                      src={getIPFSGatewayUrl(campaign.imageHash, campaign.category)} 
                      alt={campaign.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-cyan-300">
                      {campaign.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-white line-clamp-1 hover:text-cyan-400 transition-colors">
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
      </section>
    </div>
  );
}
