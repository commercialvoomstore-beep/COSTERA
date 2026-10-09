/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.e2b.app', 'localhost', '127.0.0.1'],
  // Anti-cache : les pages HTML doivent TOUJOURS être rechargées fraîches,
  // sinon un navigateur peut rejouer un ancien bundle (splash bogué, etc.).
  // Les assets statiques hashés (_next/static) gardent leur cache immuable.
  async headers() {
    return [
      {
        source: '/((?!_next/static/).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

export default nextConfig;
