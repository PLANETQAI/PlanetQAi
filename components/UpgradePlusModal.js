import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import { FaRegLightbulb } from "react-icons/fa";
import { BsShieldLock } from "react-icons/bs";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useSession } from "next-auth/react";

export default function UpgradePlusModal({ close }) {
  const {
    data: { user },
  } = useSession();

  return (
    <>
      <div
        onClick={close}
        className="fixed w-full h-full inset-0 z-10 bg-black/50 cursor-pointer"
      ></div>
      <div className="rounded-lg w-[95%] md:w-[600px] lg:w-[600px] bg-[#333A44] p-10 absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 shadow-lg border border-gray-600">
        <h2 className="text-2xl font-semibold text-gray-200 mb-6 text-center">
          Buy Packages
        </h2>
        <div className="md:flex lg:flex md:justify-between lg:justify-between md:items-start lg:items-start">
          <div className="w-full md:w-1/2 lg:w-1/2 md:pr-4 lg:pr-4 md:border-r lg:border-r md:border-gray-200 lg:border-gray-200">
            <h3 className="text-lg font-semibold text-gray-300 mb-2 flex items-center">
              <FaRegLightbulb className="mr-2 text-blue-500" /> Basic ($0.99)
            </h3>
            <p className="text-gray-400 mb-3 text-sm">Basic packages</p>
            <ul className="list-none text-gray-300 text-sm">
              <li className="flex items-center mb-2">
                <FiCheckCircle className="mr-2 text-purple-500" />
                Maximum 1 download
              </li>
              <li className="flex items-center mb-2">
                <IoIosCloseCircleOutline className="mr-2 text-red-500" />
                24/7 Premium Support
              </li>
            </ul>
            <form
              action="/api/subscriptions/create-checkout-session"
              method="POST"
            >
              {/* Add a hidden field with the lookup_key of your Price */}
              <input type="hidden" name="lookup_key" value="basic" />
              <input type="hidden" name="user_id" value={user?.id} />
              <input type="hidden" name="max_download" value={1} />
              <button
                className="block md:hidden lg:hidden bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md text-md font-semibold transition duration-300 ease-in-out w-full shadow-md"
              >
                Buy for $0.99
              </button>
            </form>
          </div>
          <div className="w-full md:w-1/2 lg:w-1/2 md:pl-4 lg:pl-4 mt-8 md:mt-0 lg:mt-0">
            <h3 className="text-lg font-semibold text-gray-300 mb-2 flex items-center">
              <BsShieldLock className="mr-2 text-purple-400" /> Premium ($10)
            </h3>
            <p className="text-gray-400 mb-3 text-sm">Premium packages.</p>
            <ul className="list-none text-gray-300 text-sm">
              <li className="flex items-center mb-2">
                <FiCheckCircle className="mr-2 text-purple-500" />
                Maximum 15 download
              </li>
              <li className="flex items-center mb-2">
                <FiCheckCircle className="mr-2 text-purple-500" />
                24/7 Premium Support
              </li>
            </ul>
            <form
              action="/api/subscriptions/create-checkout-session"
              method="POST"
            >
              {/* Add a hidden field with the lookup_key of your Price */}
              {/* Add a hidden field with the lookup_key of your Price */}
              <input type="hidden" name="lookup_key" value="premium" />
              <input type="hidden" name="user_id" value={user?.id} />
              <input type="hidden" name="max_download" value={15} />
              <button
                id="checkout-and-portal-button"
                className="block md:hidden lg:hidden bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-md text-md font-semibold transition duration-300 ease-in-out w-full shadow-md"
              >
                Buy for $10
              </button>
            </form>
          </div>
        </div>
        <div className="hidden md:block lg:block">
          <div className="mt-8 grid md:grid-cols-2 lg:md:grid-cols-2 gap-4">
            <form
              action="/api/subscriptions/create-checkout-session"
              method="POST"
            >
              {/* Add a hidden field with the lookup_key of your Price */}
              <input type="hidden" name="lookup_key" value="basic" />
              <input type="hidden" name="user_id" value={user?.id} />
              <input type="hidden" name="max_download" value={1} />
              <button className="hidden md:block lg:block bg-blue-500 text-white py-3 rounded-md text-md font-semibold transition duration-300 ease-in-out w-full shadow-md cursor-pointer hover:bg-blue-600">
                Buy for $0.99
              </button>
            </form>

            <form
              action="/api/subscriptions/create-checkout-session"
              method="POST"
            >
              {/* Add a hidden field with the lookup_key of your Price */}
              <input type="hidden" name="lookup_key" value="premium" />
              <input type="hidden" name="user_id" value={user?.id} />
              <input type="hidden" name="max_download" value={15} />
              <button
                id="checkout-and-portal-button"
                type="submit"
                className="hidden md:block lg:block bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-md text-md font-semibold transition duration-300 ease-in-out w-full shadow-md"
              >
                Buy for $10
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
