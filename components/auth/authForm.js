import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import HashLoader from "react-spinners/HashLoader";
import Image from "next/image";

const override = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "0 auto",
  borderColor: "red",
  height: "100vh",
};

export default function AuthForm() {
  const loginEmailInputRef = useRef();
  const loginPasswordInputRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const submitHandler = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const enteredEmail = loginEmailInputRef.current.value;
    const enteredPassword = loginPasswordInputRef.current.value;

    const result = await signIn("credentials", {
      redirect: false,
      email: enteredEmail,
      password: enteredPassword,
    });

    if (!result.error) {
      router.push("/planetqproductions");
      toast.success("Success!", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      event.target.reset();
    }
    if (result.error) {
      toast.error(result.error, {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <HashLoader
        color="#ffffff"
        loading={isLoading}
        cssOverride={override}
        size={100}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    );
  }

  return (
    <>
      <ToastContainer autoClose={1500} draggable closeOnClick />
      <div className="h-screen w-screen flex min-h-full flex-1  flex-col justify-center px-6 py-12 lg:px-8 bg-[#333A44]">
        <div className=" flex justify-center items-center flex-col sm:mx-auto sm:w-full sm:max-w-sm">
          <Link href={"/"}>
            <Image
              src="/images/small.webp"
              alt="Your Logo"
              width={135}
              height={150}
              className="rounded-2xl"
            ></Image>
          </Link>

          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-300">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={submitHandler}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-300"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  ref={loginEmailInputRef}
                  required
                  className="block w-full rounded-md px-2 border-0 py-1.5 text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-gray-300"
                >
                  Password
                </label>
                <div className="text-sm">
                  <Link href="/forgetpassword" legacyBehavior>
                    <a className="font-semibold text-indigo-600 hover:text-indigo-500">
                      Forgot password?
                    </a>
                  </Link>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  ref={loginPasswordInputRef}
                  required
                  className="block w-full px-2 rounded-md border-0 py-1.5 text-3ray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {isLoading ? "Processing" : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
