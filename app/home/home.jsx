'use client'
import React, { useState } from 'react'
import MusicGenerator from '@/components/player/SunoConsumer'
import { useSearchParams } from 'next/navigation'

const Home = ({ session }) => {
	const searchParams = useSearchParams()
	const message = searchParams.get('message')

	const [selectedPrompt, setSelectedPrompt] = useState({
		text: message || '',
		tags: '',
		title: '',
	})

	return (
		<MusicGenerator
			session={session}
			selectedPrompt={selectedPrompt}
			onPromptChange={setSelectedPrompt}
		/>
	)
}

export default Home
