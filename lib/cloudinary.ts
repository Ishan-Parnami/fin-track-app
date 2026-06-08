import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function deleteCloudinaryImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          public_id: filename,
          overwrite: true,
          folder: 'profile_images',
        },
        (error, result) => {
          if (error || !result) return reject(error)
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      )
      .end(buffer)
  })
}
