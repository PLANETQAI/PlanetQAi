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
		],
		// Add this to handle image optimization errors
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	  },
	experimental: {
		serverComponentsExternalPackages: ['@prisma/client'],
	},
	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
			}
		}
		
		// Fix React import issues and path aliases
		config.resolve.alias = {
			...config.resolve.alias,
			'react': 'react',
			'react-dom': 'react-dom',
			'@': process.cwd(), // Add explicit path alias for @ to point to root directory
		}
		
		return config
	},
  }
  
  export default nextConfig