import MusicPlayer from "@/components/planetqproductioncomp/musicplayer";
import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";
import MusicGenerator from "@/components/player/SunoConsumer";
import Head from "next/head";
import { useState } from 'react';
import { FaArrowDown } from "react-icons/fa6";

export default function Home({ initialVideoLink }) {
  const [selectedPrompt, setSelectedPrompt] = useState({
    text: '',
    tags: '',
    title: ''
  });

  const backgroundImageStyle = {
    backgroundImage: 'url("/images/back.png")',
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    minHeight: "100vh",
  };

  const examplePrompts = [
    {
      text: "Futuristic hip hop song about life in the future",
      tags: "hip hop, futuristic, electronic",
      title: "Future Life"
    },
    {
      text: "Futuristic R&B song about love in a digital age",
      tags: "r&b, futuristic, romantic",
      title: "Digital Love"
    },
    {
      text: "Futuristic Rock song about a rainy day in the future",
      tags: "rock, futuristic, atmospheric",
      title: "Neon Rain"
    }
  ];

  const handlePromptClick = (prompt) => {
    setSelectedPrompt(prompt);
  };

  return (
    <>
      <Head>
        <title>PlanetQProductions</title>
        <meta name="description" content="planet q productions music player" />
        <link rel="icon" href="/images/small.webp" />
      </Head>
      <div style={backgroundImageStyle}>
        <GlobalHeader />
        <MusicPlayer initialVideoLink={initialVideoLink} />
        
        <div className="w-full lg:w-3/4 px-8 m-auto py-14">
          <div className="lg:flex lg:gap-5">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                className="bg-gradient-to-t from-slate-600 to-slate-500 text-white flex justify-between items-center p-4 rounded mb-5 w-full hover:from-slate-500 hover:to-slate-600 transition-colors duration-300 shadow-lg text-sm gap-2"
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt.text}
                <FaArrowDown className="text-purple-500" />
              </button>
            ))}
          </div>
          
          <MusicGenerator
            selectedPrompt={selectedPrompt}
            onPromptChange={setSelectedPrompt}
          />
        </div>
        
        <h1 className="animate-text text-center bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-2xl font-black md:text-4xl pb-10">
          AI Audio Player Presented By Planet Q Productions
        </h1>
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