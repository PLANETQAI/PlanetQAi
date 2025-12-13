'use client';

import ShareModal from '@/app/video-player/_components/ShareModal';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { Image as ImageIcon, Play, Share2, Trash2, Video } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react'; // Import useSession

const MediaList = ({ type = 'video', onDelete, className = '' }) => {
  const { data: session } = useSession(); // Get session data
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [previewMedia, setPreviewMedia] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);
  const [shareableLink, setShareableLink] = useState('');


  const handleGenerateLink = (mediaIds) => {
    if (!mediaIds || mediaIds.length === 0) {
      toast.error('Please select at least one media item to share');
      return null;
    }

    try {
      // Use the first media ID directly for sharing
      const mediaId = mediaIds[0];
      
      // Construct the shareable URL with the media ID and /media path
      const shareableLink = `${window.location.origin}/share/${mediaId}/media`;
      
      setShareableLink(shareableLink);
      return shareableLink;
      
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
      return null;
    }
  };

  const handleMediaStatusChange = (updatedMedia) => {
    setMedia(prevMedia => 
      prevMedia.map(item => 
        item.id === updatedMedia.id ? { ...item, ...updatedMedia } : item
      )
    );
    setPreviewMedia(null);
  };

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/media?type=${type}`);
        if (!response.ok) throw new Error('Failed to fetch media');
        const data = await response.json();
        setMedia(data.data || []);
      } catch (err) {
        console.error('Error fetching media:', err);
        setError('Failed to load media');
        toast.error('Failed to load media');
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [type]);

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setMediaToDelete(id);
    setDeleteDialogOpen(true);
    setPreviewMedia(null);
  };

  const handleShareClick = (item, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedMediaIds([item.id]);
    setShowShareModal(true);
    // Ensure preview doesn't open
    setPreviewMedia(null);
  };

  const handleSetAsProfile = async (mediaItem, e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error('You must be logged in to set a profile picture.');
      return;
    }
    if (!mediaItem.fileUrl) {
      toast.error('Media item does not have a valid URL.');
      return;
    }

    try {
      const response = await fetch(`/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profilePictureUrl: mediaItem.fileUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile picture');
      }

      toast.success('Profile picture updated successfully!');
      // Optionally, you might want to refresh user session or update local state
    } catch (err) {
      console.error('Error setting profile picture:', err);
      toast.error(err.message || 'Failed to set profile picture.');
    }
  };

  const confirmDelete = async () => {
    if (!mediaToDelete) return;

    try {
      const response = await fetch(`/api/media/${mediaToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete media');

      setMedia(media.filter(item => item.id !== mediaToDelete));
      toast.success('Media deleted successfully');

      if (onDelete) onDelete(mediaToDelete);
    } catch (err) {
      console.error('Error deleting media:', err);
      toast.error('Failed to delete media');
    } finally {
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setMediaToDelete(null);
  };

  const handleDownload = (url, filename, e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `download-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg aspect-video" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {type === 'video' ? (
          <Video className="w-12 h-12 text-muted-foreground mb-4" />
        ) : (
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
        )}
        <h3 className="text-lg font-medium">No {type}s found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {type === 'video'
            ? 'Your generated videos will appear here.'
            : 'Your generated images will appear here.'}
        </p>
      </div>
    );
  }

  // Add sale price badge if item is for sale
  const renderSaleBadge = (item) => {
    if (!item.isForSale || !item.salePrice) return null;
    
    return (
      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-md z-10">
        ${parseFloat(item.salePrice).toFixed(2)}
      </div>
    );
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 ${className}`}>
      {media.map((item) => (
        <Card
          key={item.id}
          onClick={() => setPreviewMedia(item)}
          className="group cursor-pointer overflow:hidden hover:shadow-lg transition-shadow duration-200"
        >
          <div className="relative aspect-video bg-muted">
            {item.mediaType === 'video' ? (
              <>
                <video
                  src={item.fileUrl}
                  className="w-full h-full object-cover"
                  poster={item.thumbnailUrl}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </>
            ) : item.fileUrl && !imageErrors[item.id] ? (
              <Image
                src={item.fileUrl || '/images/back.png'}
                alt={item.title || 'Generated image'}
                fill
                className="object-cover"
                unoptimized
                onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}


            {item.status === 'processing' ? (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70">
                <p className="text-xs text-white mb-1">Processing...</p>
                <Progress value={item.progress || 0} className="h-1.5" />
              </div>
            ) : renderSaleBadge(item)}
          </div>

          <CardHeader className="p-4">
            {/* <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm truncate">{item.title || 'Untitled'}</h3>
              <Badge variant="outline" className="text-xs">
                {item.mediaType}
              </Badge>
            </div> */}
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          </CardHeader>

          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="flex space-x-1">
              {item.isOwner && (
                <>
                  {item.mediaType === 'image' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-purple-500 hover:bg-purple-500/10 hover:text-purple-600"
                      onClick={(e) => handleSetAsProfile(item, e)}
                      title="Set as Profile Picture"
                    >
                      Set as Profile
                    </Button>
                  )}
                  <MediaSaleToggleButton
                    mediaId={item.id}
                    isForSale={item.isForSale || false}
                    salePrice={item.salePrice}
                    onStatusChange={handleMediaStatusChange}
                  />
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600"
                    onClick={(e) => handleShareClick(item, e)}
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => handleDeleteClick(item.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
      {previewMedia && (
        <MediaPreviewModal 
          media={previewMedia} 
          onClose={() => setPreviewMedia(null)} 
        />
      )}
  {previewMedia && (
    <MediaPreviewModal 
      media={previewMedia} 
      onClose={() => setPreviewMedia(null)} 
    />
  )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the media.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false);
              setSelectedMediaIds([]);
            }}
            media={media.filter(m => selectedMediaIds.includes(m.id))}
            onShare={async (selectedMedia, email) => {
              const mediaIds = selectedMedia.map(m => m.id);
              const link = await handleGenerateLink(mediaIds);
              if (link) {
                // If you want to send an email with the link
                if (email) {
                  // Add your email sending logic here
                  console.log(`Sending share link to ${email}: ${link}`);
                }
                return link;
              }
              return null;
            }}
            shareLink={shareableLink}
            onCopyLink={() => {
              if (shareableLink) {
                navigator.clipboard.writeText(shareableLink);
                setIsLinkCopied(true);
                setTimeout(() => setIsLinkCopied(false), 2000);
                toast.success('Link copied to clipboard!');
              }
            }}
          />
        )}
    </div>
  );
};

export default MediaList;
