'use client';

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
import { Download, Image as ImageIcon, Play, Share2, Trash2, Video } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const MediaList = ({ type = 'video', onSelect, onDelete, onShare, className = '' }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/media?type=${type}`);
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

  const handleDeleteClick = (mediaId, e) => {
    e.stopPropagation();
    setMediaToDelete(mediaId);
    setDeleteDialogOpen(true);
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

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 ${className}`}>
      {media.map((item) => (
        <Card
          key={item.id}
          onClick={() => onSelect?.(item)}
          className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow duration-200"
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


            {item.status === 'processing' && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70">
                <p className="text-xs text-white mb-1">Processing...</p>
                <Progress value={item.progress || 0} className="h-1.5" />
              </div>
            )}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(item);
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => handleDownload(item.fileUrl, item.title, e)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {item.isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => handleDeleteClick(item.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}

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
    </div>
  );
};

export default MediaList;
