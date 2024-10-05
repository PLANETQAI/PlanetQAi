import Head from "next/head";
/* eslint-disable @next/next/no-img-element */
import React from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });
import Image from "next/image";

export default function Home({ initialVideoLink }) {

  const handleRedirect = (url) => {
    window.location.href = url;
  };
  
  return (
    <>
      <Head>
        <title>PlanetQProductions</title>
        <meta name="description" content="planet q productions music player" />
        <link rel="icon" href="/images/small.webp" />
      </Head>

      <div className="flex flex-col min-h-screen bg-[#17101D]">
        <div className="md:flex-grow flex justify-center items-center">
          <div className="video-container">
            <ReactPlayer
              url={"/images/PlanetQProductions.mp4"}
              controls={false}
              loop={true}
              playing={true}
              volume={1}
              muted={true}
              className="react-player"
            />
            <div className="logo-container1 group">
              <div className="logo-container1-left">
                <div className="logo-container1-left-text group-hover:animate-vibrate">
                  <h1>Planet Q Radio</h1>
                </div>
                <button
                  onClick={() =>
                    handleRedirect(
                      "https://planetqproductions.wixsite.com/planet-q-productions/faqs"
                    )
                  }
                >
                  <img src="/images/V_left.gif" alt="Logo1" className="Vlogo" />
                </button>
              </div>
            </div>
            <div className="logo-container2 group">
              <div className="logo-container1-left">
                <div className="logo-container1-left-text group-hover:animate-vibrate">
                  <h1>Planet Q Productions</h1>
                </div>
                <button
                  onClick={() =>
                    handleRedirect(
                      "https://planetqproductions.wixsite.com/planet-q-productions"
                    )
                  }
                >
                  <img
                    src="/images/V_center.jpg"
                    alt="Logo1"
                    className="Vlogo"
                  />
                </button>
              </div>
            </div>
            <div className="logo-container3 group">
              <div className="logo-container1-left">
                <div className="logo-container1-left-text group-hover:animate-vibrate">
                  <h1>Q World Studios</h1>
                </div>
                <button onClick={() => handleRedirect("/aistudio")}>
                  <img
                    src="/images/V_right.jpg"
                    alt="Logo1"
                    className="Vlogo"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800" style={{ padding: "10px" }}>
          <iframe
            src="https://radio.planetqproductions.com/public/planetq/embed?theme=dark&autoplay=true" // Added autoplay parameter
            frameBorder="0"
            allowTransparency="true"
            style={{
              width: "100%",
              minHeight: "130px",
              border: "0",
              maxHeight: "130px",
            }}
            title="Radio Planet Q"
            allow="autoplay; encrypted-media" // Ensure autoplay is allowed
          ></iframe>
        </div>

        <div className="banner-container block xl:hidden">
          <img
            src="/images/planetQproductions.jpg"
            alt="Banner"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  const initialVideoLink = "https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG";
  return {
    props: {
      initialVideoLink,
    },
  };
}
