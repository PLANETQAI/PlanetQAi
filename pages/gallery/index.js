import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AudioPlayer from "@/components/player/audioPlayer";
import Spinner from "@/components/common/Spinner";
import { RiDeleteBin6Line } from "react-icons/ri";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LuLoader } from "react-icons/lu";

export default function Gallery() {
  const { data: session } = useSession();
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDelete, setIsLoadingDelete] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/");
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

  const handleDelete = async (id) => {
  try {
    setIsLoadingDelete(true);
    const response = await fetch(`/api/gallery/delete?id=${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
      
      // Update the local state to remove the deleted song
      setSongs((prevSongs) => prevSongs.filter((song) => song._id !== id));
      
      toast.success("Song successfully deleted.", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } else {
      throw new Error("Failed to delete the song");
    }
  } catch (error) {
    console.error("Error deleting song:", error);
    toast.error("An error occurred while deleting song.", {
      position: "top-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  } finally {
    setIsLoadingDelete(false);
  }
};
  return (
    <>
      <Head>
        <title>PlanetQProductions</title>
        <meta name="description" content="planet q productions music player" />
        <link rel="icon" href="/images/small.webp" />
      </Head>
      <ToastContainer
        className="bg-transparent"
        autoClose={1500}
        draggable
        closeOnClick
      />
      <div style={backgroundImageStyle}>
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-white">Gallery</h1>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {songs.map((song) => (
              <div
                key={song._id}
                style={{ display: "flex", alignItems: "center" }}
              >
                <AudioPlayer src={song?.audioLink} />

                {loadingDelete ? (
                  <LuLoader style={{
                    fontSize: "3rem",
                    color: "white",
                  }} />
                ) : (
                  <RiDeleteBin6Line
                    onClick={() => handleDelete(song._id)}
                    style={{
                      fontSize: "3rem",
                      color: "white",
                      cursor: "pointer",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
