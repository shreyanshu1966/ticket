# 🎫 Event Ticket Registration System - UPI Payment

A modern, secure event registration system with **UPI deep link payments** and **manual admin verification**.

![UPI Payment Flow](/.gemini/antigravity/brain/2772fce0-5f12-4ae3-a869-8acbfe40b440/upi_payment_flow_1767947442216.png)

## ✨ Features

### 🎯 Smart Payment System
- **Mobile Users**: Direct UPI app opening via deep links
- **Desktop Users**: QR code scanning with phone
- **Auto-Detection**: Automatically shows the right payment method
- **Universal**: Works with all UPI apps (GPay, PhonePe, Paytm, etc.)

### 🔐 Secure Verification
- Manual admin verification of all payments
- UTR (Transaction ID) collection
- Payment screenshot upload and storage
- Complete audit trail

### 📧 Automated Ticketing
- Unique ticket numbers
- QR codes for entry verification
- Automatic email delivery
- Professional ticket design

### 👨‍💼 Admin Dashboard
- View all registrations
- Filter by payment status
- Verify payments with screenshot preview
- Approve/reject with notes
- Export registration data

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- Email server (SMTP)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd ticket

# Install dependencies
npm install
cd backend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Fix database (if needed)
cd backend
node fix_ticket_index.js

# Start backend
npm run dev

# Start frontend (new terminal)
cd ..
npm run dev
```

### Access
- **User Registration**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin/login

## 📋 Configuration

### UPI Settings (`src/config.js`)
```javascript
export const PAYMENT_CONFIG = {
  UPI_ID: 'iganarase@okicici',  // Your UPI ID
  AMOUNT: 199,                   // Amount in rupees
  EVENT_NAME: 'Event Registration'
}
```

### QR Code
- Location: `/public/upi_qr.jpeg`
- Generate from any UPI app
- Recommended size: 512x512px or larger

### Email Settings (`backend/.env`)
```env
EMAIL_HOST=mail.acesmitadt.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

## 📱 How It Works

### For Users

#### Mobile Experience:
1. Fill registration form
2. Click **"Pay with UPI App"** button
3. UPI app opens automatically
4. Complete payment
5. Return to website
6. Submit UTR number + screenshot
7. Wait for admin approval
8. Receive ticket via email

#### Desktop Experience:
1. Fill registration form
2. **Scan QR code** with phone
3. Complete payment in UPI app
4. Return to desktop
5. Submit UTR number + screenshot
6. Wait for admin approval
7. Receive ticket via email

### For Admins

1. Login to admin dashboard
2. View registrations awaiting verification
3. Click **"Verify Payment"**
4. Review payment screenshot and UTR
5. **Approve** → Ticket sent automatically
6. **Reject** → User notified with reason

## 🗂️ Project Structure

```
ticket/
├── src/                          # Frontend (React + Vite)
│   ├── PaymentForm.jsx          # Payment UI with QR/deep link
│   ├── AdminRegistrations.jsx   # Admin registration management
│   ├── PaymentVerificationModal.jsx  # Verification UI
│   └── config.js                # UPI configuration
├── backend/                      # Backend (Express + MongoDB)
│   ├── controllers/
│   │   ├── registrationController.js  # Payment handling
│   │   └── adminController.js         # Admin functions
│   ├── models/
│   │   └── Registration.js      # Database schema
│   ├── routes/                  # API routes
│   └── services/
│       └── emailService.js      # Email & ticket generation
├── public/
│   └── upi_qr.jpeg             # UPI QR code
└── docs/                        # Documentation
    ├── UPI_PAYMENT_SYSTEM.md   # Complete system docs
    ├── TESTING_GUIDE.md        # Testing instructions
    ├── PAYMENT_FLOW_DIAGRAM.md # Visual flows
    └── QUICK_REFERENCE.md      # Quick reference
```

## 🔄 Payment Flow

```
Registration → Payment (UPI) → Submit Proof → Admin Verify → Ticket Email
```

### Payment Statuses
- `pending` - Just registered
- `paid_awaiting_verification` - UTR submitted
- `verified` - Admin approved
- `completed` - Ticket sent
- `failed` - Admin rejected

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Nodemailer
- JWT Authentication

### Payment
- UPI Deep Links
- QR Code (static)
- Manual Verification

## 📚 Documentation

Comprehensive documentation available:

- **[UPI_PAYMENT_SYSTEM.md](./UPI_PAYMENT_SYSTEM.md)** - Complete system documentation
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Step-by-step testing
- **[PAYMENT_FLOW_DIAGRAM.md](./PAYMENT_FLOW_DIAGRAM.md)** - Visual flowcharts
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference card
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation details

## 🧪 Testing

### Manual Testing
See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed instructions.

### Quick Test
```bash
# Desktop: Check QR code displays
# Mobile: Check UPI button works
# Admin: Verify payment approval flow
```

## 🔐 Security Features

- ✅ JWT authentication for admin
- ✅ Base64 screenshot storage
- ✅ Server-side validation
- ✅ CORS protection
- ✅ Secure email delivery
- ✅ Payment audit trail

## 📊 Database Schema

### Registration Model
```javascript
{
  // User Info
  name, email, phone, college, year,
  
  // Payment
  paymentStatus, upiTransactionId, paymentScreenshot,
  amount, paymentMethod, paymentSubmittedAt,
  
  // Verification
  adminVerifiedAt, adminVerifiedBy, paymentNotes,
  
  // Ticket
  ticketNumber, qrCode, ticketGenerated, emailSentAt
}
```

## 🎨 UI/UX Features

- Modern dark theme
- Purple-blue gradients
- Responsive design
- Smooth animations
- Clear error messages
- Loading states
- Mobile-optimized

## 🆘 Troubleshooting

### Common Issues

**UPI app not opening?**
- Check UPI ID in `src/config.js`
- Ensure UPI app is installed

**QR code not showing?**
- Verify `/public/upi_qr.jpeg` exists
- Check file permissions

**Database errors?**
- Run: `node backend/fix_ticket_index.js`

**Email not sending?**
- Check `backend/.env` email settings
- Verify SMTP credentials

## 📈 Admin Features

- Dashboard with statistics
- Registration management
- Payment verification
- Bulk notifications
- Data export (CSV)
- QR code scanner (for entry)

## 🎯 Roadmap

- [x] UPI deep link integration
- [x] QR code for desktop
- [x] Admin verification system
- [x] Automatic ticket generation
- [x] Email delivery
- [ ] SMS notifications
- [ ] Payment analytics
- [ ] Bulk ticket generation

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 👥 Support

For issues or questions:
- Check documentation in `/docs`
- Review troubleshooting section
- Contact admin support

## 🎉 Status

✅ **READY FOR PRODUCTION**

All features implemented and tested:
- ✅ UPI payments working
- ✅ Device detection active
- ✅ Admin verification ready
- ✅ Email system configured
- ✅ Database optimized

---

**Made with ❤️ for seamless event registrations**

Start accepting registrations now! 🚀
