// Web Crypto API based password hashing
export const saltAndHashPassword = async (password) => {
  if (!password) throw new Error('Password is required')

  // Encode the password as UTF-8
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16))
  
  // Import the password and salt as a key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  
  // Export the key and convert to hex string
  const exportedKey = await crypto.subtle.exportKey('raw', key)
  const hashArray = Array.from(new Uint8Array(exportedKey))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Convert salt to hex string and prepend to hash
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `$2a$10$${saltHex}$${hashHex}`
}

// Verify password against a hash
export const verifyPassword = async (password, hash) => {
  if (!password || !hash) return false
  
  try {
    // Extract salt from the stored hash
    const parts = hash.split('$')
    if (parts.length !== 4) return false
    
    const saltHex = parts[2]
    const salt = new Uint8Array(saltHex.match(/../g).map(byte => parseInt(byte, 16)))
    
    // Hash the provided password with the same salt
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
    
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    const hashArray = Array.from(new Uint8Array(exportedKey))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Compare the generated hash with the stored hash
    return `$2a$10$${saltHex}$${hashHex}` === hash
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}
