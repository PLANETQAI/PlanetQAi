/* eslint-disable @next/next/no-img-element */
import React from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function Main() {

    const handleRedirect = (url) => {
        window.location.href = url;
    };

    return (
        <>
            <div className="flex justify-center items-center">
                <div className="video-container">
                    <ReactPlayer
                        url={'/images/final.mp4'}
                        controls={true}
                        loop={true}
                        playing={true}
                        volume={1}
                        muted={false}
                        className="react-player"
                    />
                    <div className="logo-container1">
                        <img src="/images/V_left.gif" alt="Logo1" className="Vlogo" onClick={() => handleRedirect('https://www.planetqradio.com')} />
                    </div>
                    <div className="logo-container2">
                        <img src="/images/V_center.jpg" alt="Logo2" className="Vlogo" onClick={() => handleRedirect('https://planetqproductions.wixsite.com/planet-q-productions')} />
                    </div>
                    <div className="logo-container3">
                        <img src="/images/V_right.jpg" alt="Logo3" className="Vlogo" onClick={() => handleRedirect('https://planetqproductions.wixsite.com/planet-q-productions/faqs')} />
                    </div>
                </div>
            </div>
            <div className="audio-container">
                <AudioPlayer autoPlay loop src="https://radio.planetqproductions.com/listen/planetq/radio.mp3" className="react-audio-player" volume={1.0} />
            </div>
        </>
    );
}