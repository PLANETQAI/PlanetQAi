'use client';

import { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch real user data from the API
      const response = await fetch(`/api/admin/users?page=${currentPage}&search=${searchTerm}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setIsModalOpen(true);
  };

  const confirmAction = async () => {
    try {
      if (!selectedUser) return;

      // Prepare the request based on action type
      let method = 'PATCH';
      let requestBody = { action: actionType };
      
      // For delete action, use DELETE method
      if (actionType === 'delete') {
        method = 'DELETE';
      } else if (actionType === 'addCredits') {
        requestBody.userId = selectedUser.id;
        requestBody.amount = 50;
      }else if (actionType === 'suspend') {
        requestBody.userId = selectedUser.id;
      }

      // Construct the API URL
      const apiUrl = actionType === 'delete' 
        ? `/api/admin/users/${selectedUser.id}`
        : '/api/admin/users';

      // Call the API
      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' ? JSON.stringify(requestBody) : null
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to perform action');
      }

      // Update UI based on successful action
      if (actionType === 'delete') {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        toast.success(`User ${selectedUser.fullName} has been deleted`);
      } else if (actionType === 'suspend') {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, isSuspended: true } : u));
        toast.success(`User ${selectedUser.fullName} has been suspended`);
      } else if (actionType === 'verify') {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, isVerified: true } : u));
        toast.success(`User ${selectedUser.fullName} has been verified`);
      } else if (actionType === 'addCredits') {
        const data = await response.json();
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, credits: data.credits } : u));
        toast.success(`Added 50 credits to ${selectedUser.fullName}`);
      }

      setIsModalOpen(false);
      
      // Refresh the user list after a short delay
      setTimeout(() => fetchUsers(), 1000);
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error(error.message || 'Failed to perform action');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button 
          onClick={fetchUsers}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by name or email"
            />
          </div>
          <button
            type="submit"
            className="ml-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'Premium' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isVerified ? (
                          <span className="flex items-center text-green-400">
                            <CheckCircleIcon className="h-5 w-5 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-400">
                            <XCircleIcon className="h-5 w-5 mr-1" /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.credits}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleUserAction(user, 'addCredits')}
                            className="text-indigo-400 hover:text-indigo-300"
                            title="Add Credits"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          {!user.isVerified && (
                            <button 
                              onClick={() => handleUserAction(user, 'verify')}
                              className="text-green-400 hover:text-green-300"
                              title="Verify User"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleUserAction(user, 'suspend')}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Suspend User"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleUserAction(user, 'delete')}
                            className="text-red-400 hover:text-red-300"
                            title="Delete User"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-600">
              <div className="flex-1 flex justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-600'
                  }`}
                >
                  Previous
                </button>
                <div className="text-sm text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Action</h3>
            <p className="mb-6">
              {actionType === 'delete' && `Are you sure you want to delete user ${selectedUser.fullName}?`}
              {actionType === 'suspend' && `Are you sure you want to suspend user ${selectedUser.fullName}?`}
              {actionType === 'verify' && `Are you sure you want to verify user ${selectedUser.fullName}?`}
              {actionType === 'addCredits' && `Add 50 credits to user ${selectedUser.fullName}?`}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-md ${
                  actionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
