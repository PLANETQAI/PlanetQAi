import z from 'zod'

export const signInSchema = z.object({
	fullName: z.string({ required_error: 'First name is required' }).min(2, 'First name must be at least 2 characters long'),
	email: z.string({ required_error: 'Email is required' }).min(1, 'Email is required').email('Invalid email'),
	password: z
		.string({ required_error: 'Password is required' })
		.min(1, 'Password is required')
		.min(8, 'Password must be more than 8 characters')
		.max(32, 'Password must be less than 32 characters'),
})

export const logInSchema = z.object({
	email: z.string({ required_error: 'Email is required' }).min(1, 'Email is required').email('Invalid email'),
	password: z
		.string({ required_error: 'Password is required' })
		.min(1, 'Password is required')
		.min(8, 'Password must be more than 8 characters')
		.max(32, 'Password must be less than 32 characters'),
})
