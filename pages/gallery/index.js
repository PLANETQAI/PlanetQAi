import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AudioPlayer from "@/components/player/audioPlayer";
import Spinner from "@/components/common/Spinner";

export default function Gallery() {
  const { data: session } = useSession();
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/login");
    } else {
      // Fetch songs when session is available
      fetchSongs();
    }
  }, [router, session]);

  const fetchSongs = async () => {
    try {
      const response = await fetch("/api/gallery/findAll");
      // "/api/link/uploadlink"
      if (!response.ok) {
        throw new Error("Failed to fetch songs");
      }
      const data = await response.json();
      console.log(data);
      setSongs(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching songs:", error);
      setLoading(false);
    }
  };

  const backgroundImageStyle = {
    backgroundImage: 'url("/images/back.png")',
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <Head>
        <title>PlanetQProductions</title>
        <meta name="description" content="planet q productions music player" />
        <link rel="icon" href="/images/small.webp" />
      </Head>
      <div style={backgroundImageStyle}>
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-white">Gallery</h1>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {songs.map((song) => (
              <AudioPlayer key={song._id} src={song?.audioLink} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
