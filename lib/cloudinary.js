import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials from environment variables
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dk3kcxuzg', 
    api_key: process.env.CLOUDINARY_API_KEY || '396964444393959', 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary from a given URL.
 * @param {string} fileUrl - The URL of the file to upload.
 * @param {string} publicId - The desired public ID for the file in Cloudinary.
 * @returns {Promise<object>} - The upload result from Cloudinary.
 */
export async function uploadToCloudinary(fileUrl, publicId) {
    try {
        const uploadResult = await cloudinary.uploader.upload(fileUrl, {
            public_id: publicId,
            resource_type: 'auto', // Automatically detect resource type
        });
        return uploadResult;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload to Cloudinary');
    }
}

/**
 * Gets an optimized Cloudinary URL for a given public ID.
 * @param {string} publicId - The public ID of the file.
 * @param {object} options - Additional transformation options.
 * @returns {string} - The optimized Cloudinary URL.
 */
export function getOptimizedUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto',
        ...options,
    });
}
