"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';


let renderCount = 0;

export default function MediaSaleToggleButton({ 
  mediaId, 
  onStatusChange,
  isForSale: initialIsForSale = false,
  salePrice: initialSalePrice,
}) {
  const [salePrice, setSalePrice] = useState(initialSalePrice ? initialSalePrice.toString() : '7.00');
  const [isForSale, setIsForSale] = useState(initialIsForSale);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setIsForSale(initialIsForSale);
    if (initialSalePrice) {
      setSalePrice(initialSalePrice.toString());
    }
  }, [initialIsForSale, initialSalePrice]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    const price = parseFloat(salePrice);
    
    if (isNaN(price) || price < 0.99) {
      alert('Please enter a valid price of at least $0.99');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isForSale: true,
          salePrice: price,
          isPublic: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update media status');
      }

      const updatedMedia = await response.json();
      setIsForSale(true);
      
      if (onStatusChange) {
        onStatusChange(updatedMedia.media);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating media status:', error);
      alert('Failed to update media status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromSale = async () => {
    if (!window.confirm('Are you sure you want to remove this media from sale?')) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isForSale: false,
          isPublic: false,
          salePrice: null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update media status');
      }

      const updatedMedia = await response.json();
      setIsForSale(false);
      
      if (onStatusChange) {
        onStatusChange(updatedMedia.media);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating media status:', error);
      alert('Failed to update media status. Please try again.');
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
              ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/40' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/80'
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
            <DialogTitle>{isForSale ? 'Edit Sale Settings' : 'Put Media Up for Sale'}</DialogTitle>
            <DialogDescription>
              {isForSale 
                ? 'Update your sale settings below.'
                : 'Set your media up for sale by configuring the options below.'}
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
