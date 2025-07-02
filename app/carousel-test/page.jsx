"use client";

import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

// Dynamically import components with SSR disabled
const Card = dynamic(
  () => import('@/components/carousel/Card'),
  { ssr: false }
);

const Carousel = dynamic(
  () => import('@/components/carousel/Carousel'),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

export default function CarouselTestPage() {
  // Prevent click propagation for carousel cards
  const preventPropagation = (e) => {
    e.stopPropagation();
  };

  // Planet Q Store Card
  const planetQStore = (
    <div 
      className="group bg-gradient-to-br from-pink-900/80 to-rose-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-pink-500/50 transition-all duration-300 h-full flex flex-col"
      onClick={preventPropagation}
    >
      <Link href="https://planetqproductions.wixsite.com/planet-q-productions/futuristichiphopbeats" legacyBehavior={false}>
        <div className="text-[#afafaf] text-lg font-semibold p-2 mb-2 text-center group-hover:animate-vibrate">
          <h1 className="text-2xl text-white">Planet Q Store</h1>
        </div>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <Image
            src={"/images/robo.jpeg"}
            alt="Planet Q Store"
            fill
            className="object-cover"
          />
        </div>
      </Link>
    </div>
  );

  // Q World Studios Card
  const qWorldStudios = (
    <div 
      className="group bg-gradient-to-br from-amber-900/80 to-red-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-amber-500/50 transition-all duration-300 h-full flex flex-col overflow-hidden"
      onClick={preventPropagation}
    >
      <Link href="/chat" className="flex flex-col items-center">
        <div className="text-[#afafaf] text-lg font-semibold p-2 mb-4 text-center group-hover:animate-vibrate">
          <h1 className="text-2xl text-white">Q World Studios</h1>
        </div>
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden mb-4">
          <video
            autoPlay
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/Planet-q-Chatbox.mp4" type="video/mp4" />
          </video>
        </div>
        <p className="text-blue-400 text-lg font-bold animate-pulse">
          Chat Bot
        </p>
      </Link>
    </div>
  );

  // Planet Q Productions Card
  const planetQProductions = (
    <div 
      className="group bg-gradient-to-br from-indigo-900/80 to-purple-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-indigo-500/50 transition-all duration-300 h-full flex flex-col"
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
  );

  // Planet Q Radio Card
  const planetQRadio = (
    <div 
      className="group bg-gradient-to-br from-blue-900/80 to-cyan-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-blue-500/50 transition-all duration-300 h-full flex flex-col"
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
  );

  // Studio Card
  const studioCard = (
    <div 
      className="group bg-gradient-to-br from-green-900/80 to-emerald-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-green-500/50 transition-all duration-300 h-full flex flex-col"
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
  );

  // Planet Q Video Card
  const planetQVideo = (
    <div 
      className="group bg-gradient-to-br from-purple-900/80 to-blue-900/80 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300 h-full flex flex-col"
      onClick={preventPropagation}
    >
      <div className="text-[#afafaf] text-lg font-semibold p-2 mb-2 text-center group-hover:animate-vibrate">
        <h1 className="text-2xl text-white">Planet Q Video</h1>
      </div>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden mt-auto">
        <iframe
          src="https://www.youtube.com/embed/I5uiP9ogijs"
          title="Planet Q Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    </div>
  );

  // Cards array with main page content
  let cards = [
    {
      key: uuidv4(),
      content: planetQVideo
    },
    {
      key: uuidv4(),
      content: planetQProductions
    },
    {
      key: uuidv4(),
      content: planetQRadio
    },
    {
      key: uuidv4(),
      content: qWorldStudios
    },
    {
      key: uuidv4(),
      content: studioCard
    },
    {
      key: uuidv4(),
      content: planetQStore
    }
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#050816] overflow-hidden">
      <div className="container mx-auto px-4 py-12 h-full flex items-center">
        <div className="w-full h-[600px] relative">
          <Carousel
            cards={cards}
            width="100%"
            height="100%"
            margin="0 auto"
            offset={2}
            showArrows={false}
          />
        </div>
      </div>
    </div>
  );
}
