import { NextResponse } from 'next/server'

import { auth } from '@/auth'

const CUSTOM_DOMAIN = 'https://www.planetqradio.com/'

export default auth(async req => {
	const host = req.headers.get('host')

	// 🔒 Redirect all requests from vercel.app to your custom domain
	if (host && host.includes('vercel.app')) {
		return NextResponse.redirect(`${CUSTOM_DOMAIN}${req.nextUrl.pathname}`)
	}

	// 🔐 Auth logic
	if (!req.auth && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/signup') {
		const ridirectTo = req.nextUrl.pathname
		const newUrl = new URL(ridirectTo ? `/login?redirectTo=${ridirectTo}` : '/login', req.nextUrl.origin)
		return NextResponse.redirect(newUrl)
	}

	// ✅ Allow request if all is fine
	return NextResponse.next()
})

export const config = {
	matcher:
		'/((?!api/auth|auth|images|api/link/getlink|chat|api/chat|videos/*|robot|aistudio|api/gallery/create|api/thumbnail/modifythumbnail|vidoes|_next/static|_next/image|favicon.ico|^/$).+)',
}
