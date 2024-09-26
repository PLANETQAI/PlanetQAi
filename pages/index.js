import { useState } from 'react';
import MusicPlayer from "@/components/planetqproductioncomp/musicplayer";
import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";
import MusicGenerator from "@/components/player/SunoConsumer";
import Head from "next/head";
import { FaArrowDown } from "react-icons/fa6";
import ReactPlayer from "react-player";
import Main from "./home/Main";

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
      text: "[Verse 1]\nWalking through neon streets\nHolograms flicker and dance\nRobots and humans intertwine\nIn this brave new romance\n\n[Chorus]\nIn the year 3000\nWhere dreams come alive\nTechnology and humanity\nLearning to survive\n\n[Verse 2]\nFlying cars zoom overhead\nVirtual reality's our new bed\nAI assistants guide our way\nThrough this futuristic day\n\n[Bridge]\nBut in this world of steel and chrome\nWe're searching for a place called home\nHuman touch, a rare delight\nIn the glow of cybernetic light\n\n[Chorus]\nIn the year 3000\nWhere dreams come alive\nTechnology and humanity\nLearning to survive",
      tags: "futuristic, electronic, synthwave",
      title: "Year 3000"
    },
    {
      text: "[Verse 1]\nDigital love in the palm of my hand\nSwipe right, it's a perfect match\nVirtual hearts, they expand\nIn this new world, we're trying to catch\n\n[Chorus]\nLove in the age of ones and zeros\nFeeling real in a world that's virtual\nCan we find our digital heroes?\nIn this romance that's truly plural\n\n[Verse 2]\nVideo calls replace tender touch\nEmojis speak louder than words\nIn this age, we long for so much\nOur feelings fly high like birds\n\n[Bridge]\nBut beneath the screens and the codes\nBeats a heart that's truly human\nNavigating these new love modes\nIn a dance that's old and new, man\n\n[Chorus]\nLove in the age of ones and zeros\nFeeling real in a world that's virtual\nCan we find our digital heroes?\nIn this romance that's truly plural",
      tags: "r&b, futuristic, romantic",
      title: "Digital Love Story"
    },
    {
      text: "[Verse 1]\nCyber raindrops on my window\nPixelated puddles down below\nThunder claps in surround sound\nIn this future storm, I'm spellbound\n\n[Chorus]\nNeon rain, falling down\nWashing clean this techno town\nLightning strikes the VR sky\nIn this downpour, we can't deny\n\n[Verse 2]\nUmbrellas glow with LED lights\nGuiding us through augmented nights\nWeather control's on the fritz again\nMaking this shower more than just pretend\n\n[Bridge]\nBut in this deluge of data and dreams\nNature finds a way, or so it seems\nReminds us all, as the droplets fall\nWe're part of something beyond our firewall\n\n[Chorus]\nNeon rain, falling down\nWashing clean this techno town\nLightning strikes the VR sky\nIn this downpour, we can't deny",
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

      <Main />

      {/* <div style={backgroundImageStyle}>
        <GlobalHeader />

        <MusicPlayer initialVideoLink={initialVideoLink} />

        <div className="w-full lg:w-3/4 px-8 m-auto py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                className="bg-gradient-to-t from-slate-600 to-slate-500 text-white flex flex-col justify-between items-start p-4 rounded mb-5 w-full hover:from-slate-500 hover:to-slate-600 transition-colors duration-300 shadow-lg text-sm"
                onClick={() => handlePromptClick(prompt)}
              >
                <div className="font-bold mb-2">{prompt.title}</div>
                <div className="text-xs mb-2 text-gray-300">{prompt.tags}</div>
                <div className="text-xs text-left overflow-hidden h-20">
                  {prompt.text.split('\n').slice(0, 4).join('\n')}...
                </div>
                <div className="w-full text-right mt-2">
                  <FaArrowDown className="text-purple-500 inline" />
                </div>
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
      </div> */}
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
