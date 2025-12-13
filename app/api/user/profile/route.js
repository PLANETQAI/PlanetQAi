import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust path as necessary
import { auth } from '@/auth'; // Assuming you have an auth middleware or session helper

export async function PATCH(request) {
  const session = await auth(); // Get the current session

  // Authorization: Ensure a user is logged in
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const userId = session.user.id; // Get userId from the session

  try {
    const body = await request.json();
    const { fullName, state, city, profilePictureUrl } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(state && { state }),
        ...(city && { city }),
        ...(profilePictureUrl && { profilePictureUrl }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        state: true,
        city: true,
        profilePictureUrl: true,
        // Add other fields you want to return
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to update user profile', error: error.message }), { status: 500 });
  }
}
