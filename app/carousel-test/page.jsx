"use client";

import Carousel3D from "@/components/carousel/carousel3D";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const preventPropagation = (e) => e.stopPropagation();

  return (
    <main className="bg-[#021514] min-h-screen py-20">
      <Carousel3D>
        {/* Q World Studios */}
        <div
          className="group min-w-[400px] max-w-[400px] h-[500px] bg-gradient-to-br from-amber-900/80 to-red-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-amber-500/50 transition-all duration-300 flex flex-col overflow-hidden snap-center animate-glow"
          onClick={preventPropagation}
        >
          <Link href="/chat" className="flex flex-col items-center">
            <div className="text-[#afafaf] text-lg font-semibold p-2 mb-4 text-center group-hover:animate-vibrate">
              <h1 className="text-2xl text-white">Q World Studios</h1>
            </div>
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden mb-4">
              <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover">
                <source src="/videos/Planet-q-Chatbox.mp4" type="video/mp4" />
              </video>
            </div>
            <p className="text-blue-400 text-lg font-bold animate-pulse">Chat Bot</p>
          </Link>
        </div>

        {/* Planet Q Productions */}
        <div
          className="group min-w-[400px] max-w-[400px] h-[500px] bg-gradient-to-br from-indigo-900/80 to-purple-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-indigo-500/50 transition-all duration-300 flex flex-col snap-center"
          onClick={preventPropagation}
        >
          <Link
            href="https://planetqproductions.wixsite.com/planet-q-productions/aboutplanetqproductions"
            className="h-full flex flex-col"
          >
            <div className="text-[#afafaf] text-lg font-semibold p-2 mb-2 text-center group-hover:animate-vibrate">
              <h1 className="text-2xl text-white">Planet Q Productions</h1>
            </div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mt-auto">
              <Image
                src="/images/V_center.jpg"
                alt="Planet Q Productions"
                fill
                className="object-cover"
              />
            </div>
          </Link>
        </div>

        {/* Planet Q Radio */}
        <div
          className="group min-w-[400px] max-w-[400px] h-[500px] bg-gradient-to-br from-blue-900/80 to-cyan-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-blue-500/50 transition-all duration-300 flex flex-col snap-center"
          onClick={preventPropagation}
        >
          <Link
            href="https://planetqproductions.wixsite.com/planet-q-productions/faqs"
            className="h-full flex flex-col"
          >
            <div className="text-[#afafaf] text-lg font-semibold p-2 mb-2 text-center group-hover:animate-vibrate">
              <h1 className="text-2xl text-white">Planet Q Radio</h1>
            </div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mt-auto">
              <video
                src="/videos/V_left-compressed.mp4"
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>

        {/* AI Studio */}
        <div
          className="group min-w-[400px] max-w-[400px] h-[500px] bg-gradient-to-br from-green-900/80 to-emerald-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-green-500/50 transition-all duration-300 flex flex-col snap-center"
          onClick={preventPropagation}
        >
          <Link href="/aistudio" className="h-full flex flex-col">
            <div className="text-[#afafaf] text-lg font-semibold p-2 mb-2 text-center group-hover:animate-vibrate">
              <h1 className="text-2xl text-white">Q World Studios</h1>
            </div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mt-auto">
              <Image
                src="/images/V_right.jpg"
                alt="Q World Studios"
                fill
                className="object-cover"
              />
            </div>
          </Link>
        </div>
      </Carousel3D>
    </main>
  );
}
