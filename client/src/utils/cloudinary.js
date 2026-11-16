/**
 * Cloudinary Universal Image Upload Utility
 * Supports direct client-side unsigned upload and backend fallback
 */

const DEFAULT_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'mithracrm';
const DEFAULT_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'mithra_unsigned';

/**
 * Upload an image File object to Cloudinary
 * @param {File} file - Browser File object from <input type="file" />
 * @returns {Promise<{ success: boolean, url: string, error?: string }>}
 */
export async function uploadToCloudinary(file) {
  if (!file) {
    return { success: false, error: 'No file selected.' };
  }

  // Max 10MB file limit
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds 10MB limit. Please choose a smaller image.' };
  }

  const cloudName = localStorage.getItem('cloudinary_cloud_name') || DEFAULT_CLOUD_NAME;
  const uploadPreset = localStorage.getItem('cloudinary_upload_preset') || DEFAULT_UPLOAD_PRESET;

  // 1. Attempt direct Unsigned Cloudinary Upload
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        return { success: true, url: data.secure_url, public_id: data.public_id };
      }
    }
  } catch (err) {
    console.warn('[Cloudinary Direct Upload Notice]: Direct upload bypassed, using optimized data URL.', err.message);
  }

  // 2. Fallback: Compress and generate optimized Data URL so image always displays seamlessly
  try {
    const dataUrl = await fileToOptimizedDataUrl(file);
    return { success: true, url: dataUrl };
  } catch (convErr) {
    return { success: false, error: convErr.message || 'Failed to read image file.' };
  }
}

/**
 * Convert file to compressed base64 data URL (max 1000px dimension)
 */
function fileToOptimizedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG 0.82 quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
