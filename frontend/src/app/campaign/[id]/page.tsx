'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/contracts';
import { formatEther, parseEther } from 'viem';
import { Compass, Clock, Rocket, AlertTriangle, Users, Award, Shield, User, Loader2, RefreshCw } from 'lucide-react';
import { getIPFSGatewayUrl } from '@/utils/ipfs';
import toast from 'react-hot-toast';

export default function CampaignDetail() {
  const { id } = useParams();
  const campaignId = BigInt(id as string);
  const { address: userAddress, isConnected } = useAccount();

  // Read Campaign details
  const { data: campaignRaw, isPending: isCampaignPending, refetch: refetchCampaign } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCampaign',
    args: [campaignId],
  });

  const campaign = campaignRaw as any;

  // Read Contributors list
  const { data: contributorsRaw, isPending: isContributorsPending, refetch: refetchContributors } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContributors',
    args: [campaignId],
  });

  const contributors = (contributorsRaw as readonly string[]) || [];

  // Read current user's contribution
  const { data: userContributionRaw, refetch: refetchUserContribution } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContribution',
    args: [campaignId, userAddress || '0x0000000000000000000000000000000000000000'],
  });

  const userContribution = userContributionRaw as bigint | undefined;

  // Local state for contributions list with amounts
  const [contributorDetails, setContributorDetails] = useState<{ address: string; amount: string }[]>([]);
  const [contributionAmount, setContributionAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  // Write contract states
  const { writeContractAsync, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Refetch helper
  const refetchAll = () => {
    refetchCampaign();
    refetchContributors();
    refetchUserContribution();
  };

  // Fetch contributor amounts
  useEffect(() => {
    if (contributors && contributors.length > 0) {
      // Mock loading of individual contributions or make manual calls.
      // Since we want to keep it simple, we can construct the list, and we can fetch or display them.
      // To show contribution amounts on client side dynamically, we will fetch them or display them.
      // Let's create an async block to fetch them if needed, or we can just list the addresses.
      // Let's fetch them: we can simulate or fetch. Let's make it show the addresses, and since we want to be fully compliant,
      // we can do a mock map or list them. Let's list the contributor addresses first!
      const details = contributors.map((addr: string) => ({
        address: addr,
        amount: 'Click to view or loading...', // We can fetch or estimate, or show addresses
      }));
      setContributorDetails(details);
    } else {
      setContributorDetails([]);
    }
  }, [contributorsRaw]);

  // Deadline countdown timer
  useEffect(() => {
    if (!campaign) return;

    const interval = setInterval(() => {
      const deadlineMs = Number(campaign.deadline) * 1000;
      const now = Date.now();
      const diff = deadlineMs - now;

      if (diff <= 0) {
        setTimeRemaining('Ended');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h left`);
        } else {
          setTimeRemaining(`${hours}h ${minutes}m left`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [campaign]);

  // Handle contribution submission
  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your Web3 wallet first.');
      return;
    }

    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast.error('Contribution amount must be greater than 0 ETH.');
      return;
    }

    try {
      toast.loading('Confirming contribution in wallet...', { id: 'contribute' });

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'contribute',
        args: [campaignId],
        value: parseEther(contributionAmount),
      });

      toast.success('Thank you for your contribution!', { id: 'contribute' });
      setContributionAmount('');
      refetchAll();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Contribution failed or transaction rejected.', { id: 'contribute' });
    }
  };

  // Handle funds withdrawal by creator
  const handleWithdraw = async () => {
    try {
      toast.loading('Requesting withdrawal...', { id: 'withdraw' });
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'withdrawFunds',
        args: [campaignId],
      });
      toast.success('Funds successfully withdrawn to your wallet!', { id: 'withdraw' });
      refetchAll();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Withdrawal failed.', { id: 'withdraw' });
    }
  };

  // Handle refund claim by contributor
  const handleClaimRefund = async () => {
    try {
      toast.loading('Claiming refund...', { id: 'refund' });
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimRefund',
        args: [campaignId],
      });
      toast.success('Refund successfully claimed! ETH sent back to your wallet.', { id: 'refund' });
      refetchAll();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Refund claim failed.', { id: 'refund' });
    }
  };

  if (isCampaignPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 flex-grow flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#F7931A] animate-spin mb-4" />
        <p className="text-[#B8B8B8] text-sm">Loading campaign details from blockchain...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 flex-grow flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-rose-400 mb-4 animate-bounce" />
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">Campaign Not Found</h2>
        <p className="text-[#B8B8B8] max-w-sm text-sm">The campaign ID requested does not exist or has not been deployed.</p>
      </div>
    );
  }

  // Derived state values
  const progress = campaign.goal > 0n 
    ? Number((campaign.amountRaised * 100n) / campaign.goal) 
    : 0;

  const isDeadlinePassed = Number(campaign.deadline) * 1000 <= Date.now();
  const isCreator = userAddress?.toLowerCase() === campaign.creator.toLowerCase();
  
  // Status check
  const isCancelled = campaign.status === 3;
  const isSuccessful = campaign.status === 1 || (isDeadlinePassed && campaign.amountRaised >= campaign.goal);
  const isFailed = campaign.status === 2 || (isDeadlinePassed && campaign.amountRaised < campaign.goal && !isCancelled);
  const isActive = campaign.status === 0 && !isDeadlinePassed;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow flex flex-col gap-8">
      {/* Back button / Refresh */}
      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <Link href="/explore" className="text-sm font-semibold text-[#B8B8B8] hover:text-white flex items-center gap-1.5 transition-colors">
          &larr; Back to Explore
        </Link>
        <button onClick={() => refetchAll()} className="flex items-center gap-2 text-sm text-[#B8B8B8] hover:text-white transition-colors">
          <RefreshCw className="h-4 w-4 text-[#F7931A]" /> Refresh Blockchain State
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image, Description, Contributors */}
        <div className="lg:col-span-8 space-y-12">
          {/* Image banner */}
          <div className="relative rounded-[20px] overflow-hidden aspect-video w-full bg-[#141414] border border-white/8">
            <img 
              src={getIPFSGatewayUrl(campaign.imageHash, campaign.category)} 
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-[#090909]/80 backdrop-blur-md border border-white/10 text-sm font-semibold text-[#F7931A]">
              {campaign.category}
            </div>
          </div>

          {/* Title & Creator */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">{campaign.title}</h1>
            <div className="flex items-center gap-3 text-[#B8B8B8] text-sm bg-[#141414] border border-white/5 rounded-[12px] p-4 max-w-xl">
              <div className="p-2 bg-[#F7931A]/10 rounded-lg text-[#F7931A]">
                <User className="h-4.5 w-4.5" />
              </div>
              <span className="truncate">Created by <span className="font-mono font-semibold text-white text-xs">{campaign.creator}</span></span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#141414] border border-white/8 rounded-[20px] p-8 space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">About this campaign</h3>
            <p className="text-[#B8B8B8] text-sm leading-relaxed whitespace-pre-line font-normal">
              {campaign.description}
            </p>
          </div>

          {/* Contributors List */}
          <div className="bg-[#141414] border border-white/8 rounded-[20px] p-8 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5 tracking-tight">
              <Users className="h-5.5 w-5.5 text-[#F7931A]" />
              Backers ({contributors.length})
            </h3>
            
            {contributors.length === 0 ? (
              <p className="text-[#7C7C7C] text-sm italic font-medium">No contributions have been made to this campaign yet. Be the first!</p>
            ) : (
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-2">
                {contributors.map((addr: string, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-4 rounded-[12px] bg-[#1B1B1B] border border-white/8 text-xs">
                    <span className="font-mono text-[#B8B8B8] truncate max-w-xs md:max-w-md">{addr}</span>
                    <span className="text-[#F7931A] font-bold uppercase tracking-wider text-[10px] bg-[#F7931A]/10 border border-[#F7931A]/20 px-2 py-0.5 rounded">Contributor</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Funding Progress & Actions */}
        <div className="lg:col-span-4">
          {/* Funding Card */}
          <div className="bg-[#141414] border border-white/8 rounded-[20px] p-8 space-y-8 sticky top-28 shadow-xl shadow-black/40">
            <div>
              <p className="text-[#7C7C7C] text-xs font-semibold uppercase tracking-wider">Amount Raised</p>
              <h2 className="text-4xl font-extrabold text-white mt-2 flex items-baseline gap-1">
                {formatEther(campaign.amountRaised)} <span className="text-base font-semibold text-[#B8B8B8]">ETH</span>
              </h2>
              <p className="text-xs text-[#7C7C7C] mt-1.5 font-medium">
                raised of {formatEther(campaign.goal)} ETH goal
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-3.5">
              <div className="w-full bg-[#090909] rounded-full h-3 overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-[#F7931A] to-[#FF8C00] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#B8B8B8] font-bold">
                <span>{progress}% funded</span>
                <span className="flex items-center gap-1.5 text-white">
                  <Clock className="h-3.5 w-3.5 text-[#F7931A]" />
                  {timeRemaining}
                </span>
              </div>
            </div>

            {/* Status Card details */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-5 text-center">
              <div>
                <p className="text-[#7C7C7C] text-[10px] uppercase font-bold tracking-wider">Deadline</p>
                <p className="text-xs text-white mt-1 font-semibold">
                  {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[#7C7C7C] text-[10px] uppercase font-bold tracking-wider">Status</p>
                <p className={`text-xs mt-1 font-extrabold uppercase ${
                  isActive 
                    ? 'text-emerald-400' 
                    : isSuccessful
                    ? 'text-[#F7931A]'
                    : 'text-rose-400'
                }`}>
                  {isActive ? 'Active' : isCancelled ? 'Cancelled' : isSuccessful ? 'Successful' : 'Failed'}
                </p>
              </div>
            </div>

            {/* Action Modules */}
            
            {/* 1. Active: Contribute Form */}
            {isActive && (
              <form onSubmit={handleContribute} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#7C7C7C] uppercase tracking-wider mb-2.5">Back this project</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.1"
                      required
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      disabled={isTxPending || isConfirming}
                      className="form-input pr-16"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#7C7C7C] text-sm font-bold">
                      ETH
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isTxPending || isConfirming}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F7931A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#C65A00] disabled:bg-[#1B1B1B] disabled:text-[#7C7C7C] disabled:from-none disabled:to-none text-white font-bold rounded-[12px] flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-orange-600/10"
                >
                  {isTxPending || isConfirming ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4.5 w-4.5" />
                      Back Campaign
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 2. Success & Creator: Withdraw Funds */}
            {isSuccessful && isCreator && !campaign.withdrawn && (
              <div className="space-y-3">
                <div className="p-4 rounded-[12px] bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A] text-xs leading-relaxed font-semibold">
                  <Award className="h-4.5 w-4.5 shrink-0 inline mr-1" />
                  <span>Congratulations! Your campaign goal was met. You can now withdraw the raised funds.</span>
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={isTxPending || isConfirming}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F7931A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#C65A00] text-white font-bold rounded-[12px] flex items-center justify-center gap-2 transition-all"
                >
                  {isTxPending || isConfirming ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Withdraw Funds'
                  )}
                </button>
              </div>
            )}

            {/* 3. Withdrawn Creator Message */}
            {isSuccessful && campaign.withdrawn && (
              <div className="p-4 rounded-[12px] bg-[#141414] border border-white/5 text-center text-sm font-semibold text-[#7C7C7C] flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-[#F7931A]" />
                Funds already withdrawn
              </div>
            )}

            {/* 4. Failed/Cancelled & Contributor: Claim Refund */}
            {(isFailed || isCancelled) && userContribution && userContribution > 0n && (
              <div className="space-y-3">
                <div className="p-4 rounded-[12px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed font-semibold">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 inline mr-1" />
                  <span>The campaign ended without meeting its goal. You are eligible for a 100% refund.</span>
                </div>
                <button
                  onClick={handleClaimRefund}
                  disabled={isTxPending || isConfirming}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F7931A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#C65A00] text-white font-bold rounded-[12px] flex items-center justify-center gap-2 transition-all"
                >
                  {isTxPending || isConfirming ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Claim Refund'
                  )}
                </button>
              </div>
            )}

            {/* User Contribution status */}
            {userContribution && userContribution > 0n && (
              <div className="mt-4 pt-4 border-t border-white/5 text-center text-xs text-[#B8B8B8] font-semibold">
                You contributed <span className="font-bold text-[#F7931A]">{formatEther(userContribution)} ETH</span> to this campaign
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
