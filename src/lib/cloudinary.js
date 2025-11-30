// Cloudinary image upload helper
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImageToCloudinary(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'inventory-products');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url; // Returns HTTPS URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export async function deleteImageFromCloudinary(imageUrl) {
  // Cloudinary free tier doesn't support deletion via API
  // Images can be managed from Cloudinary dashboard
  // For now, just log (images will stay in Cloudinary but won't be referenced)
  console.log('Image removed from product (still in Cloudinary):', imageUrl);
}
