/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net', 
      },
      {
        protocol: 'https',
        hostname: 'img.theapi.app',
        pathname: '/ephemeral/**',
      }
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  webpack: (config, { isServer }) => {
    // Add three.js as external
    // config.externals = config.externals || [];
    // config.externals.push('three');
 if (isServer) {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    }
      if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Fix React import issues and path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': 'react',
      'react-dom': 'react-dom',
      '@': process.cwd(),
    }
    
    return config;
  },
  // Add headers to properly serve .glb files
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'model/gltf-binary',
          },
        ],
      },
      {
        source: '/:path*.glb',
        headers: [
          {
            key: 'Content-Type',
            value: 'model/gltf-binary',
          },
        ],
      },
    ];
  },
  // Enable static file serving
  staticPageGenerationTimeout: 1000,
  generateBuildId: async () => 'build-' + Date.now(),
  // Add asset prefix if needed for production
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;