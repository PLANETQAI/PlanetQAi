import AuthForm from '@/components/auth/authForm'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata = {
	title: 'Login',
	description: 'planet q productions music player home.',
}

export default async function Login() {
	const session = await auth()
	if (session) {
		redirect('/aistudio')
	}

	return <AuthForm />
}
