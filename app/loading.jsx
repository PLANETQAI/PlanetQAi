import React from 'react'
import Image from 'next/image'

const RootLoader = async () => {
	return (
		<div className="w-full flex h-screen justify-center items-center">
			<Image
				src={'/images/loader.webp'}
				width={100}
				height={100}
				alt="loader"
				unoptimized
				className="w-full h-full max-h-svh object-cover"
			/>
		</div>
	)
}

export default RootLoader
