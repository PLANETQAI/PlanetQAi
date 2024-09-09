import AdminLink from "@/components/Home/adminlink";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { CiUser } from "react-icons/ci";
import Link from "next/link";
import { MdOutlineDeleteOutline, MdOutlineVideoLibrary } from "react-icons/md";
import { ImSpinner7 } from "react-icons/im";
import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";
import Spinner from "@/components/common/Spinner";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

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
      const response = await fetch("/api/link/getlink");
      // "/api/link/uploadlink"
      if (!response.ok) {
        throw new Error("Failed to fetch songs");
      }
      const data = await response.json();
      setSongs(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching songs:", error);
      setLoading(false);
    }
  };

  const deleteSong = async (songId) => {
    const confirmed = confirm("Are you sure you want to delete this song?");

    if (!confirmed) {
      return;
    }
    setDeleteLoading(true);
    try {
      const response = await fetch(
        "api/link/deletelink",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ songId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete song");
      }

      // Filter out the deleted song from the state
      setSongs((prevSongs) => prevSongs.filter((song) => song._id !== songId));
      setDeleteLoading(false);
    } catch (error) {
      console.error("Error deleting song:", error);
      setDeleteLoading(false);
    }
  };

  const updateSongStatus = async (songId, newStatus) => {
    try {
      const response = await fetch(
        "/api/link/updatestatus",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ songId, newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update song status");
      }

      // Update the status of the song in the state
      setSongs((prevSongs) =>
        prevSongs.map((song) =>
          song._id === songId ? { ...song, status: newStatus } : song
        )
      );
      setUpdateLoading(false);
    } catch (error) {
      console.error("Error updating song status:", error);
      setUpdateLoading(false);
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
        <AdminLink />

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-white">
            Planet Q Productions Showcase
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {songs.map((song) => (
              <div
                key={song._id}
                className="bg-[#11111146] backdrop-filter backdrop-blur-lg bg-opacity-80 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 relative"
              >
                <div className="flex items-center">
                  <Link href={song.link} target="_blank">
                    {song.thumbnail ? (
                      <img
                        src="/images/small.webp"
                        alt={`${song.title} cover`}
                        className="w-20 h-20 object-cover rounded-md mr-4"
                      />
                    ) : (
                      <MdOutlineVideoLibrary className="w-20 h-20 mr-4 text-violet-600 hover:text-violet-700" />
                    )}
                  </Link>
                  <div>
                    <Link href={song.link} target="_blank">
                      <h2 className="text-xl font-semibold mb-2 text-white hover:underline">
                        {song.title}
                      </h2>
                    </Link>
                    <p className="text-gray-400 flex items-center gap-1">
                      <CiUser /> {song.user?.fullName}
                    </p>
                  </div>
                </div>
                {session?.user?.role === "admin" && (
                  <div className="absolute top-2 right-2 flex gap-3 items-center">
                    <select
                      disabled={updateLoading}
                      name="status"
                      id="status"
                      className={`px-2 py-1 rounded ${
                        song.status === "active"
                          ? "bg-green-500 text-white"
                          : song.status === "pending"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-800 text-white"
                      }`}
                      value={song.status}
                      onChange={(e) =>
                        updateSongStatus(song._id, e.target.value)
                      }
                    >
                      <option
                        value="active"
                        className="bg-green-500 text-white"
                      >
                        Active
                      </option>
                      <option
                        value="pending"
                        className="bg-yellow-500 text-white"
                      >
                        Pending
                      </option>
                    </select>
                    {!deleteLoading ? (
                      <MdOutlineDeleteOutline
                        className="text-red-500 text-2xl hover:text-red-600 cursor-pointer"
                        onClick={() => deleteSong(song._id)}
                      />
                    ) : (
                      <ImSpinner7 className="animate-spin text-gray-400 text-xl" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
