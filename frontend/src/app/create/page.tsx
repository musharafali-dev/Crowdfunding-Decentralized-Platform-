'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/contracts';
import { parseEther } from 'viem';
import { uploadFileToIPFS } from '@/utils/ipfs';
import { PlusCircle, Image, Upload, Loader2, Wallet, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateCampaign() {
  const router = useRouter();
  const { isConnected } = useAccount();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('Technology');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories = ['Technology', 'Art', 'Community', 'Charity', 'Fashion', 'Film'];

  // Contract write configuration
  const { writeContractAsync, data: txHash, isPending: isTxPending } = useWriteContract();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !goal || !duration || !category) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (parseFloat(goal) <= 0) {
      toast.error('Funding goal must be greater than 0 ETH.');
      return;
    }

    if (parseInt(duration) <= 0) {
      toast.error('Campaign duration must be at least 1 day.');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload a campaign image.');
      return;
    }

    try {
      setIsUploading(true);
      toast.loading('Uploading image to IPFS...', { id: 'ipfs' });
      
      // 1. Upload image to IPFS
      const ipfsHash = await uploadFileToIPFS(imageFile);
      toast.success('Image successfully uploaded to IPFS!', { id: 'ipfs' });
      setIsUploading(false);

      toast.loading('Confirming transaction in wallet...', { id: 'contract' });
      
      // 2. Call contract function
      const goalInWei = parseEther(goal);
      const durationInDays = BigInt(duration);

      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createCampaign',
        args: [
          title,
          description,
          goalInWei,
          durationInDays,
          ipfsHash,
          category
        ],
      });

      toast.loading('Waiting for blockchain confirmation...', { id: 'contract' });
      
      // Simulating a minor delay or waiting for receipt which useWaitForTransactionReceipt handles
      toast.success('Campaign created successfully!', { id: 'contract' });
      
      // Redirect to explore page
      setTimeout(() => {
        router.push('/explore');
      }, 2000);

    } catch (error: any) {
      setIsUploading(false);
      console.error(error);
      toast.error(error.message || 'An error occurred during campaign creation.', { id: 'ipfs' });
      toast.error(error.message || 'Transaction rejected or failed.', { id: 'contract' });
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 flex-grow flex flex-col items-center justify-center text-center">
        <div className="p-5 bg-[#F7931A]/10 rounded-full text-[#F7931A] mb-8 animate-bounce">
          <Wallet className="h-12 w-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">Connect Wallet Required</h2>
        <p className="text-[#B8B8B8] max-w-sm mb-8 text-base">
          You must connect your Web3 wallet using the connect button in the navigation bar to create a crowdfunding campaign.
        </p>
      </div>
    );
  }

  const isFormPending = isUploading || isTxPending || isConfirming;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-white flex items-center justify-center gap-3 tracking-tight">
          <PlusCircle className="h-9 w-9 text-[#F7931A]" />
          Create a Campaign
        </h1>
        <p className="text-[#B8B8B8] mt-2.5 text-sm">
          Share your idea with the world and gather transparent decentralized funding.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#141414] border border-white/8 rounded-[20px] p-8 md:p-10 space-y-8">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2.5">Campaign Title *</label>
          <input
            type="text"
            required
            disabled={isFormPending}
            placeholder="e.g. Next-Gen Decentralized Hardware Wallet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Category & Goal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2.5">Category *</label>
            <select
              value={category}
              disabled={isFormPending}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#141414] text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2.5">Funding Goal (ETH) *</label>
            <input
              type="number"
              step="0.001"
              required
              disabled={isFormPending}
              placeholder="e.g. 5.5"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2.5">Duration (Days) *</label>
          <input
            type="number"
            required
            disabled={isFormPending}
            placeholder="e.g. 30"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="form-input"
          />
          <p className="text-[#7C7C7C] text-xs mt-2 flex items-center gap-1.5 font-medium">
            <AlertCircle className="h-3.5 w-3.5 text-[#F7931A]" />
            Once created, the campaign deadline cannot be modified.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2.5">Description *</label>
          <textarea
            required
            disabled={isFormPending}
            rows={5}
            placeholder="Provide a comprehensive explanation of your project, milestones, and how the funds will be utilized..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input resize-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2.5">Campaign Image *</label>
          <div className="relative border border-dashed border-white/8 rounded-[12px] overflow-hidden bg-[#090909]/40 hover:bg-[#1B1B1B] hover:border-[#F7931A]/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              disabled={isFormPending}
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {imagePreview ? (
              <div className="relative h-64 w-full">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#090909]/80 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#F7931A]" /> Change Image
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <Image className="h-10 w-10 text-[#7C7C7C] mb-3" />
                <p className="text-sm font-semibold text-white mb-1.5">Click or drag image file here</p>
                <p className="text-xs text-[#7C7C7C] leading-relaxed">Supports PNG, JPG, GIF, SVG (Recommended: 16:9 aspect ratio)</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isFormPending}
          className="w-full py-4 bg-gradient-to-r from-[#F7931A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#C65A00] disabled:bg-[#1B1B1B] disabled:text-[#7C7C7C] disabled:from-none disabled:to-none disabled:border disabled:border-white/5 text-white font-bold rounded-[12px] flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-orange-600/10"
        >
          {isFormPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isUploading 
                ? 'Uploading to IPFS...' 
                : isTxPending 
                ? 'Sign transaction in wallet...' 
                : 'Confirming block transaction...'}
            </>
          ) : (
            <>
              <PlusCircle className="h-5 w-5" />
              Create Campaign
            </>
          )}
        </button>
      </form>
    </div>
  );
}
