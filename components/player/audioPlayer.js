import React, { useRef, useState, useEffect } from "react";
import { TbPlayerPlay, TbPlayerPause } from "react-icons/tb";
import { GiSpeaker } from "react-icons/gi";
import { MdOutlineFileDownload } from "react-icons/md";
import { saveAs } from "file-saver"; // Import file-saver
import { useSession } from "next-auth/react";
import { useUser } from '../../context/UserContext';

const AudioPlayer = ({ src }) => {
  const { data: session, update } = useSession();
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const {openHandler} = useUser();

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;

      const handleLoadedMetadata = () => {
        setDuration(formatTime(audio.duration));
      };

      const handleTimeUpdate = () => {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(formatTime(audio.currentTime));
      };

      if (audio.readyState >= 1) {
        setDuration(formatTime(audio.duration));
      }

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [volume]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newProgress = (offsetX / rect.width) * 100;
    const newTime = (newProgress / 100) * audio.duration;
    audio.currentTime = newTime;
    setProgress(newProgress);
  };

  async function updateMaxDownload(userId, newMaxDownload) {
    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, max_download: newMaxDownload }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update max_download");
      }

      console.log("Max download updated successfully:", data);

      // Optionally, you can also trigger session update if needed
      update({ max_download: newMaxDownload });
    } catch (error) {
      console.error("Error updating max_download:", error.message);
    }
  }

  const handleDownload = async () => {
    if (session?.user?.max_download <= 0) {
      openHandler();
      return;
    }

    try {
      const response = await fetch(src); // Fetch the audio file
      const blob = await response.blob(); // Convert the audio file to a Blob
      saveAs(blob, src.split("/").pop()); // Use file-saver to download the file

      // update the user max_download value
      await updateMaxDownload(
        session?.user?.id,
        session?.user?.max_download - 1
      );
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-slate-700 rounded-lg shadow-md text-white flex items-center mt-2">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="bg-white text-slate-800 p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4"
      >
        {isPlaying ? <TbPlayerPause /> : <TbPlayerPlay />}
      </button>

      {/* Time and Duration */}
      <div className="text-sm font-mono text-gray-400 mr-4">
        {currentTime} / {duration}
      </div>

      {/* Custom Progress Bar */}
      <div
        className="flex-grow h-1.5 bg-gray-500 rounded-full overflow-hidden mr-4 relative cursor-pointer"
        onClick={src && handleProgressClick}
        ref={progressRef}
      >
        <div
          className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-100"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Download Button */}
      <MdOutlineFileDownload
        className="text-2xl mr-2 cursor-pointer"
        onClick={handleDownload}
      />

      {/* Volume Control */}
      <GiSpeaker className="text-2xl" />
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={handleVolumeChange}
        className="w-20 bg-gray-100 h-0.5 rounded-full appearance-none range-slider"
        style={{ backgroundSize: `${volume}% 100%` }}
      />

      {/* Audio Element */}
      <audio ref={audioRef} src={src} />
    </div>
  );
};

export default AudioPlayer;
