import ResetPasswordForm from '@/components/auth/resetPasswordForm'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata = {
	title: 'Reset Password',
	description: 'Enter verification code and set a new password for your PlanetQAi account.',
}

export default async function ResetPassword() {
	const session = await auth()
	if (session) {
		redirect('/aistudio')
	}

	return <ResetPasswordForm />
}
