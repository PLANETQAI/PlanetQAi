import React from 'react'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Welcome to PlanetQRadio Studio. Upload your music video here.',
}

const page = () => {
	const backgroundImageStyle = {
		backgroundImage: 'url("/images/back.png")',
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		minHeight: '100vh',
	}
	return <div style={backgroundImageStyle}></div>
}

export default page
