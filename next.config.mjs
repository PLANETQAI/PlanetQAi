/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
	webpack: (config, { isServer }) => {
	  if (!isServer) {
		config.resolve.fallback = {
		  ...config.resolve.fallback,
		  fs: false,
		}
	  }
	  
	  // Fix React import issues
	  config.resolve.alias = {
		...config.resolve.alias,
		'react': 'react',
		'react-dom': 'react-dom',
	  }
	  
	  return config
	},
  }
  
  export default nextConfig