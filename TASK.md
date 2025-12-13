# Project Tasks

## Completed Tasks:
- Implemented a user profile page at `app/(dashboard)/profile/page.jsx` that allows users to view and update their profile information (full name, state, city, profile picture URL).
- Updated the `/api/user/profile` API endpoint to support updating the user's full name.
- The profile page displays subscription details, credit information, and content counts, fetching data from `/api/user/me`.
- The profile picture update functionality allows inputting a URL, with a note guiding users to the PlanetQ AI Media Generator page for image selection.
- Created and refined `components/player/SongMediaSelectionDialog.jsx` for selecting media (video/image) to associate with a song. This dialog now fetches all media, displays them in tabs, allows selection, and provides a button to set the selected media as the song's thumbnail/video.
- Removed `app/media/_components/MediaListForSongSelection.jsx` as its functionality is now encapsulated within `SongMediaSelectionDialog.jsx` and will be integrated directly where a song needs media selection.
- Confirmed that the existing song API endpoint at `app/api/songs/[id]/route.js` correctly handles `PATCH` requests for updating a song's `videoUrl` and `thumbnailUrl`, thus no new API implementation was required.
- Integrated `components/player/SongMediaSelectionDialog.jsx` into `components/FuturisticMusicPlayer.jsx`. Users can now click on a song's image in the playlist to open the dialog and select new media (video/image) for that song.
- Modified `components/FuturisticMusicPlayer.jsx` to ensure that clicking the song image opens the media selection dialog, while clicking other parts of the song card (title, artist) sets the song as the current playing song.
- Integrated `components/player/SongMediaSelectionDialog.jsx` into `components/player/SongList.js`. Users can now click on a song's thumbnail in the `SongList` to open the dialog and select new media (video/image) for that song. The `SongList` now uses `song.thumbnailUrl` for displaying the thumbnail.
- Updated `components/player/DiffrhymGenerator.js` and `components/player/SunoGenerator.js` to pass the `onSongUpdated` prop to `SongList`, allowing `SongList` to notify its parent when a song's media is updated.
- Added loading indicators and toast notifications to `components/player/SongMediaSelectionDialog.jsx` for the media saving process.