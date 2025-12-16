// app/(dashboard)/profile/page.jsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader'; // Assuming this is the correct path
import Image from 'next/image';
import toast from 'react-hot-toast';
import useFollowing from '@/hooks/useFollowing';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const { data: followersList, isLoading: isLoadingFollowers, error: followersError } = useFollowing(session?.user?.id, 'followers');
  const { data: followingList, isLoading: isLoadingFollowing, error: followingError } = useFollowing(session?.user?.id, 'following');


  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserProfile();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/me');
      if (!res.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await res.json();
      setUserProfile(data.user);
      setFullName(data.user.fullName || '');
      setState(data.user.state || '');
      setCity(data.user.city || '');
      setProfilePictureUrl(data.user.profilePictureUrl || '');
    } catch (error) {
      console.error('Error fetching user profile:', error);
    
      toast.error("Failed to Update")
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          state,
          city,
          profilePictureUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      setUserProfile(updatedUser);
      await update({
        user: {
          ...session.user,
          name: updatedUser.fullName,
          image: updatedUser.profilePictureUrl,
        },
      });

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    setFullName(userProfile.fullName || '');
    setState(userProfile.state || '');
    setCity(userProfile.city || '');
    setProfilePictureUrl(userProfile.profilePictureUrl || '');
    setIsEditing(false);
  };

  const handleImageClick = () => {
    if (isEditing) {
      router.push('/video-player');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Could not load user profile.</p>
      </div>
    );
  }

  return (
    <>
      <GlobalHeader session={session} />
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              My Profile
            </h1>
            {!isEditing && (
              <Button 
                onClick={handleEditClick}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Edit Profile
              </Button>
            )}
          </div>

          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Profile Information</CardTitle>
              <CardDescription className="text-gray-400">
                {isEditing ? 'Update your personal details' : 'View your profile information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className={`relative w-32 h-32 rounded-full overflow-hidden border-2 ${isEditing ? 'cursor-pointer border-purple-500' : 'border-gray-600'}`}
                    onClick={handleImageClick}
                  >
                    <Image
                      src={profilePictureUrl || '/images/default-avatar.png'}
                      alt="Profile Picture"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-medium">Change Photo</span>
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="text-center w-full max-w-md">
                      <Label htmlFor="profilePictureUrl" className="text-gray-300 block mb-2">
                        Profile Picture URL
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="profilePictureUrl"
                          type="text"
                          value={profilePictureUrl}
                          onChange={(e) => setProfilePictureUrl(e.target.value)}
                          className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          placeholder="Enter image URL"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Click on your profile picture to select from generated images
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-300">
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <div className="p-2 bg-gray-700 rounded-md">{fullName || 'Not set'}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email
                    </Label>
                    <div className="p-2 bg-gray-700 rounded-md text-gray-300">
                      {userProfile.email}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-300">
                      City
                    </Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <div className="p-2 bg-gray-700 rounded-md">{city || 'Not set'}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-300">
                      State/Region
                    </Label>
                    {isEditing ? (
                      <Input
                        id="state"
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <div className="p-2 bg-gray-700 rounded-md">{state || 'Not set'}</div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="border-gray-600 text-white hover:bg-gray-700"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Rewards Analytics Card */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Rewards Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Track your rewards and credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-gray-300 text-sm font-medium">Available Credits</h3>
                  <p className="text-2xl font-bold text-purple-400">{userProfile.credits || 0}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-gray-300 text-sm font-medium">Total Credits Used</h3>
                  <p className="text-2xl font-bold text-blue-400">{userProfile.totalCreditsUsed || 0}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-gray-300 text-sm font-medium">Active Rewards</h3>
                  <p className="text-2xl font-bold text-green-400">{userProfile.rewards?.length || 0}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-200 mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {userProfile.rewards?.slice(0, 3).map((reward, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-750 rounded-md">
                      <div>
                        <p className="font-medium">{reward.type}</p>
                        <p className="text-sm text-gray-400">{reward.description}</p>
                      </div>
                      <span className="text-green-400 font-medium">+{reward.points} pts</span>
                    </div>
                  ))}
                  {(!userProfile.rewards || userProfile.rewards.length === 0) && (
                    <p className="text-gray-400 text-center py-4">No recent rewards activity</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Subscription & Credits</CardTitle>
              <CardDescription className="text-gray-400">
                Your current plan details and credit usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-300">Role:</p>
                  <p className="font-semibold">{userProfile.role}</p>
                </div>
                <div>
                  <p className="text-gray-300">Verified:</p>
                  <p className="font-semibold">{userProfile.isVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-gray-300">Radio Subscribed:</p>
                  <p className="font-semibold">{userProfile.isRadioSubscribed ? 'Yes' : 'No'}</p>
                </div>
                {userProfile.isRadioSubscribed && (
                  <div>
                    <p className="text-gray-300">Radio Subscription Expires:</p>
                    <p className="font-semibold">
                      {userProfile.radioSubscriptionExpiresAt
                        ? new Date(userProfile.radioSubscriptionExpiresAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-300">Credits Remaining:</p>
                  <p className="font-semibold">{userProfile.creditsRemaining}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Credits Used:</p>
                  <p className="font-semibold">{userProfile.totalCreditsUsed}</p>
                </div>
                <div>
                  <p className="text-gray-300">Max Monthly Credits:</p>
                  <p className="font-semibold">{userProfile.maxMonthlyCredits}</p>
                </div>
                <div>
                  <p className="text-gray-300">Radio Credits:</p>
                  <p className="font-semibold">{userProfile.radioCredits}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Earned Credits:</p>
                  <p className="font-semibold">{userProfile.totalEarnedCredits}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Downloads:</p>
                  <p className="font-semibold">{userProfile.totalDownloads}</p>
                </div>
                <div>
                  <p className="text-gray-300">Max Downloads:</p>
                  <p className="font-semibold">{userProfile.max_download}</p>
                </div>
                <div>
                  <p className="text-gray-300">Referral Code:</p>
                  <p className="font-semibold">{userProfile.referralCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-300">Last Login:</p>
                  <p className="font-semibold">
                    {userProfile.lastLoginAt
                      ? new Date(userProfile.lastLoginAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* <h3 className="text-xl font-semibold mt-6 mb-3">Your Rewards</h3>
              {userProfile.rewards && userProfile.rewards.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {userProfile.rewards.map((reward) => (
                    <li key={reward.id} className="text-gray-300">
                      <span className="font-semibold">{reward.description}</span> (Points: {reward.points}, Expires:{' '}
                      {reward.expiresAt ? new Date(reward.expiresAt).toLocaleDateString() : 'Never'})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No active rewards.</p>
              )} */}

              <h3 className="text-xl font-semibold mt-6 mb-3">Your Content Counts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-300">Songs:</p>
                  <p className="font-semibold">{userProfile._count?.Song || 0}</p>
                </div>
                <div>
                  <p className="text-gray-300">Galleries:</p>
                  <p className="font-semibold">{userProfile._count?.Gallery || 0}</p>
                </div>
                <div>
                  <p className="text-gray-300">Media:</p>
                  <p className="font-semibold">{userProfile._count?.Media || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Followers Card */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Followers</CardTitle>
              <CardDescription className="text-gray-400">
                Users who are following you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFollowers ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : followersError ? (
                <p className="text-red-500">Error loading followers: {followersError.message}</p>
              ) : followersList && followersList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followersList.map((follower) => (
                    <div key={follower.id} className="flex items-center space-x-3 bg-gray-700 p-3 rounded-lg">
                      <Image
                        src={follower.profilePictureUrl || '/images/default-avatar.png'}
                        alt={follower.fullName || 'Follower'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <p className="font-semibold">{follower.fullName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No followers yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Following Card */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Following</CardTitle>
              <CardDescription className="text-gray-400">
                Users you are following.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFollowing ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : followingError ? (
                <p className="text-red-500">Error loading following: {followingError.message}</p>
              ) : followingList && followingList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followingList.map((followingUser) => (
                    <div key={followingUser.id} className="flex items-center space-x-3 bg-gray-700 p-3 rounded-lg">
                      <Image
                        src={followingUser.profilePictureUrl || '/images/default-avatar.png'}
                        alt={followingUser.fullName || 'Following'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <p className="font-semibold">{followingUser.fullName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Not following anyone yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
