import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import classes from "./musicplayer.module.css";

export default function MusicPlayer() {
  const [isVideoLink, setIsVideoLink] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isThumbnail, setIsThumbnail] = useState("");
  const [iscurrent, setIsCurrent] = useState("");

  const playerRef = useRef(null);

  useEffect(() => {
    fetch("/api/link/getlink")
      .then((response) => response.json())
      .then((links) => {
        const shuffledLinks = shuffleArray(links);
        setIsVideoLink(shuffledLinks);

        if (links && links.length > 0) {
          toast.success("Music successfully retrieved.", {
            position: "top-right",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });

          const storedLinkValue = JSON.parse(localStorage.getItem("linkvalue"));

          if (storedLinkValue) {
            const foundIndex = shuffledLinks.findIndex(
              (item) => item.link === storedLinkValue.link
            );

            if (foundIndex !== -1) {
              setCurrentVideoIndex(foundIndex);
              return;
            }
          }
        }
      })
      .catch((error) => {
        toast.error("An error occurred while fetching data.", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      });

    fetch("/api/thumbnail/modifythumbnail")
      .then((response) => response.json())
      .then((newthumbnail) => {
        if (newthumbnail && newthumbnail.length > 0) {
          setIsThumbnail(newthumbnail[0].ThumbnailImage);
          toast.success("New Thumbnail added!", {
            position: "top-right",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
        }
      })
      .catch((error) => {
        toast.error(error.message, {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      });

    const storedIndex = localStorage.getItem("currentVideoIndex");

    if (storedIndex !== null) {
      setCurrentVideoIndex(parseInt(storedIndex));
    } else {
      setCurrentVideoIndex(0);
    }
  }, []);

  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  };

  const handleVideoEnd = () => {
    setIsCurrent(0);
    const totalVideos = isVideoLink.length;
    const lastPlayedSongs = []; // Store the last two played songs

    let randomIndex = Math.floor(Math.random() * totalVideos);

    while (
      randomIndex === currentVideoIndex ||
      lastPlayedSongs.includes(randomIndex)
    ) {
      randomIndex = Math.floor(Math.random() * totalVideos);
    }

    lastPlayedSongs.unshift(currentVideoIndex);
    if (lastPlayedSongs.length > 2) {
      lastPlayedSongs.pop();
    }

    setCurrentVideoIndex(randomIndex);
    localStorage.setItem("currentVideoIndex", randomIndex.toString());
    const currentValue = isVideoLink[randomIndex];
    localStorage.setItem("linkvalue", JSON.stringify(currentValue));
  };

  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.showPreview();
      setIsCurrent(playerRef.current.getCurrentTime());
    }
  };

  const playhandler = () => {
    if (!iscurrent || iscurrent === null) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime());
    }

    playerRef.current.seekTo(iscurrent);
  };

  const handleSeeking = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime());
    }
  };

  return (
    <>
      <ToastContainer
        className="bg-transparent"
        autoClose={1500}
        draggable
        closeOnClick
      />
      <style>
        {`
        @layer utilities {
          .rotate-custom {
            animation: spin 3s linear infinite;
          }
        }
      `}
      </style>
      <section className="bg-transparent flex gap-2 flex-col justify-center items-center mt-8">
        <h2 className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-2xl font-black md:text-4xl mb-5">
          Make A Song About Anything
        </h2>

        <div className="bg-transparent w-full h-auto flex justify-center items-center mb-2">
          <ReactPlayer
            ref={playerRef}
            className="bg-transparent"
            url={
              isVideoLink?.length > 0 && isVideoLink[currentVideoIndex]?.link
                ? isVideoLink[currentVideoIndex]?.link
                : "https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG"
            }
            controls={false}
            light={isThumbnail?.length ? isThumbnail : "/images/client.png"}
            onStart={playhandler}
            pip={true}
            loop={!isVideoLink?.length > 0}
            playing={true}
            onPause={handlePause}
            onSeek={handleSeeking}
            stopOnUnmount={false}
            playIcon={
              <div className={classes.heartbeat}>
                <Image
                  src="/images/client.png"
                  alt="Your Logo"
                  width={45}
                  height={60}
                  className="bg-transparent w-auto h-auto shadow-2xl opacity-100 transition-transform duration-200 ease-in-out transform-gpu scale-125 hover:scale-100 hover:opacity-95"
                  style={{
                    clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
                  }}
                ></Image>
              </div>
            }
            onEnded={handleVideoEnd}
          />
        </div>
      </section>
    </>
  );
}
