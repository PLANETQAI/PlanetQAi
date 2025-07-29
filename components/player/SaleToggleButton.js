"use client";

import { useState } from 'react';
import { DollarSign, Lock } from 'lucide-react';

export default function SaleToggleButton({ songId, isForSale: initialIsForSale, onStatusChange }) {
  const [isForSale, setIsForSale] = useState(initialIsForSale);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSaleStatus = async () => {
    const newStatus = !isForSale;
    
    // Show confirmation dialog
    const confirmMessage = newStatus 
      ? 'Are you sure you want to mark this song for sale?\n\n' +
        '• Your song will be visible to other users\n' +
        '• You can change this setting anytime\n' +
        '• Private songs are only visible to you'
      : 'Are you sure you want to make this song private?\n\n' +
        '• Your song will no longer be visible to other users\n' +
        '• You can make it public again anytime';
    
    if (!window.confirm(confirmMessage)) {
      return; // User cancelled the action
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isForSale: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update song status');
      }

      const updatedSong = await response.json();
      setIsForSale(updatedSong.isForSale);
      
      if (onStatusChange) {
        onStatusChange(updatedSong);
      }
    } catch (error) {
      console.error('Error updating song status:', error);
      // Revert UI on error
      setIsForSale(!newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleSaleStatus}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isForSale 
          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
      }`}
      title={isForSale ? 'Mark as Private' : 'Mark for Sale'}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-transparent border-t-current border-r-current rounded-full animate-spin" />
      ) : isForSale ? (
        <DollarSign className="w-5 h-5" />
      ) : (
        <Lock className="w-5 h-5" />
      )}
    </button>
  );
}
