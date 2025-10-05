const fs = require('fs');
const path = require('path');

// Function to convert image to base64
function convertImageToBase64(imagePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`File not found: ${imagePath}`);
        }

        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Convert to base64
        const base64String = imageBuffer.toString('base64');
        
        // Get file extension for MIME type
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = 'image/jpeg';
        
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';
        
        // Create data URL
        const dataUrl = `data:${mimeType};base64,${base64String}`;
        
        return {
            base64: base64String,
            dataUrl: dataUrl,
            mimeType: mimeType,
            size: imageBuffer.length
        };
    } catch (error) {
        console.error('Error converting image to base64:', error.message);
        return null;
    }
}

// Convert banner.jpeg to base64
const bannerPath = path.join(__dirname, 'banner.jpeg');
console.log('Converting banner.jpeg to base64...');

const result = convertImageToBase64(bannerPath);

if (result) {
    console.log('✅ Conversion successful!');
    console.log(`📊 File size: ${(result.size / 1024).toFixed(2)} KB`);
    console.log(`🎨 MIME type: ${result.mimeType}`);
    console.log(`📏 Base64 length: ${result.base64.length} characters`);
    
    // Save base64 to a file for easy use
    const outputData = {
        filename: 'banner.jpeg',
        mimeType: result.mimeType,
        base64: result.base64,
        dataUrl: result.dataUrl,
        generatedAt: new Date().toISOString(),
        originalSize: result.size
    };
    
    fs.writeFileSync('banner-base64.json', JSON.stringify(outputData, null, 2));
    console.log('💾 Base64 data saved to banner-base64.json');
    
    // Also create a JavaScript module for easy import
    const jsModule = `// Auto-generated base64 data for banner.jpeg
// Generated at: ${new Date().toISOString()}

const bannerBase64 = {
    filename: 'banner.jpeg',
    mimeType: '${result.mimeType}',
    base64: '${result.base64}',
    dataUrl: '${result.dataUrl}',
    originalSize: ${result.size}
};

module.exports = bannerBase64;
`;
    
    fs.writeFileSync('banner-base64.js', jsModule);
    console.log('📦 JavaScript module saved to banner-base64.js');
    
    // Create a sample email template function
    const emailTemplateFunction = `// Email template function using base64 banner
const bannerBase64 = require('./banner-base64.js');

function createEmailWithBanner(content = {}) {
    const {
        title = 'SHAKTI Event',
        message = 'Your message here',
        recipientName = 'Attendee'
    } = content;

    return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${title}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .banner {
            width: 100%;
            height: auto;
            display: block;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 20px;
        }
        .footer {
            background-color: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <img src="\${bannerBase64.dataUrl}" alt="SHAKTI Event Banner" class="banner">
        <div class="content">
            <div class="greeting">Dear \${recipientName},</div>
            <div class="message">\${message}</div>
        </div>
        <div class="footer">
            <p>SHAKTI - Association of Computer Engineering Students</p>
            <p>MIT-ADT University, Pune, India</p>
        </div>
    </div>
</body>
</html>\`;
}

module.exports = { createEmailWithBanner };
`;
    
    fs.writeFileSync('email-template-with-banner.js', emailTemplateFunction);
    console.log('📧 Email template function saved to email-template-with-banner.js');
    
} else {
    console.log('❌ Conversion failed!');
}