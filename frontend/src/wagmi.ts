import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { localhost, sepolia } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'd50c184c8a2432d667c8230b5368a183';

export const config = getDefaultConfig({
  appName: 'DeCrowdfund',
  projectId: projectId,
  chains: [
    // Support local hardhat node for testing, and sepolia for testnet
    {
      ...localhost,
      id: 1337, // Hardhat local node chainId is often 1337
    },
    sepolia,
  ],
  ssr: true,
});
