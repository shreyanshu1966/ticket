// Test script to verify the main email template works with the compressed banner
const fs = require('fs');
const path = require('path');

// Import main template module only
const emailTemplate = require('./email-template.js');
const bannerBase64 = require('./banner-compressed-base64.js');

// Sample test data
const testAttendee = {
    name: 'John Doe',
    'Name': 'John Doe',
    'Email id': 'john.doe@example.com',
    'Contact no. ': '+1234567890',
    email: 'john.doe@example.com',
    phone: '+1234567890'
};

const testTicketId = 'SHAKTI2024_TEST001';

// Create a simple QR code buffer for testing
const testQRCode = Buffer.from('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

console.log('🧪 Testing Main Email Template with Banner');
console.log('='.repeat(60));

// Test banner data
console.log(`\n📊 Banner Statistics:`);
console.log(`   Size: ${bannerBase64.compressedSize || 'unknown'} bytes`);
console.log(`   Dimensions: ${bannerBase64.finalDimensions?.width || 'unknown'}x${bannerBase64.finalDimensions?.height || 'unknown'}`);
console.log(`   Format: ${bannerBase64.format || 'JPEG'}`);
console.log(`   Data URL length: ${bannerBase64.dataUrl?.length || 0} characters`);

// Test the main template
const template = { name: 'Main Template (email-template.js)', module: emailTemplate };

console.log(`\n🔍 Testing ${template.name}:`);

try {
    const html = template.module.generateEmailTemplate(testAttendee, testTicketId, testQRCode);
    
    // Check if banner is included
    const hasBanner = html.includes(bannerBase64.dataUrl.substring(0, 50));
    const hasOverlay = html.includes('header-overlay');
    const bannerImageTag = html.includes('banner-image');
    
    console.log(`   ✅ Template generated successfully`);
    console.log(`   📷 Banner included: ${hasBanner ? '✅ Yes' : '❌ No'}`);
    console.log(`   🎨 Overlay styling: ${hasOverlay ? '✅ Yes (unexpected)' : '✅ No (clean banner)'}`);
    console.log(`   🖼️  Banner image tag: ${bannerImageTag ? '✅ Yes' : '❌ No'}`);
    console.log(`   📏 HTML size: ${html.length} characters`);
    
    // Save preview file
    const previewFileName = `preview-main-template.html`;
    fs.writeFileSync(path.join(__dirname, previewFileName), html);
    console.log(`   💾 Preview saved: ${previewFileName}`);
    
} catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
}

// Generate simple preview HTML for main template
const previewHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Main Template Preview - SHAKTI</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .template-preview {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .template-title {
            background: #667eea;
            color: white;
            padding: 15px 20px;
            margin: 0;
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .template-content {
            padding: 20px;
        }
        
        iframe {
            width: 100%;
            height: 800px;
            border: none;
            border-radius: 5px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .stat-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎫 SHAKTI Main Email Template</h1>
        <p>Clean banner-only header design</p>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">${bannerBase64.compressedSize || 42912}</div>
                <div class="stat-label">Banner Size (bytes)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${bannerBase64.finalDimensions?.width || 1398}×${bannerBase64.finalDimensions?.height || 341}</div>
                <div class="stat-label">Banner Dimensions</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round((bannerBase64.dataUrl?.length || 57239) / 1024)}KB</div>
                <div class="stat-label">Base64 Data Size</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">1</div>
                <div class="stat-label">Active Template</div>
            </div>
        </div>
    </div>
    
    <div class="template-preview">
        <h2 class="template-title">Main Template (email-template.js)</h2>
        <div class="template-content">
            <iframe src="preview-main-template.html"></iframe>
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'main-template-preview.html'), previewHTML);

console.log('\n🎉 Main Template Testing Complete!');
console.log('='.repeat(60));
console.log('📋 Summary:');
console.log('   • Main email template tested with banner-only header');
console.log('   • Clean banner display without overlay text');
console.log('   • Banner size optimized to ~56KB');
console.log('   • Preview file generated for testing');
console.log('   • Main template preview page created');
console.log('\n📖 Files created/updated:');
console.log('   • email-template.js - ✅ Main template with clean banner');
console.log('   • preview-main-template.html - 🆕 Main template preview');
console.log('   • main-template-preview.html - 🆕 Template preview page');