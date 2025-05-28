/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
	images: {
		domains: ['res.cloudinary.com', 'storage.googleapis.com', 'lh3.googleusercontent.com'],
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