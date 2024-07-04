"use client";
import React, { useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

async function sendSongLink(enteredVideoLink) {
  const response = await fetch("/api/link/uploadlink", {
    method: "POST",
    body: JSON.stringify({
      videoLink: enteredVideoLink,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    toast.error(data.message, {
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
    toast.success(data.message, {
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

  return data;
}

export default function AdminLink() {
  const videoLinkInputRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isUpdateThumbnail, setIsUpdateThumbnail] = useState(false);
  const [isDeleteThumbnail, setIsDeleteThumbnail] = useState(false);

  const [fileError, setFileError] = useState("");

  const [isThumbnail, setIsThumbnail] = useState("");

  const submitHandler = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const enteredVideoLink = videoLinkInputRef.current.value;

    const result = await sendSongLink(enteredVideoLink);
    if (result.message === "Link Stored Successfully!") {
      event.target.reset();
    }
    setIsLoading(false);
    event.target.reset();
  };

  function convertToBase64(e) {
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setFileError("No file selected.");

      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) {
      setFileError("Invalid file type. Please select a PNG, JPEG/JPG file.");
      return;
    }

    if (validTypes.includes(selectedFile.type)) {
      setFileError("");
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);

      reader.onload = () => {
        setIsThumbnail(reader.result);
      };

      reader.onerror = (error) => {
        console.error("Error reading the file:", error);
      };
    }
  }

  const deleteLinksHandler = async (event) => {
    event.preventDefault();
    setIsDelete(true);
    const response = await fetch("/api/link/deletelink", {
      method: "DELETE",
      body: JSON.stringify(),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.message, {
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
      toast.success(data.message, {
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
    setIsDelete(false);
  };

  const updateThumbnail = async (event) => {
    event.preventDefault();
    setIsUpdateThumbnail(true);

    const response = await fetch("/api/thumbnail/modifythumbnail", {
      method: "POST",
      body: JSON.stringify({
        ThumbnailImage: isThumbnail,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.message, {
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
      toast.success(data.message, {
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
    setIsUpdateThumbnail(false);
  };

  const thumbnailDeleteHandler = async (event) => {
    event.preventDefault();
    setIsDeleteThumbnail(true);
    const response = await fetch("/api/thumbnail/modifythumbnail", {
      method: "DELETE",
      body: JSON.stringify(),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.message, {
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
      toast.success(data.message, {
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
    setIsDeleteThumbnail(false);
  };

  return (
    <>
      <ToastContainer
        className="bg-transparent"
        autoClose={1500}
        draggable
        closeOnClick
      />
      <section className="bg-transparent flex gap-4 flex-col lg:flex-row justify-center py-4">
        <div className="bg-transparent flex flex-col gap-6">
          <form
            className="bg-transparent flex flex-col gap-2 justify-center items-center"
            onSubmit={submitHandler}
          >
            <label
              htmlFor="email"
              className="block bg-transparent text-md font-bold leading-6 text-yellow-500   relative group md:text-white"
              data-tooltip-target="tooltip-right"
              data-tooltip-placement="right"
            >
              Please insert the link here.
              <span className="absolute text-center w-full top-full left-full transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out group-hover:opacity-100">
                YouTube, SoundCloud, Facebook, Vimeo, Wistia, Mixcloud,
                Dailymotion, and Twitch here.
              </span>
            </label>
            <div className="bg-transparent">
              <input
                id="link"
                name="link"
                type="text"
                autoComplete="email"
                required
                ref={videoLinkInputRef}
                className="block bg-transparent w-72 rounded-full border-0 px-4 py-0.5 text-gray-300 shadow-sm ring-2 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <button
              disabled={isLoading}
              type="submit"
              className="flex justify-center w-30 uppercase rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-900"
            >
              {isLoading ? "Submitting..." : "Submit Link"}
            </button>
          </form>
          <form
            onSubmit={updateThumbnail}
            className="bg-transparent flex gap-2 justify-center items-center flex-col"
          >
            <div className="bg-transparent flex flex-col justify-center items-center mx-4">
              <label
                htmlFor="cover-photo"
                className="block bg-transparent text-md text-center font-bold leading-6 text-yellow-500 md:text-white"
              >
                Update the thumbnail picture with an upload here
              </label>
              <div className="mt-2 py-2 bg-transparent flex justify-center rounded-lg border border-dashed border-indigo-600 px-20">
                <div className="text-center bg-transparent">
                  <svg
                    className="mx-auto bg-transparent h-12 w-12 text-gray-300"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      className="bg-transparent"
                      d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="mt-4 flex bg-transparent justify-center items-center text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative px-2 bg-transparent cursor-pointer rounded-md bg-gray-300 font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span className="bg-transparent underline">
                        Upload a picture/gif
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="bg-transparent sr-only"
                        onChange={convertToBase64}
                      ></input>
                    </label>
                    <p className="pl-1 bg-transparent font-bold text-xs text-indigo-600">
                      or drag and drop
                    </p>
                  </div>
                  <p className="text-xs bg-transparent font-bold leading-5 text-indigo-600">
                    PNG, JPG/JPEG up to 10MB
                  </p>
                </div>
              </div>
              {fileError && (
                <div
                  style={{
                    textAlign: "center",
                    color: "red",
                    fontSize: "0.75rem",
                    marginTop: "0.5rem",
                    background: "Transparent",
                  }}
                >
                  {fileError}
                </div>
              )}
            </div>
            <button
              disabled={isUpdateThumbnail}
              type="submit"
              className="flex justify-center uppercase w-30 rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-900"
            >
              {isUpdateThumbnail ? "Updating..." : "Update Thumbnail"}
            </button>
          </form>
        </div>

        <div className="bg-transparent flex flex-col justify-around">
          <form
            onSubmit={deleteLinksHandler}
            className="bg-transparent flex flex-col justify-center items-center"
          >
            <h2 className="bg-transparent uppercase font-extrabold text-center text-yellow-500">
              if you want to remove all Video/Music links, Click here
            </h2>
            <button
              disabled={isDelete}
              type="submit"
              className="flex justify-center w-30 rounded-md bg-indigo-600 uppercase px-3 py-1 text-sm font-semibold disabled:bg-indigo-900 leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {isDelete ? "Deleting..." : "Delete Links"}
            </button>
          </form>
          <form
            onSubmit={thumbnailDeleteHandler}
            className="bg-transparent flex flex-col justify-center items-center"
          >
            <h2 className="bg-transparent uppercase font-extrabold text-center text-yellow-500 ">
              if you want to remove Thumbnail, Click here
            </h2>
            <button
              disabled={isDeleteThumbnail}
              type="submit"
              className="flex justify-center w-30 rounded-md bg-indigo-600 uppercase px-3 py-1 text-sm font-semibold disabled:bg-indigo-900 leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {isDeleteThumbnail ? "Deleting..." : "Delete Thumbnail"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
