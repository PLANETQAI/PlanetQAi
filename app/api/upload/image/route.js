// app/api/upload/image/route.js
import { auth } from "@/auth";
import { uploadToCloudinary } from '@/lib/cloudinary';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return new NextResponse(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert buffer to data URI
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(dataUri, `user-upload-${session.user.id}-${Date.now()}`);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return new NextResponse(JSON.stringify({ error: "Failed to upload image", details: error.message }), { status: 500 });
  }
}
