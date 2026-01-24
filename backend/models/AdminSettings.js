import mongoose from 'mongoose'

const adminSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  lastModifiedBy: {
    type: String,
    required: true
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Create default settings
adminSettingsSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      settingKey: 'friendOfferEnabled',
      settingValue: true,
      description: 'Enable/Disable friend referral offer',
      lastModifiedBy: 'System'
    },
    {
      settingKey: 'friendDiscountAmount',
      settingValue: 10000, // ₹100 in paise
      description: 'Discount amount for friend referrals',
      lastModifiedBy: 'System'
    },
    {
      settingKey: 'friendOfferTopUpAmount',
      settingValue: 10000, // ₹100 in paise
      description: 'Top-up amount for friend referrals',
      lastModifiedBy: 'System'
    }
  ]

  for (const defaultSetting of defaults) {
    await this.findOneAndUpdate(
      { settingKey: defaultSetting.settingKey },
      defaultSetting,
      { upsert: true, new: true }
    )
  }
}

// Helper method to get setting value
adminSettingsSchema.statics.getSetting = async function(key) {
  const setting = await this.findOne({ settingKey: key })
  return setting ? setting.settingValue : null
}

// Helper method to update setting
adminSettingsSchema.statics.updateSetting = async function(key, value, modifiedBy) {
  return await this.findOneAndUpdate(
    { settingKey: key },
    { 
      settingValue: value, 
      lastModifiedBy: modifiedBy,
      lastModifiedAt: new Date()
    },
    { new: true }
  )
}

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema)

export default AdminSettings