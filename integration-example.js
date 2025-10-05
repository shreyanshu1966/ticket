// Integration example - How to use the base64 banner in your existing email system
const bannerBase64 = require('./banner-base64.js');

// Example integration with your existing email template
function updateExistingEmailTemplate() {
    console.log('🔄 Integration Guide for Existing Email Templates');
    console.log('');
    
    console.log('1. Add this to your existing email template HTML:');
    console.log(`   <img src="${bannerBase64.dataUrl}" alt="SHAKTI Banner" style="width: 100%; height: auto;">`);
    console.log('');
    
    console.log('2. Or create a dynamic template:');
    console.log('   const template = `<img src="${bannerBase64.dataUrl}" alt="SHAKTI Banner" />`;');
    console.log('');
    
    console.log('3. For your send-tickets.js integration:');
    console.log('   const bannerData = require("./banner-base64.js");');
    console.log('   // Use bannerData.dataUrl in your email HTML');
    console.log('');
    
    console.log('📊 Base64 Data Ready:');
    console.log(`   ✅ MIME Type: ${bannerBase64.mimeType}`);
    console.log(`   ✅ Original Size: ${(bannerBase64.originalSize / 1024).toFixed(2)} KB`);
    console.log(`   ✅ Base64 Length: ${bannerBase64.base64.length} characters`);
    console.log(`   ✅ Data URL Ready: ${bannerBase64.dataUrl.substring(0, 50)}...`);
}

// Example function to replace external image URLs with base64
function replaceExternalImageWithBase64(htmlTemplate) {
    // Replace any existing banner references with base64
    const updatedHTML = htmlTemplate.replace(
        /<img[^>]*src=["'][^"']*banner[^"']*["'][^>]*>/gi,
        `<img src="${bannerBase64.dataUrl}" alt="SHAKTI Banner" style="width: 100%; height: auto; display: block;">`
    );
    
    return updatedHTML;
}

// Quick test function
function testBase64Integration() {
    const sampleHTML = `
    <div>
        <img src="https://example.com/banner.jpg" alt="Old Banner">
        <p>Email content here</p>
    </div>`;
    
    const updatedHTML = replaceExternalImageWithBase64(sampleHTML);
    
    console.log('🧪 Test Conversion:');
    console.log('Before:', sampleHTML.trim());
    console.log('After:', updatedHTML.trim());
}

// Run the integration guide
updateExistingEmailTemplate();
testBase64Integration();

module.exports = {
    bannerBase64,
    replaceExternalImageWithBase64
};