/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	experimental: {
		appDir: true,
	},
	api: {
		bodyParser: true,
	},
}

export default nextConfig
