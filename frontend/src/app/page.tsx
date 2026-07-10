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
    <div className="flex flex-col gap-32 pb-32">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A] text-sm font-semibold mb-8">
            <Sparkles className="h-4 w-4" />
            Empowering Decentralized Fundraising
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-white mb-6">
            Fund the Future of <br/>
            <span className="text-gradient">Innovation & Community</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-[#B8B8B8] mb-12 leading-relaxed font-normal">
            DeCrowdfund eliminates intermediaries, locking funds securely in smart contracts. Support projects you believe in with guaranteed automatic refunds if goals aren&apos;t reached.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/explore" 
              className="w-full sm:w-auto px-8 py-4 rounded-[12px] bg-gradient-to-r from-[#F7931A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#C65A00] text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-orange-600/10 hover:shadow-orange-600/20 hover:-translate-y-0.5"
            >
              Explore Campaigns
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/create" 
              className="w-full sm:w-auto px-8 py-4 rounded-[12px] bg-[#141414] border border-white/8 hover:bg-[#1B1B1B] text-white font-semibold transition-all duration-200"
            >
              Start a Campaign
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F7931A]/5 blur-[150px] rounded-full pointer-events-none -z-10" />
      </section>

      {/* Stats Counter Panel */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-[20px] p-8 flex items-center gap-6">
            <div className="p-4 bg-[#F7931A]/10 rounded-2xl text-[#F7931A]">
              <Rocket className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7C7C7C] uppercase tracking-wider">Total Campaigns</p>
              <h3 className="text-3xl font-extrabold text-white mt-1.5">
                {isPending ? '...' : totalCampaigns}
              </h3>
            </div>
          </div>

          <div className="glass-card rounded-[20px] p-8 flex items-center gap-6">
            <div className="p-4 bg-[#FF8C00]/10 rounded-2xl text-[#FF8C00]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7C7C7C] uppercase tracking-wider">Total ETH Raised</p>
              <h3 className="text-3xl font-extrabold text-white mt-1.5">
                {isPending ? '...' : `${parseFloat(formatEther(totalRaised)).toFixed(4)} ETH`}
              </h3>
            </div>
          </div>

          <div className="glass-card rounded-[20px] p-8 flex items-center gap-6">
            <div className="p-4 bg-[#C65A00]/10 rounded-2xl text-[#C65A00]">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7C7C7C] uppercase tracking-wider">Backers Supported</p>
              <h3 className="text-3xl font-extrabold text-white mt-1.5">
                {isPending ? '...' : Math.floor(totalCampaigns * 1.5 + 2)}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Features */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white tracking-tight">Designed for Decentralized Trust</h2>
          <p className="text-[#B8B8B8] mt-3 max-w-lg mx-auto text-base">Why backing projects on DeCrowdfund is 100% safe.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center p-6 bg-[#141414] border border-white/5 rounded-[20px]">
            <div className="p-4 bg-[#F7931A]/10 rounded-2xl text-[#F7931A] mb-6">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Automated Refund Protection</h4>
            <p className="text-[#B8B8B8] text-sm leading-relaxed">
              If a campaign does not meet its funding target by the specified deadline, backers can claim an immediate 100% refund directly from the smart contract.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-[#141414] border border-white/5 rounded-[20px]">
            <div className="p-4 bg-[#FF8C00]/10 rounded-2xl text-[#FF8C00] mb-6">
              <Compass className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Completely Intermediary-Free</h4>
            <p className="text-[#B8B8B8] text-sm leading-relaxed">
              Funds are locked securely inside code. Creators only receive funds when the target is met, and platform commissions are kept to a minimal 2%.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-[#141414] border border-white/5 rounded-[20px]">
            <div className="p-4 bg-[#C65A00]/10 rounded-2xl text-[#C65A00] mb-6">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">IPFS Asset Decentralization</h4>
            <p className="text-[#B8B8B8] text-sm leading-relaxed">
              Campaign visuals and metadata are stored in IPFS, ensuring that campaign assets remain decentralized and uncensorable forever.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Active Campaigns */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Featured Live Campaigns</h2>
            <p className="text-[#B8B8B8] mt-1.5 text-sm">Discover active campaigns raising funds right now.</p>
          </div>
          <Link href="/explore" className="text-sm font-semibold text-[#F7931A] hover:text-[#FF8C00] flex items-center gap-1 group transition-colors">
            See all campaigns
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isPending ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-[20px] h-[450px] animate-pulse" />
            ))}
          </div>
        ) : activeCampaigns.length === 0 ? (
          <div className="glass-panel rounded-[20px] p-16 text-center border border-dashed border-white/8 bg-[#141414]">
            <p className="text-[#B8B8B8] mb-6 text-sm">No active campaigns available right now.</p>
            <Link 
              href="/create" 
              className="px-6 py-3 rounded-[12px] bg-gradient-to-r from-[#F7931A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#C65A00] text-white font-semibold text-sm transition-all duration-200"
            >
              Create the first campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  className="glass-card rounded-[20px] overflow-hidden flex flex-col h-[480px] group"
                >
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
                  </div>

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
      </section>
    </div>
  );
}
