'use client'

import React, { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'

async function sendSongLink(enteredVideoLink, title, thumbnailLink) {
	try {
		const response = await axios.post('/api/link/uploadlink', {
			videoLink: enteredVideoLink,
			title,
			thumbnail: thumbnailLink,
		})
		const data = await response.data
		console.log(data)

		toast.success(data.message, {
			position: 'top-right',
			autoClose: 1500,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: 'dark',
		})

		return data
	} catch (error) {
		console.log(error.response)
		console.log(error)
		const errorMessage = error.response.data.message
		toast.error(errorMessage, {
			position: 'top-right',
			autoClose: 1500,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: 'dark',
		})
		throw new Error(error)
	}
}

export default function AdminLink() {
	const videoLinkInputRef = useRef()
	const titleInputRef = useRef()
	const thumbnailLinkInputRef = useRef()
	const [isLoading, setIsLoading] = useState(false)

	const submitHandler = async event => {
		event.preventDefault()
		try {
			setIsLoading(true)
			const enteredVideoLink = videoLinkInputRef.current.value
			const title = titleInputRef.current.value
			const thumbnailLink = thumbnailLinkInputRef.current.value

			const result = await sendSongLink(enteredVideoLink, title, thumbnailLink)
			if (result.message === 'Link Stored Successfully!') {
				event.target.reset()
			}
			setIsLoading(false)
			setTimeout(() => {
				location.reload()
			}, 1800)
		} catch (error) {
			console.log(error)
			setIsLoading(false)
		}
	}

	return (
		<>
			<section className=" w-3/4 m-auto py-8 px-4 gap-8 rounded-lg shadow-lg">
				<div className="flex flex-col gap-6 p-6 rounded-lg shadow-inner">
					<form className="flex flex-col gap-4" onSubmit={submitHandler}>
						<label htmlFor="title" className="text-white font-semibold">
							Title
						</label>
						<input
							id="title"
							name="title"
							type="text"
							required
							ref={titleInputRef}
							className="w-full p-2 rounded bg-transparent ring-2 ring-white text-white focus:ring-2 focus:ring-indigo-600"
							placeholder="music title"
						/>

						<label htmlFor="link" className="text-white font-semibold">
							Video/Music Link
						</label>
						<input
							id="link"
							name="link"
							type="link"
							required
							ref={videoLinkInputRef}
							className="w-full p-2 rounded bg-transparent ring-2 ring-white text-white focus:ring-2 focus:ring-indigo-600"
							placeholder="https://example.com/v1"
						/>

						<label htmlFor="thumbnail" className="text-white font-semibold">
							Thumbnail Link
						</label>
						<input
							id="thumbnail"
							name="thumbnail"
							type="link"
							ref={thumbnailLinkInputRef}
							className="w-full p-2 rounded bg-transparent ring-2 ring-white text-white focus:ring-2 focus:ring-indigo-600"
							placeholder="https://example.com/p1"
						/>

						<button
							disabled={isLoading}
							type="submit"
							className="w-full py-2 mt-4 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-600 disabled:bg-indigo-900"
						>
							{isLoading ? 'Submitting...' : 'Submit'}
						</button>
					</form>
				</div>
			</section>
		</>
	)
}
