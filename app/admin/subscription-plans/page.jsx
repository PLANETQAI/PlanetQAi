'use client';

import { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/subscription-plans');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      
      const data = await response.json();
      setPlans(data.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error(error.message || 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, plan = null) => {
    setModalType(type);
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      durationDays: parseInt(formData.get('durationDays'), 10),
      features: formData.get('features').split(',').map(f => f.trim()),
    };

    const isCreating = modalType === 'create';
    const url = isCreating ? '/api/admin/subscription-plans' : '/api/admin/subscription-plans';
    const method = isCreating ? 'POST' : 'PUT';

    if (!isCreating) {
      data.id = selectedPlan.id;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save plan');
      }

      toast.success(`Plan ${isCreating ? 'created' : 'updated'} successfully!`);
      fetchPlans();
      closeModal();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(error.message);
    }
  };

  const handleDeactivate = async (plan) => {
    if (!window.confirm(`Are you sure you want to deactivate the "${plan.name}" plan?`)) return;

    try {
      const response = await fetch(`/api/admin/subscription-plans?id=${plan.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate plan');
      }

      toast.success('Plan deactivated successfully');
      fetchPlans();
    } catch (error) {
      console.error('Error deactivating plan:', error);
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Subscription Plan Management</h1>
        <div className="flex space-x-2">
          <button 
            onClick={fetchPlans}
            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={() => openModal('create')}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Plan
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Plan Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Features</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subscribers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{plan.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{plan.durationDays} days</td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-300 truncate max-w-xs">{plan.features.join(', ')}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{plan.subscriberCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {plan.isActive ? (
                        <span className="flex items-center text-green-400">
                          <CheckCircleIcon className="h-5 w-5 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center text-red-400">
                          <XCircleIcon className="h-5 w-5 mr-1" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => openModal('edit', plan)}
                          className="text-indigo-400 hover:text-indigo-300"
                          title="Edit Plan"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {plan.isActive && (
                          <button 
                            onClick={() => handleDeactivate(plan)}
                            className="text-red-400 hover:text-red-300"
                            title="Deactivate Plan"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-lg w-full shadow-xl">
            <h3 className="text-2xl font-bold mb-6">{modalType === 'create' ? 'Create New Plan' : 'Edit Plan'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    defaultValue={selectedPlan?.name || ''}
                    required
                    className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="durationDays" className="block text-sm font-medium text-gray-300 mb-2">Duration (in days)</label>
                  <input
                    type="number"
                    name="durationDays"
                    id="durationDays"
                    defaultValue={selectedPlan?.durationDays || 30}
                    required
                    min="1"
                    className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="features" className="block text-sm font-medium text-gray-300 mb-2">Features (comma-separated)</label>
                  <textarea
                    name="features"
                    id="features"
                    defaultValue={selectedPlan?.features.join(', ') || ''}
                    required
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  {modalType === 'create' ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
