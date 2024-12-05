import bcrypt from 'bcryptjs'

export const saltAndHashPassword = password => {
	if (!password) throw new Error('Password is required')

	// Generate a salt
	const salt = bcrypt.genSaltSync(10)

	// Hash the password with the salt
	const hashedPassword = bcrypt.hashSync(password, salt)

	return hashedPassword
}
