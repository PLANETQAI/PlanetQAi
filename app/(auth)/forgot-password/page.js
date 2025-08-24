import ForgotPasswordForm from '@/components/auth/forgotPasswordForm'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata = {
	title: 'Forgot Password',
	description: 'Reset your PlanetQAi account password.',
}

export default async function ForgotPassword() {
	const session = await auth()
	if (session) {
		redirect('/aistudio')
	}

	return <ForgotPasswordForm />
}
