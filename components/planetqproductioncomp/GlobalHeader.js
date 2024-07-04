import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import UpgradePlusModal from "../UpgradePlusModal";

export default function GlobalHeader() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchUserData(userId) {
    try {
      const res = await fetch(`/api/singleuser/${userId}`);
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();

      update({
        userType: data.userType,
        sessionId: data.sessionId,
      });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams(window.location.search);

    if (session?.user?.id && query.get("success")) {
      fetchUserData(session.user.id);
    }

    setLoading(false);
  }, [session?.user?.id]);

  async function logoutHandler(event) {
    event.preventDefault();
    if (session) {
      signOut();
    }
  }

  const close = () => {
    setOpen(false);
  };

  return (
    <>
      <div className="text-white bg-transparent flex justify-between items-center gap-4 px-6 py-2">
        <Link
          href="https://planetqproductions.wixsite.com/planet-q-productions"
          className="bg-transparent flex justify-center items-center"
          target="_blank"
        >
          <div className="bg-transparent flex flex-col gap-2 justify-center items-center">
            <Image
              src="/images/client.png"
              alt="Your Logo"
              width={50}
              height={120}
              className="rounded-2xl bg-transparent"
            ></Image>
            <h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">
              View More
            </h1>
          </div>
        </Link>
        {!session && (
            <button
              className="text-white text-md font-bold ring-white ring-1 rounded-lg px-2 hover:underline hover:ring-2 sm:text-2xl"
              onClick={() => router.push("/signup")}
            >
              Create account
            </button>
          )}
        <div className="bg-transparent flex gap-4 justify-center items-center">
          {session && (
            <Link
              href="/planetqproductions"
              className="bg-transparent text-md font-bold hover:underline sm:text-2xl"
            >
              Add Music
            </Link>
          )}
          {session && session.user?.userType !== "premium" && (
            <button
              disabled={loading}
              onClick={() => setOpen(true)}
              className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 text-md font-bold ring-white ring-1 rounded-lg px-2 hover:underline hover:ring-2 sm:text-2xl"
            >
              Update your plan
            </button>
          )}

          {session &&
            session.user?.userType === "premium" &&
            session.user?.sessionId && (
              <form
                action="/api/subscriptions/create-portal-session"
                method="POST"
              >
                <input
                  type="hidden"
                  id="session-id"
                  name="session_id"
                  value={session.user?.sessionId}
                />
                <button
                  type="submit"
                  className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 text-md font-bold ring-white ring-1 rounded-lg px-2 hover:underline hover:ring-2 sm:text-2xl"
                >
                  Manage your plan
                </button>
              </form>
            )}

          {session && (
            <button
              className="text-white text-md font-bold ring-white ring-1 rounded-lg px-2 hover:underline hover:ring-2 sm:text-2xl"
              onClick={logoutHandler}
            >
              Logout
            </button>
          )}

          {!session && (
            <Link
              href="/login"
              className="bg-transparent flex justify-center items-center"
            >
              <div className="bg-transparent flex flex-col gap-2 justify-center items-center">
                <Image
                  src="/images/client.png"
                  alt="Your Logo"
                  width={50}
                  height={120}
                  className="rounded-2xl bg-transparent"
                ></Image>
                <h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">
                  AI Studio
                </h1>
              </div>
            </Link>
          )}
        </div>
        {isOpen && <UpgradePlusModal close={close} />}
      </div>
    </>
  );
}
