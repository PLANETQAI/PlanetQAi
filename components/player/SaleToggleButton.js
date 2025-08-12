"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Lock } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';


export default function SaleToggleButton({ songId, onStatusChange, isSetForSale }) {
  const [salePrice, setSalePrice] = useState('5.00');
  const [isLyricsPurchased, setIsLyricsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saleType, setSaleType] = useState('full');
  const [isInitialized, setIsInitialized] = useState(false);
console.log(isSetForSale)
  // Load initial state from API
  useEffect(() => {
    const fetchSongStatus = async () => {
      try {
        const response = await fetch(`/api/songs/${songId}`);
        if (response.ok) {
          const song = await response.json();
          console.log("Song", song)
          setSalePrice(song.salePrice ? song.salePrice.toString() : '5.00');
          setIsLyricsPurchased(song.isLyricsPurchased || false);
          setSaleType(song.isLyricsPurchased ? 'lyrics' : 'full');
        }
      } catch (error) {
        console.error('Error fetching song status:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    fetchSongStatus();
  }, [songId]);

  const handleToggle = (e) => {
    e.preventDefault();
    setIsDialogOpen(true);
  };

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
          isLyricsPurchased: newIsLyricsPurchased
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update song status');
      }

      const updatedSong = await response.json();
      setIsForSale(updatedSong.isForSale);
      setSalePrice(updatedSong.salePrice);
      setIsLyricsPurchased(updatedSong.isLyricsPurchased);
      
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

  if (!isInitialized) {
    return (
      <button className="p-2 rounded-full bg-gray-700/50 text-gray-400 opacity-50 cursor-not-allowed">
        <div className="w-5 h-5 border-2 border-transparent border-t-current border-r-current rounded-full animate-spin" />
      </button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`p-2 rounded-full transition-colors ${
            isSetForSale 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
          }`}
          title={isSetForSale ? 'Edit Sale Settings' : 'Mark for Sale'}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-transparent border-t-current border-r-current rounded-full animate-spin" />
          ) : isSetForSale ? (
            <DollarSign className="w-5 h-5" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{isSetForSale ? 'Edit Sale Settings' : 'Put Song Up for Sale'}</DialogTitle>
            <DialogDescription>
              {isSetForSale 
                ? 'Update your sale settings below.'
                : 'Set your song up for sale by configuring the options below.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="saleType">What would you like to sell?</Label>
              <RadioGroup 
                id="saleType"
                value={saleType}
                onValueChange={setSaleType}
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full-song" />
                  <Label htmlFor="full-song">Full Song (Audio + Lyrics)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lyrics" id="lyrics-only" />
                  <Label htmlFor="lyrics-only">Lyrics Only</Label>
                </div>
              </RadioGroup>
            </div>
            
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
            
            {isSetForSale && (
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
