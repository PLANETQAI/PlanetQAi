import { NextResponse } from 'next/server'

import { auth } from '@/auth'

export default auth(async req => {
	if (!req.auth && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/signup') {
		const ridirectTo = req.nextUrl.pathname
		const newUrl = new URL(
			ridirectTo ? `/login?redirectTo=${ridirectTo}` : '/login',
			req.nextUrl.origin
		)
		return NextResponse.redirect(newUrl)
	}
})

export const config = {
	matcher:
		'/((?!api/auth|auth|images|api/link/getlink|chat|api/chat|videos/*|aistudio|api/gallery/create|api/thumbnail/modifythumbnail|vidoes|_next/static|_next/image|favicon.ico|^/$).+)',
}
