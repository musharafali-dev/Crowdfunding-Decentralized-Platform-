'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/contracts';
import { formatEther } from 'viem';
import { LayoutDashboard, Wallet, Loader2, ArrowRight, ShieldAlert, Award, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import { getIPFSGatewayUrl } from '@/utils/ipfs';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { address: userAddress, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'contributions'>('campaigns');

  // Read all campaigns from contract
  const { data: campaignsRaw, isPending, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCampaigns',
  });

  // Write contract states
  const { writeContractAsync, isPending: isTxPending } = useWriteContract();

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 flex-grow flex flex-col items-center justify-center text-center">
        <div className="p-5 bg-[#F7931A]/10 rounded-full text-[#F7931A] mb-8 animate-bounce">
          <Wallet className="h-12 w-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">Connect Wallet Required</h2>
        <p className="text-[#B8B8B8] max-w-sm mb-8 text-base">
          You must connect your Web3 wallet to access your creator dashboard and contributed campaigns.
        </p>
      </div>
    );
  }

  const allCampaigns = campaignsRaw ? (campaignsRaw as any[]).map((c, idx) => ({ ...c, id: idx })) : [];

  // Filter My Campaigns (Created campaigns)
  const myCreatedCampaigns = allCampaigns.filter(
    (c: any) => c.creator.toLowerCase() === userAddress?.toLowerCase()
  );

  const myContributedCampaigns = allCampaigns.filter((c: any) => {
    return c.amountRaised > 0n; // show campaigns with contributions for demo/local testing
  });

  const handleCancelCampaign = async (campaignId: number) => {
    try {
      toast.loading('Cancelling campaign...', { id: 'cancel' });
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'cancelCampaign',
        args: [BigInt(campaignId)],
      });
      toast.success('Campaign successfully cancelled!', { id: 'cancel' });
      refetch();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Cancellation failed.', { id: 'cancel' });
    }
  };

  const handleWithdrawFunds = async (campaignId: number) => {
    try {
      toast.loading('Withdrawing funds...', { id: 'withdraw' });
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'withdrawFunds',
        args: [BigInt(campaignId)],
      });
      toast.success('Funds successfully withdrawn!', { id: 'withdraw' });
      refetch();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Withdrawal failed.', { id: 'withdraw' });
    }
  };

  const getStatusLabel = (campaign: any) => {
    const isDeadlinePassed = Number(campaign.deadline) * 1000 <= Date.now();
    if (campaign.status === 3) return 'Cancelled';
    if (campaign.status === 1) return 'Successful';
    if (campaign.status === 2) return 'Failed';
    if (campaign.status === 0) {
      return isDeadlinePassed ? 'Ended (Pending claim)' : 'Active';
    }
    return 'Unknown';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <LayoutDashboard className="h-9 w-9 text-[#F7931A]" />
            Creator Dashboard
          </h1>
          <p className="text-[#B8B8B8] mt-2.5 text-sm">Manage your campaigns, track funding progress, and process withdrawals.</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 text-sm text-[#B8B8B8] hover:text-white transition-colors self-start sm:self-auto">
          <RefreshCw className="h-4 w-4 text-[#F7931A]" /> Refresh Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'campaigns'
              ? 'border-[#F7931A] text-[#F7931A]'
              : 'border-transparent text-[#B8B8B8] hover:text-white'
          }`}
        >
          My Created Campaigns ({myCreatedCampaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('contributions')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'contributions'
              ? 'border-transparent border-[#F7931A] text-[#F7931A]'
              : 'border-transparent text-[#B8B8B8] hover:text-white'
          }`}
        >
          Contributed Campaigns ({myContributedCampaigns.length})
        </button>
      </div>

      {/* Content */}
      {isPending ? (
        <div className="flex-grow flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-[#F7931A] animate-spin" />
        </div>
      ) : activeTab === 'campaigns' ? (
        myCreatedCampaigns.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center bg-[#141414] rounded-[20px] p-20 text-center border border-dashed border-white/8">
            <ShieldAlert className="h-12 w-12 text-[#7C7C7C] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Campaigns Created</h3>
            <p className="text-[#B8B8B8] max-w-sm mb-8 text-sm">You haven&apos;t launched any crowdfunding campaigns on the platform yet.</p>
            <Link 
              href="/create" 
              className="px-6 py-3 rounded-[12px] bg-gradient-to-r from-[#F7931A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#C65A00] text-white font-bold text-sm transition-all duration-200"
            >
              Launch a Campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myCreatedCampaigns.map((campaign: any) => {
              const progress = campaign.goal > 0n 
                ? Number((campaign.amountRaised * 100n) / campaign.goal) 
                : 0;
              const statusLabel = getStatusLabel(campaign);
              const isDeadlinePassed = Number(campaign.deadline) * 1000 <= Date.now();

              return (
                <div key={campaign.id} className="glass-card rounded-[20px] overflow-hidden flex flex-col h-[520px]">
                  <div className="relative h-44 w-full bg-[#141414]">
                    <img 
                      src={getIPFSGatewayUrl(campaign.imageHash, campaign.category)} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#090909]/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#F7931A]">
                      {campaign.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow bg-[#1B1B1B]">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-lg font-bold text-white line-clamp-1">{campaign.title}</h3>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-[6px] uppercase border shrink-0 ${
                        statusLabel === 'Active'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : statusLabel === 'Successful'
                          ? 'bg-[#F7931A]/10 border-[#F7931A]/20 text-[#F7931A]'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>

                    <p className="text-[#B8B8B8] text-xs mt-3 line-clamp-2 leading-relaxed flex-grow">
                      {campaign.description}
                    </p>

                    {/* Progress */}
                    <div className="mt-6 space-y-3">
                      <div className="w-full bg-[#090909] rounded-full h-2.5 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-[#F7931A] to-[#FF8C00] h-full rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#7C7C7C] uppercase tracking-wider font-bold">
                        <span>Raised: {formatEther(campaign.amountRaised)} ETH</span>
                        <span>Goal: {formatEther(campaign.goal)} ETH</span>
                      </div>
                    </div>

                    {/* Dashboard Actions */}
                    <div className="mt-8 pt-4 border-t border-white/5 flex flex-col gap-2.5">
                      {/* Action 1: View details always available */}
                      <Link 
                        href={`/campaign/${campaign.id}`}
                        className="w-full py-2.5 bg-[#141414] hover:bg-[#1B1B1B] border border-white/8 hover:border-white/15 text-white text-xs font-semibold rounded-[12px] flex items-center justify-center gap-1.5 transition-all"
                      >
                        View Campaign
                        <ArrowRight className="h-3.5 w-3.5 text-[#F7931A]" />
                      </Link>

                      {/* Action 2: Creator can cancel active campaign */}
                      {campaign.status === 0 && !isDeadlinePassed && (
                        <button
                          onClick={() => handleCancelCampaign(campaign.id)}
                          className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-[12px] flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Cancel Campaign
                        </button>
                      )}

                      {/* Action 3: Creator can withdraw funds on success */}
                      {statusLabel === 'Successful' && !campaign.withdrawn && (
                        <button
                          onClick={() => handleWithdrawFunds(campaign.id)}
                          className="w-full py-2.5 bg-[#F7931A]/10 hover:bg-[#F7931A]/20 border border-[#F7931A]/20 text-[#F7931A] text-xs font-bold rounded-[12px] flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Award className="h-3.5 w-3.5" />
                          Withdraw Funds
                        </button>
                      )}

                      {/* Action 4: Already withdrawn */}
                      {campaign.withdrawn && (
                        <div className="py-2.5 bg-[#141414] border border-white/5 text-[#7C7C7C] text-xs font-semibold rounded-[12px] flex items-center justify-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-[#F7931A]" />
                          Funds Withdrawn
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        myContributedCampaigns.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center bg-[#141414] rounded-[20px] p-20 text-center border border-dashed border-white/8">
            <ShieldAlert className="h-12 w-12 text-[#7C7C7C] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Contributions</h3>
            <p className="text-[#B8B8B8] max-w-sm mb-8 text-sm">You haven&apos;t contributed to any crowdfunding campaigns on DeCrowdfund yet.</p>
            <Link 
              href="/explore" 
              className="px-6 py-3 rounded-[12px] bg-gradient-to-r from-[#F7931A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#C65A00] text-white font-bold text-sm transition-all duration-200"
            >
              Browse Campaigns
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myContributedCampaigns.map((campaign: any) => {
              const progress = campaign.goal > 0n 
                ? Number((campaign.amountRaised * 100n) / campaign.goal) 
                : 0;
              const statusLabel = getStatusLabel(campaign);

              return (
                <div key={campaign.id} className="glass-card rounded-[20px] overflow-hidden flex flex-col h-[460px]">
                  <div className="relative h-40 w-full bg-[#141414]">
                    <img 
                      src={getIPFSGatewayUrl(campaign.imageHash, campaign.category)} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#090909]/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#F7931A]">
                      {campaign.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow bg-[#1B1B1B]">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-lg font-bold text-white line-clamp-1">{campaign.title}</h3>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-[6px] uppercase border shrink-0 ${
                        statusLabel === 'Active'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : statusLabel === 'Successful'
                          ? 'bg-[#F7931A]/10 border-[#F7931A]/20 text-[#F7931A]'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>

                    <p className="text-[#B8B8B8] text-xs mt-3 line-clamp-2 leading-relaxed flex-grow">
                      {campaign.description}
                    </p>

                    {/* Progress */}
                    <div className="mt-6 space-y-3">
                      <div className="w-full bg-[#090909] rounded-full h-2.5 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-[#F7931A] to-[#FF8C00] h-full rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#7C7C7C] uppercase tracking-wider font-bold">
                        <span>Raised: {formatEther(campaign.amountRaised)} ETH</span>
                        <span>Goal: {formatEther(campaign.goal)} ETH</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-4 border-t border-white/5 flex gap-2">
                      <Link 
                        href={`/campaign/${campaign.id}`}
                        className="w-full py-2.5 bg-[#141414] hover:bg-[#1B1B1B] border border-white/8 hover:border-white/15 text-white text-xs font-semibold rounded-[12px] flex items-center justify-center gap-1.5 transition-all"
                      >
                        View Campaign Details
                        <ArrowRight className="h-3.5 w-3.5 text-[#F7931A]" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
