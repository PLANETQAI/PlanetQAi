'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RADIO_SUBSCRIPTION_PLANS } from '@/lib/stripe_package';
import { Menu, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { MoreVertical, Star } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
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
  const [editingUser, setEditingUser] = useState(null);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState('credits');
  const [selectedRadioPlan, setSelectedRadioPlan] = useState('');
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [isRemovingSubscription, setIsRemovingSubscription] = useState(false);
  const [subscriptionToRemove, setSubscriptionToRemove] = useState(null);

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
      console.log("User Data", data.users);
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

  const handleAddCredits = async () => {
    if (isAddingCredits) return;
    
    let amount = parseInt(creditAmount);
    if (creditType === 'radio' && !selectedRadioPlan) {
      toast.error('Please select a radio plan');
      return;
    }
    
    setIsAddingCredits(true);
    
    if (creditType === 'radio') {
      const plan = RADIO_SUBSCRIPTION_PLANS.find(p => p.id === selectedRadioPlan);
      if (plan) {
        amount = plan.credits;
      }
    }

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid credit amount');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}/credits`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount,
          creditType,
          planId: creditType === 'radio' ? selectedRadioPlan : undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add credits');
      }

      const data = await response.json();
      toast.success(data.message || `Successfully added ${amount} credits to ${editingUser.email}`);
      setIsCreditDialogOpen(false);
      setCreditAmount('');
      fetchUsers();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error(error.message || 'Failed to add credits. Please try again.');
    } finally {
      setIsAddingCredits(false);
    }
  };

  const openCreditDialog = (user) => {
    setEditingUser(user);
    setCreditAmount('');
    setCreditType('credits');
    setSelectedRadioPlan('');
    setIsCreditDialogOpen(true);
  };

  const confirmRemoveSubscription = (user) => {
    setSubscriptionToRemove(user);
  };

  const removeRadioSubscription = async () => {
    if (!subscriptionToRemove || isRemovingSubscription) return;
    
    setIsRemovingSubscription(true);
    
    try {
      const response = await fetch(`/api/admin/users/${subscriptionToRemove.id}/radio-subscription`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove radio subscription');
      }

      const data = await response.json();
      toast.success(data.message || 'Radio subscription removed successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error removing radio subscription:', error);
      toast.error(error.message || 'Failed to remove radio subscription');
    } finally {
      setIsRemovingSubscription(false);
      setSubscriptionToRemove(null);
    }
  };

  const handleRadioPlanSelect = (planId) => {
    const plan = RADIO_SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (plan) {
      setCreditAmount(plan.credits.toString());
    }
    setSelectedRadioPlan(planId);
  };

  const confirmAction = async () => {
    try {
      if (!selectedUser) return;

      // Prepare the request based on action type
      let method = 'PATCH';
      let requestBody = { 
        action: actionType,
        userId: selectedUser.id 
      };

      // For delete action, use DELETE method
      if (actionType === 'delete') {
        method = 'DELETE';
      } else if (actionType === 'addCredits') {
        const amount = parseInt(creditAmount) || 0;
        if (amount <= 0) {
          throw new Error('Please enter a valid credit amount');
        }
        requestBody.credits = amount;
      }

      // Construct the API URL
      const apiUrl = actionType === 'delete'
        ? `/api/admin/users?userId=${selectedUser.id}`
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
        const amount = parseInt(creditAmount) || 0;
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, credits: data.credits } : u));
        toast.success(`Added ${amount} credits to ${selectedUser.fullName}`);
        setCreditAmount(''); // Clear the input field
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Radio Subcription</th>
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
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
                      <td className="px-6 py-4 whitespace-nowrap">{user.radioCredits}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="relative">
                          <Menu>
                            {({ open }) => (
                              <>
                                <Menu.Button className="flex items-center text-gray-400 hover:text-gray-200 focus:outline-none">
                                  <MoreVertical className="h-5 w-5" />
                                </Menu.Button>

                                <Transition
                                  as={Fragment}
                                  show={open}
                                  enter="transition ease-out duration-100"
                                  enterFrom="transform opacity-0 scale-95"
                                  enterTo="transform opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="transform opacity-100 scale-100"
                                  leaveTo="transform opacity-0 scale-95"
                                >
                                  <Menu.Items static className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1 px-2">
                                      <div className="flex flex-col space-y-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openCreditDialog(user)}
                                          className="w-full justify-start"
                                        >
                                          Add Credits
                                        </Button>
                                        {user.isRadioSubscribed && (
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => confirmRemoveSubscription(user)}
                                            disabled={isRemovingSubscription}
                                            className="w-full justify-start"
                                          >
                                            {isRemovingSubscription && subscriptionToRemove?.id === user.id ? 'Removing...' : 'Remove Radio'}
                                          </Button>
                                        )}
                                      </div>
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => {
                                              setCreditAmount('1000000');
                                              handleUserAction(user, 'addCredits');
                                            }}
                                            className={`${active ? 'bg-gray-700 text-white' : 'text-gray-200'
                                              } flex w-full items-center px-4 py-2 text-sm`}
                                          >
                                            <Star className="h-4 w-4 mr-2 text-yellow-400" />
                                            Make VIP (1 Credit)
                                          </button>
                                        )}
                                      </Menu.Item>

                                      {/* Other Actions */}
                                      {!user.isVerified && (
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              onClick={() => handleUserAction(user, 'verify')}
                                              className={`${active ? 'bg-gray-700 text-white' : 'text-gray-200'
                                                } flex w-full items-center px-4 py-2 text-sm`}
                                            >
                                              <CheckCircleIcon className="h-4 w-4 mr-2 text-green-400" />
                                              Verify User
                                            </button>
                                          )}
                                        </Menu.Item>
                                      )}

                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => handleUserAction(user, 'suspend')}
                                            className={`${active ? 'bg-gray-700 text-white' : 'text-gray-200'
                                              } flex w-full items-center px-4 py-2 text-sm`}
                                          >
                                            <XCircleIcon className="h-4 w-4 mr-2 text-yellow-400" />
                                            {user.suspended ? 'Unsuspend' : 'Suspend'} User
                                          </button>
                                        )}
                                      </Menu.Item>

                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => handleUserAction(user, 'delete')}
                                            className={`${active ? 'bg-red-600 text-white' : 'text-red-400'
                                              } flex w-full items-center px-4 py-2 text-sm`}
                                          >
                                            <TrashIcon className="h-4 w-4 mr-2" />
                                            Delete User
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </div>
                                  </Menu.Items>
                                </Transition>
                              </>
                            )}
                          </Menu>
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
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md ${currentPage === 1
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
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md ${currentPage === totalPages
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
              {actionType === 'addCredits' && `Add ${creditAmount} credits to user ${selectedUser.fullName}?`}
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
                className={`px-4 py-2 rounded-md ${actionType === 'delete'
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

      {/* Credit Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Credits to {editingUser?.email}</DialogTitle>
            <DialogDescription>
              Enter the number of credits to add to this user's account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6 w-full">
            <div className="space-y-4 w-full">
              <div className="space-y-2">
                <Label>Credit Type</Label>
                <Select 
                  value={creditType} 
                  onValueChange={(value) => {
                    setCreditType(value);
                    setSelectedRadioPlan('');
                    setCreditAmount('');
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select credit type" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="credits" className="w-full">Regular Credits</SelectItem>
                    <SelectItem value="radio" className="w-full">Radio Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {creditType === 'radio' ? (
                <div className="space-y-2 w-full">
                  <Label>Radio Plan</Label>
                  <Select 
                    value={selectedRadioPlan}
                    onValueChange={handleRadioPlanSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a radio plan" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {RADIO_SUBSCRIPTION_PLANS.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id} className="w-full">
                          {plan.name} ({plan.credits} credits - {plan.interval_count} month{plan.interval_count > 1 ? 's' : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 w-full">
                  <Label htmlFor="creditAmount">Credit Amount</Label>
                  <Input
                    id="creditAmount"
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter credit amount"
                    className="w-full"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleAddCredits}
              disabled={isAddingCredits}
              className="flex items-center gap-2"
            >
              {isAddingCredits ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : 'Add Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Subscription Confirmation Dialog */}
      <Dialog 
        open={!!subscriptionToRemove} 
        onOpenChange={(open) => !open && setSubscriptionToRemove(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Radio Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the radio subscription for {subscriptionToRemove?.email}?
              This will clear all radio subscription data and set radio credits to 0.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSubscriptionToRemove(null)}
              disabled={isRemovingSubscription}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={removeRadioSubscription}
              disabled={isRemovingSubscription}
              className="flex items-center gap-2"
            >
              {isRemovingSubscription ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removing...
                </>
              ) : 'Remove Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
