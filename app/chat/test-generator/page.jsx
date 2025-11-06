'use client';

import { useState } from "react";
import GenerateSong from "../_components/GenerateSong";

export default function ChatPage() {
const [showDialog, setShowDialog] = useState(false)
  
  const songsToGenerate = [
    {
      title: "Summer Vibes",
      prompt: "Upbeat pop song about summer",
      tags: ["pop", "upbeat", "summer"]
    },
    {
      title: "Midnight Dreams",
      prompt: "Dreamy ballad about late nights",
      tags: ["ballad", "dreamy", "night"]
    }
  ]

  return (
     <>
      <button onClick={() => setShowDialog(true)} className="bg-green-500 mt-40 mx-30 hover:bg-blue-600 text-white py-2 px-4 rounded">
        Generate Song
      </button>
      
      <GenerateSong
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        songDetailsQueue={songsToGenerate}
        onSuccess={(newSongs) => {
          console.log('Song completed!', newSongs)
        }}
        onAllComplete={(allSongs) => {
          console.log('All songs done!', allSongs)
          // Refresh your main song list
        }}
      />
    </>
  );
}