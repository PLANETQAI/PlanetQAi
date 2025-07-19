'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Dynamically import components with SSR disabled
const StarsWrapper = dynamic(
  () => import('@/components/canvas/StarsWrapper'),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-black z-0" /> }
);

const RadioLayout = ({ children }) => {
  const pathname = usePathname();
  const isActive = (path) => pathname === path;

  const navLinks = [
    { name: 'Home', path: '/radio' },
    { name: 'FAQs', path: '/radio/faqs' },
    { name: 'About', path: '/radio/about' },
    { name: 'Contact', path: '/radio/contact' },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <StarsWrapper />
      
      {/* Navigation */}
      <header className="relative z-50">
        <nav className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <Link href="/radio" className="text-2xl font-bold mb-4 md:mb-0">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                Planet Q Radio
              </span>
            </Link>
            
            <div className="flex flex-wrap gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative py-2 text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-cyan-400'
                      : 'text-gray-300 hover:text-cyan-400'
                  }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <motion.span
                      layoutId="activeNavLink"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                      }}
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-gray-800 mt-16">
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

export default RadioLayout;
