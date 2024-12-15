export { auth as middleware } from '@/auth'
import { NextResponse } from 'next/server'

import { auth } from '@/auth'

export default auth(async function middleware(request) {
	return NextResponse.next()
})

export const config = {
	matcher: '/((?!api/auth|auth|images|_next/static|_next/image|favicon.ico|^/$).+)',
}
