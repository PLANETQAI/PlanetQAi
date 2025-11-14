'use client';

import {
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  CreditCardIcon,
  EnvelopeIcon,
  HomeIcon,
  MusicalNoteIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check authentication and admin status
    if (status === 'unauthenticated') {
      // Not logged in, redirect to login
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'Admin') {
      // Logged in but not admin, sign out and redirect
      import('next-auth/react').then(({ signOut }) => {
        signOut({ callbackUrl: '/login?error=adminonly' });
      });
    }
    
    // This prevents the session from expiring by refreshing it periodically
    const refreshInterval = setInterval(() => {
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    }, 4 * 60 * 1000); // Refresh every 4 minutes
    
    return () => clearInterval(refreshInterval);
  }, [session, status, router]);

  // Show loading state while checking authentication
  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not admin, don't render anything (will be redirected by useEffect)
  if (session?.user?.role !== 'Admin') {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
    { name: 'Users', href: '/admin/users', icon: UserIcon },
    { name: 'Subscription Plans', href: '/admin/subscription-plans', icon: CreditCardIcon },
    { name: 'Songs', href: '/admin/songs', icon: MusicalNoteIcon },
    { name: 'Media', href: '/admin/media', icon: MusicalNoteIcon },
    { name: 'Newsletter', href: '/admin/newsletter', icon: EnvelopeIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col">
        <div className="flex items-center justify-center mb-8 mt-4">
          <h1 className="text-xl font-bold">PlanetQAi Admin</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto mb-4 space-y-1">
          <Link
            href="/aistudio"
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-md"
          >
            <HomeIcon className="h-5 w-5 mr-3" />
            Back to Site
          </Link>
          <button
            onClick={() => router.push('/api/auth/signout')}
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-md w-full text-left"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
