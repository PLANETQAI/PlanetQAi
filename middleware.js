import { NextResponse } from 'next/server'
import { auth } from './auth'

const CUSTOM_DOMAIN = 'https://www.planetqradio.com/'

// Define webhook paths that should be excluded from middleware processing
const WEBHOOK_PATHS = [
	'/api/stripe-webhook',
	'/api/credits/webhook',
	'/api/subscriptions/webhook'
];

// Create a middleware handler that excludes webhook paths
export default auth(async req => {
	// Check if the current path is a webhook path
	if (WEBHOOK_PATHS.includes(req.nextUrl.pathname)) {
		// Skip all middleware processing for webhook paths
		const response = NextResponse.next()
		// Add CORS headers to webhook responses
		response.headers.set('Access-Control-Allow-Origin', '*')
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
		return response
	}

	const host = req.headers.get('host')
	const origin = req.headers.get('origin')

	// Handle CORS preflight requests
	if (req.method === 'OPTIONS') {
		const response = new NextResponse(null, { status: 200 })
		response.headers.set('Access-Control-Allow-Origin', '*')
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
		response.headers.set('Access-Control-Max-Age', '86400')
		return response
	}

	// 🔒 Redirect all requests from vercel.app to your custom domain
	// Skip this redirect in development environment
	const isDevelopment = process.env.NODE_ENV === 'development'
	
	if (!isDevelopment && host && host.includes('vercel.app')) {
		return NextResponse.redirect(`${CUSTOM_DOMAIN}${req.nextUrl.pathname}`)
	}

	// Check for admin routes and redirect if not an admin
	if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin')) {
		// If not authenticated or not an admin, redirect to login
		if (!req.auth || req.auth.user?.role !== 'Admin') {
			const newUrl = new URL('/login', req.nextUrl.origin)
			return NextResponse.redirect(newUrl)
		}
	}

	// 🔐 Auth logic for protected routes
	if (!req.auth && 
		!WEBHOOK_PATHS.includes(req.nextUrl.pathname) &&
		req.nextUrl.pathname !== '/login' && 
		req.nextUrl.pathname !== '/signup' && 
		req.nextUrl.pathname !== '/forgot-password' && 
		req.nextUrl.pathname !== '/reset-password' && 
		req.nextUrl.pathname !== '/verify-account') {
		const redirectTo = req.nextUrl.pathname
		const newUrl = new URL(redirectTo ? `/login?redirectTo=${redirectTo}` : '/login', req.nextUrl.origin)
		return NextResponse.redirect(newUrl)
	}

	// ✅ Allow request if all is fine
	const response = NextResponse.next()
	
	// Add CORS headers to all responses
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
	
	return response
})

export const config = {
	matcher: [
		'/((?!api/auth|auth|images|api/link/getlink|videos/*|robot|aistudio|api/gallery/create|api/thumbnail/modifythumbnail|vidoes|_next/static|_next/image|favicon.ico|api/webhooks|api/stripe-webhook|api/credits/webhook|api/subscriptions/webhook|forgot-password|reset-password|verify-account|^/$).+)',
		'/admin/:path*',
		'/api/admin/:path*'
	]
}
