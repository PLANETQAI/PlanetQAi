import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'

import { useChat } from 'ai/react'
import Link from 'next/link'

export default function ChatBot() {
	const { messages, input, handleSubmit, handleInputChange, isLoading } = useChat()
	const [triggerPrompt, setTriggerPrompt] = useState(false)
	const aiVideoRef = useRef(null)

	useEffect(() => {
		if (triggerPrompt) {
			handleSubmit()
		}
	}, [triggerPrompt])

	const prompts = [
		'Create a relaxing lo-fi beat with gentle piano, soft bass, and a subtle vinyl crackle for a calm and laid-back atmosphere.',
		'Compose a cinematic orchestral piece with dramatic strings, bold brass, and powerful percussion, evoking a sense of adventure.',
		'Produce a warm, funky track with smooth electric guitar, groovy bass, and steady drums, perfect for a sunset drive',
		'Make an ambient, space-themed electronic track with ethereal synths, echoing chimes, and deep bass pulses, creating a sense of vastness.',
	]

	useEffect(() => {
		if (isLoading) {
			if (aiVideoRef.current) {
				aiVideoRef.current.play()
			}
		} else {
			if (aiVideoRef.current) {
				aiVideoRef.current.pause()
			}
		}
		console.log(aiVideoRef.current)
	}, [isLoading])

	useEffect(() => {
		window.scrollTo(0, document.body.scrollHeight)
	}, [messages])

	return (
		<div className="bg-gray-600 min-h-screen">
			<Head>
				<title>PlanetQProductions</title>
				<meta name="description" content="planet q productions Chatbot" />
				<link rel="icon" href="/images/small.webp" />
			</Head>

			<div className="flex justify-between flex-col min-h-screen bg-[#17101D]">
				<div
					className="flex items-center justify-center gap-12 sticky top-0"
					style={{
						backgroundColor: 'rgb(31 41 55 / var(--tw-bg-opacity))',
					}}
				>
					<div className="relative w-[100px] h-[100px]">
						<div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
							<video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
								<source src="/images/anicircle.mp4" type="video/mp4" />
							</video>
						</div>
						<Image src="/images/radio1.jpeg" alt="Radio Right" width={100} height={100} className="imgradio" />
					</div>

					<div className={`w-[200px] h-[192px] hover:cursor-pointer flex justify-center items-center rounded-full hover:shadow-[0_0_15px_rgba(0,300,300,0.8)] ${isLoading && 'flicker-shadow'}`}>
						<video ref={aiVideoRef} className='w-48 h-48 aspect-square rounded-full' src="/videos/Planet-q-Chatbox.mp4">
						</video>
					</div>

					<div className="relative w-[100px] h-[100px]">
						<div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
							<video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
								<source src="/images/anicircle.mp4" type="video/mp4" />
							</video>
						</div>
						<Image src="/images/radio1.jpeg" alt="Radio Right" width={100} height={100} className="imgradio" />
					</div>
				</div>

				<div className="flex flex-col w-full max-w-[80%] mx-auto stretch">
					<div className="text-white w-full pb-24">
						{messages.map(m => (
							<Link
								href={`/aistudio?message=${m.content}`}
								key={m.id}
								className={`whitespace-pre-wrap flex gap-4 items-center ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								{m.role === 'user' ? '' : <Image src={'/images/face.jpeg'} width={32} height={32} className="rounded-full" />}
								<span className={`my-4 p-4 ${m.role === 'user' ? 'bg-gray-600 rounded-xl' : 'bg-gray-600 rounded-xl'}`}>
									{m.toolInvocations ? <pre>{JSON.stringify(m.toolInvocations, null, 2)}</pre> : <span>{m.content}</span>}
								</span>
							</Link>
						))}
					</div>

					<form onSubmit={handleSubmit} className="flex flex-col justify-center items-center gap-8">
						{!messages.length > 0 && (
							<div className="flex gap-4 justify-center flex-wrap mb-28">
								{prompts.map((value, indx) => (
									<div
										className={`text-white max-w-md border border-white rounded-xl p-4 hover:cursor-pointer hover:bg-gray-600 ${indx > 1 && 'hidden lg:block'
											}`}
										key={indx}
										onClick={() => {
											handleInputChange({ target: { value } })
											setTriggerPrompt(true)
										}}
									>
										{value}
									</div>
								))}
							</div>
						)}
						<input
							className="w-full max-w-[80%] fixed bottom-0 mx-auto left-4 right-4 p-2 mb-8 border border-gray-300 rounded shadow-xl"
							value={input}
							placeholder="Please type your query here..."
							onChange={handleInputChange}
						/>
						<p className="text-white text-start">Clicking on the AI response would redirect you the generate page.</p>
					</form>
				</div>
			</div>
		</div>
	)
}
