export async function getServerSideProps({ req, res }) {
	const host = req.headers.host
	const isDevelopment = process.env.NODE_ENV === 'development'

	// Always allow crawling in development, otherwise check if it's a Vercel URL
	const isVercel = !isDevelopment && host.includes('vercel.app')

	const content = isVercel ? `User-agent: *\nDisallow: /` : `User-agent: *\nAllow: /`

	res.setHeader('Content-Type', 'text/plain')
	res.write(content)
	res.end()

	return { props: {} }
}

export default function Robots() {
	return null
}
