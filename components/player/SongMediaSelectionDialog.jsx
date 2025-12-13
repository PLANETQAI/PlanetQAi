'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Image as ImageIcon, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const SongMediaSelectionDialog = ({ isOpen, onClose, onSelectMedia, songId }) => {
  const [activeTab, setActiveTab] = useState('video');
  const [allMedia, setAllMedia] = useState([]); // Store all fetched media
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isSaving, setIsSaving] = useState(false); // New state for saving status

  useEffect(() => {
    if (isOpen) {
      fetchAllMedia();
      setSelectedMedia(null); // Reset selected media when dialog opens
    }
  }, [isOpen]);

  const fetchAllMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch videos
      const videoResponse = await fetch(`/api/media?type=video`);
      if (!videoResponse.ok) throw new Error('Failed to fetch video media');
      const videoData = await videoResponse.json();

      // Fetch images
      const imageResponse = await fetch(`/api/media?type=image`);
      if (!imageResponse.ok) throw new Error('Failed to fetch image media');
      const imageData = await imageResponse.json();

      setAllMedia([...(videoData.data || []), ...(imageData.data || [])]);
    } catch (err) {
      console.error('Error fetching all media:', err);
      setError('Failed to load media');
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    setSelectedMedia(item);
  };

  const handleConfirmSelection = async () => {
    if (selectedMedia) {
      setIsSaving(true); // Set saving state to true
      try {
        const updatePayload = {};
        if (selectedMedia.mediaType === 'video') {
          updatePayload.videoUrl = selectedMedia.fileUrl;
          updatePayload.thumbnailUrl = selectedMedia.thumbnailUrl; // Also update thumbnail for video
        } else {
          updatePayload.thumbnailUrl = selectedMedia.fileUrl;
          updatePayload.videoUrl = null; // Ensure videoUrl is null if an image is selected
        }

        const response = await fetch(`/api/songs/${songId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          throw new Error('Failed to update song media');
        }

        const updatedSong = await response.json();
        toast.success('Song media updated successfully!');
        onSelectMedia(updatedSong); // Notify parent component of the update
        onClose();
      } catch (err) {
        console.error('Error updating song media:', err);
        toast.error(err.message || 'Failed to update song media.');
      } finally {
        setIsSaving(false); // Reset saving state
      }
    }
  };

  const filteredMedia = allMedia.filter(item => item.mediaType === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Media for Song</DialogTitle>
          <DialogDescription>
            Choose a video or image to associate with your song.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-4">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" /> Videos
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Images
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-hidden">
            <TabsContent value={activeTab} className="h-full overflow-y-auto pr-2">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-muted rounded-lg aspect-video" />
                  ))}
                </div>
              ) : error ? (
                <p className="text-destructive text-center">{error}</p>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  {activeTab === 'video' ? (
                    <Video className="w-12 h-12 mb-4" />
                  ) : (
                    <ImageIcon className="w-12 h-12 mb-4" />
                  )}
                  <p>No {activeTab}s found. Generate some in the AI Studio!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredMedia.map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`cursor-pointer relative overflow-hidden group ${
                        selectedMedia?.id === item.id ? 'border-2 border-primary ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="aspect-video bg-muted relative">
                        {item.mediaType === 'video' ? (
                          <>
                            <video
                              src={item.fileUrl}
                              className="w-full h-full object-cover"
                              poster={item.thumbnailUrl}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Video className="w-8 h-8 text-white" />
                            </div>
                          </>
                        ) : (
                          <Image
                            src={item.fileUrl || '/images/placeholder.png'}
                            alt={item.title || 'Generated image'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                        {selectedMedia?.id === item.id && (
                          <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2 text-sm truncate">
                        {item.title || `Untitled ${item.mediaType}`}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSelection} disabled={!selectedMedia || isSaving}>
            {isSaving ? 'Saving...' : 'Set as Song Media'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SongMediaSelectionDialog;