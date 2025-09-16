"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaMicrophone } from "react-icons/fa";


const WelcomePage = () => {
    const router = useRouter();



    return (
        <div className="flex flex-col items-center justify-center bg-gray-600 h-screen" suppressHydrationWarning>
            <div className="relative w-80 h-80 mb-4">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 p-0.5`}>
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-900">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        >
                            <source src="/videos/generator.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </div>
            <div className={`text-sm font-medium mb-4 text-green-600`}>
                Tap to start
            </div>
            <button
                onClick={() => router.push('/aistudio')}
                className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-red-500/30 transition-all duration-300 overflow-hidden"
            >
                <span className="relative z-10 flex items-center">
                    <FaMicrophone className="mr-2" />
                    Start Assistant
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
        </div>
    );


};

export default WelcomePage;
