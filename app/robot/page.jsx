import StarsCanvas from '@/components/canvas/stars'
import Image from 'next/image'

export default function RobotPage() {
	return (
		<div className="relative z-10 bg-[#050816] px-4 overflow-hidden min-h-screen">
			<StarsCanvas />
			<div className="w-full flex justify-center items-center h-screen">
				<Image src={'/images/robo.jpeg'} width={100} height={100} alt="robo" className="w-full sm:w-1/2" />
			</div>
		</div>
	)
}
