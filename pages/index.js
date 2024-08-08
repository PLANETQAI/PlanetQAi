import MusicPlayer from "@/components/planetqproductioncomp/musicplayer";
import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";
// import MusicGenerator from "@/components/player/composer";
import MusicGenerator from "@/components/player/SunoConsumer";
import Head from "next/head";
import { CiMusicNote1 } from "react-icons/ci";
import { FaArrowDown } from "react-icons/fa6";

export default function Home(initialVideoLink) {
  const backgroundImageStyle = {
    backgroundImage: 'url("/images/back.png")',
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    minHeight: "100vh",
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

        <div className=" w-full lg:w-3/4 px-8 m-auto py-14 ">
          <div className=" lg:flex lg:gap-5 ">
            <button className="bg-gradient-to-t from-slate-600 to-slate-500 text-white flex justify-between items-center p-4 rounded mb-5 w-full hover:from-slate-500 hover:to-slate-600 transition-colors duration-300 shadow-lg text-sm gap-2">
              Futuristic hip hop song About life in the future
              <FaArrowDown className="text-purple-500" />
            </button>
            <button className="bg-gradient-to-t from-slate-600 to-slate-500 text-white flex justify-between items-center p-4 rounded mb-5 w-full hover:from-slate-500 hover:to-slate-600 transition-colors duration-300 text-sm gap-2">
              Futuristic r&b song about the future
              <FaArrowDown className="text-purple-500" />
            </button>
            <button className="bg-gradient-to-t from-slate-600 to-slate-500 text-white flex justify-between items-center p-4 rounded mb-5 w-full hover:from-slate-500 hover:to-slate-600 transition-colors duration-300 text-sm gap-2">
            Futuristic Rock song about a rainy Day in the future
              <FaArrowDown className="text-purple-500" />
            </button>
          </div>
          <MusicGenerator/>
          {/* <span className=" text-yellow-400 ">Comming soon</span>
          <div className="relative">
            <input
              className="w-full bg-[#333A44] border-2 border-white shadow-lg p-5 text-xl text-white rounded "
              type="text"
              placeholder="Type Your Thoughts"
            />
            <button className=" bg-purple-500 text-white p-2 rounded absolute right-5 transform -translate-y-1/2 top-1/2 flex items-center ">
              Create <CiMusicNote1 />
            </button>
          </div> */}
        </div>

        <h1 className="animate-text text-center bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-2xl font-black md:text-4xl pb-10">
          AI. Audio Player Presented By Planet Q Productions
        </h1>
      </div>
    </>
  );
}

export async function getStaticProps() {
  // Fetch initial video link here if needed
  const initialVideoLink = "https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG";
  return {
    props: {
      initialVideoLink,
    },
  };
}

//https://cdn1.suno.ai/image_d552114f-0ba9-4015-be3b-6b0effd3db9b.png



//{"_id":{"$oid":"65d4780b9a8d0af4c341c673"},"email":"planetqproductions@gmail.com","password":"1234567","sessionId":"cs_test_a1MzI76ogZUnQJEvD1Ix2ITEufRsDLJBkEEWsUBYK5h9CA2MRRkdDeyt9U","userType":"premium","fullName":"planetqproductions","role":"admin"}