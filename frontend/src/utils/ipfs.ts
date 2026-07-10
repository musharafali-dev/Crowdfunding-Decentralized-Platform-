export async function uploadFileToIPFS(file: File): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  
  if (!jwt || jwt === 'your_pinata_jwt_token' || jwt === '') {
    console.warn("Pinata JWT not configured in env variables. Utilizing mock fallback upload.");
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1200));
    // Return a mock identifier
    return 'mock_' + Math.random().toString(36).substring(2, 15);
  }

  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      project: 'decrowdfund'
    }
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', options);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API upload failed: ${response.statusText} (${errorText})`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Error pinning file to IPFS via Pinata:', error);
    throw error;
  }
}

export function getIPFSGatewayUrl(hash: string, category?: string): string {
  if (!hash) {
    return getPlaceholderByCategory(category || '');
  }

  // Handle mock hashes by returning beautiful categorized placeholder images
  if (hash.startsWith('mock_')) {
    return getPlaceholderByCategory(category || '', hash);
  }

  const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
  const cleanGateway = gateway.endsWith('/') ? gateway : `${gateway}/`;
  return `${cleanGateway}${hash}`;
}

function getPlaceholderByCategory(category: string, seed?: string): string {
  const s = seed ? parseInt(seed.replace(/\D/g, '')) || 0 : 0;
  const index = s % 3;
  
  const techImages = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'
  ];
  
  const artImages = [
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80'
  ];

  const communityImages = [
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80'
  ];

  const genericImages = [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
  ];

  const normalizedCategory = category.toLowerCase();
  if (normalizedCategory.includes('tech')) return techImages[index];
  if (normalizedCategory.includes('art')) return artImages[index];
  if (normalizedCategory.includes('comm') || normalizedCategory.includes('charity')) return communityImages[index];
  
  return genericImages[index];
}
