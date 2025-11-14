'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MediaList from './_components/MediaList';


function AdminMedia() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Media Management</h1>
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos">
          <MediaList type="video" />
        </TabsContent>
        
        <TabsContent value="images">
          <MediaList type="image" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminMedia;