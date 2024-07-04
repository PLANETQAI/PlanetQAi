import Head from "next/head";
import SignupForm from "@/components/auth/signupForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Login() {
  const {data: session} = useSession()
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [router, session]);

  return (
    <>
      <Head>
        <title>Planet-Q-Production</title>
        <meta name="description" content="planet q production music player" />
        <link rel="icon" href="/images/small.webp" />
      </Head>
      <SignupForm />
    </>
  );
}
