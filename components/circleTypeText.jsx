'use client'

import { useEffect, useRef } from 'react'

import CircleType from 'circletype'

export default function CircleTypeText({ text, className, radius = 180 }) {
	const circleInstance = useRef()
	useEffect(() => {
		new CircleType(circleInstance.current).radius(radius)
	}, [])
	return (
		<div className={className ? className : ''}>
			<div ref={circleInstance}>{text}</div>
		</div>
	)
}
