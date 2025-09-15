'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  UserIcon, 
  MusicalNoteIcon, 
  CreditCardIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSongs: 0,
    totalCreditsUsed: 0,
    recentUsers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real implementation, you would fetch this data from your API
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // For demo purposes, we'll use placeholder data
  const placeholderStats = {
    totalUsers: 120,
    totalSongs: 450,
    totalCreditsUsed: 12500,
    recentUsers: [
      { id: '1', fullName: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString(), credits: 25 },
      { id: '2', fullName: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString(), credits: 50 },
      { id: '3', fullName: 'Mike Johnson', email: 'mike@example.com', createdAt: new Date().toISOString(), credits: 10 },
    ]
  };

  // Use placeholder data if the API isn't implemented yet
  const displayStats = stats.totalUsers ? stats : placeholderStats;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-400">Total Users</h2>
              <p className="text-2xl font-semibold">{displayStats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <MusicalNoteIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-400">Total Songs</h2>
              <p className="text-2xl font-semibold">{displayStats.totalSongs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-400">Total Credits Used</h2>
              <p className="text-2xl font-semibold">{displayStats.totalCreditsUsed}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users" className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Manage Users
          </Link>
          <Link href="/admin/songs" className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg flex items-center">
            <MusicalNoteIcon className="h-5 w-5 mr-2" />
            Review Songs
          </Link>
          <Link href="/admin/newsletter" className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Send Newsletter
          </Link>
        </div>
      </div>
      
      {/* Recent Users */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Credits</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {displayStats.recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.credits}</td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/users/${user.id}`} className="text-indigo-400 hover:text-indigo-300">
                      View
                    </Link>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
