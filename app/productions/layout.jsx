"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

// Dynamically import components with SSR disabled
const StarsWrapper = dynamic(() => import("@/components/canvas/StarsWrapper"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black z-0" />,
});

const RadioLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (path) => pathname === path;

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Albums", path: "/productions/album" },
    { name: "FAQs", path: "/productions/faqs" },
    { name: "About", path: "/productions/about" },
    { name: "Contact", path: "/productions/contact" },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <StarsWrapper />

      {/* Navigation */}
      <header className="relative z-50">
        <nav className="container mx-auto px-4 py-6">
          <div className="flex flex-row md:flex-row md:items-center md:justify-between justify-between">
            <Link href="/radio" className="text-2xl font-bold mb-4 md:mb-0">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                Planet Q Music Store
              </span>
            </Link>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-300 hover:text-cyan-400 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-wrap gap-6">
              {navLinks.map((link) => (
                <NavLink key={link.path} link={link} isActive={isActive(link.path)} />
              ))}
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="md:hidden absolute top-20 left-0 right-0 bg-gray-900/95 backdrop-blur-sm py-4 px-6 z-50"
                >
                  <div className="flex flex-col space-y-4">
                    {navLinks.map((link) => (
                      <NavLink key={link.path} link={link} isActive={isActive(link.path)} mobile />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>

      <main className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 pt-8 border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Planet Q Radio. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            The Sci-Fi Channel of Hip Hop and R&B
          </p>
        </div>
      </footer>
    </div>
  );
};

const NavLink = ({ link, isActive, mobile = false }) => (
  <Link
    href={link.path}
    className={`relative py-2 text-sm font-medium transition-colors ${
      isActive
        ? "text-cyan-400"
        : "text-gray-300 hover:text-cyan-400"
    } ${mobile ? 'text-lg py-3' : ''}`}
  >
    {link.name}
    {isActive && (
      <motion.span
        layoutId={mobile ? 'activeMobileNavLink' : 'activeNavLink'}
        className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500"
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
        }}
      />
    )}
  </Link>
);

export default RadioLayout;
