import AdminSettings from './models/AdminSettings.js'

const initializeAdminSettings = async () => {
  try {
    // Initialize default settings (MongoDB is already connected)
    await AdminSettings.initializeDefaults()
    console.log('✅ Admin settings initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing admin settings:', error)
    throw error
  }
}

export default initializeAdminSettings