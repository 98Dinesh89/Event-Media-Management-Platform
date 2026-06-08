const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: `event-platform/${req.body.event_id || 'general'}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
      resource_type: 'auto',
      categorization: 'google_tagging',
      auto_tagging: 0.5
    }
  }
})

const upload = multer({ storage })
module.exports = upload