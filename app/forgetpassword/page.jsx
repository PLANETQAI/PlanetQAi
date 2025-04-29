import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ForgetPassword from './forgetPassword'

export const metadata = {
	title: 'Forget Password',
	description: 'planet Q productions music player',
}

const ForgetPasswordPage = async () => {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}
	return <ForgetPassword />
}

export default ForgetPasswordPage
