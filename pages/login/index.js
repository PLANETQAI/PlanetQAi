import Head from "next/head";
import AuthForm from "@/components/auth/authForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Login() {
  const {data: session} = useSession()
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/aistudio");
    }
  }, [router, session]);

  return (
    <>
      <Head>
        <title>PlanetQProductions</title>
        <meta name="description" content="planet q productions music player" />
        <link rel="icon" href="/images/small.webp" />
      </Head>
      <AuthForm />
    </>
  );
}
