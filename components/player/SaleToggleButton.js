"use client";

import { DollarSign, Lock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';


let renderCount = 0;

export default function SaleToggleButton({ 
  songId, 
  onStatusChange,
  isForSaleProp,
  salePriceProp,
  isLyricsPurchasedProp,
}) {
  renderCount++;

  
  const [salePrice, setSalePrice] = useState(salePriceProp || '5.00');
  const [isForSale, setIsForSale] = useState(isForSaleProp);
  const [isLyricsPurchased, setIsLyricsPurchased] = useState(isLyricsPurchasedProp);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saleType, setSaleType] = useState('full');
  const [isInitialized, setIsInitialized] = useState(false);




  // Load initial state from API
  const handleSave = async (e) => {
    e.preventDefault();
  
    const newIsLyricsPurchased = saleType === 'lyrics';
    const price = parseFloat(salePrice);
    
    if (isNaN(price) || price < 0.99) {
      alert('Please enter a valid price of at least $0.99');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isForSale: true,
          salePrice: price,
          isPublic: true,
          isLyricsPurchased: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update song status');
      }

      const updatedSong = await response.json();    
      if (onStatusChange) {
        onStatusChange(updatedSong);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating song status:', error);
      alert('Failed to update song status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromSale = async () => {
    if (!window.confirm('Are you sure you want to remove this song from sale?')) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isForSale: false,
          isLyricsPurchased: false,
          isPublic: false,
          salePrice: null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update song status');
      }

      const updatedSong = await response.json();
      setIsForSale(false);
      setIsLyricsPurchased(false);
      
      if (onStatusChange) {
        onStatusChange(updatedSong);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating song status:', error);
      alert('Failed to update song status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button
          className={`p-2 rounded-full transition-colors ${
            isForSale 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
          }`}
          title={isForSale ? 'Edit Sale Settings' : 'Mark for Sale'}
        >
          {isForSale ? (
            <DollarSign className="w-5 h-5" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{isForSaleProp ? 'Edit Sale Settings' : 'Put Song Up for Sale'}</DialogTitle>
            <DialogDescription>
              {isForSaleProp 
                ? 'Update your sale settings below.'
                : 'Set your song up for sale by configuring the options below.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">     
            <div className="space-y-2">
              <Label htmlFor="salePrice">Price ($)</Label>
              <Input
                id="salePrice"
                type="number"
                min="0.99"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter price"
                className="w-32"
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum price is $0.99
              </p>
            </div>
            
            {isForSale && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveFromSale}
                  className="w-full"
                >
                  Remove from Sale
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
