import React from 'react'
import Spinner from '@/components/common/Spinner'

const RootLoader = async () => {
	return (
		<div className="w-full flex justify-center items-center">
			<Spinner />
		</div>
	)
}

export default RootLoader
