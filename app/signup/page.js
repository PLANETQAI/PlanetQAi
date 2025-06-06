import SignupForm from '@/components/auth/signupForm'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata = {
	title: 'Signup',
	description: 'Create your account on the planetQProductions and get started.',
}

export default async function Signup() {
	const session = await auth()
	if (session) {
		redirect('/aistudio')
	}

	return <SignupForm />
}
