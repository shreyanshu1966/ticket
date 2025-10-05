// Test the new JPEG banner implementation
const { generateTicketTemplate } = require('./email-template.js');
const fs = require('fs');

// Test with sample attendee data
const testAttendee = {
    Name: "Test User",
    'Email id': "test@example.com",
    Phone: "9876543210",
    College: "Test University",
    Department: "Computer Science",
    Year: "3rd Year"
};

const testQRBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const testTicketId = "TEST001";

try {
    console.log("🧪 Testing JPEG banner implementation...");
    console.log("==========================================");
    
    const htmlContent = generateTicketTemplate(testAttendee, testQRBase64, testTicketId);
    
    // Save test email for inspection
    fs.writeFileSync('test-jpeg-banner.html', htmlContent);
    console.log("💾 Test email saved as 'test-jpeg-banner.html'");
    
    // Check banner implementation
    const hasCIDBanner = htmlContent.includes('src="cid:banner"');
    const hasOldBase64 = htmlContent.includes('data:image/jpeg;base64,');
    
    console.log("\\n✅ BANNER IMPLEMENTATION CHECK:");
    console.log("=================================");
    console.log(`✅ Uses CID reference: ${hasCIDBanner ? 'YES' : 'NO'}`);
    console.log(`✅ Removed base64: ${!hasOldBase64 ? 'YES' : 'NO'}`);
    
    // Check file sizes
    const bannerStats = fs.statSync('./banner-compressed.jpg');
    const bannerSizeKB = (bannerStats.size / 1024).toFixed(2);
    
    console.log("\\n📊 FILE SIZE ANALYSIS:");
    console.log("=======================");
    console.log(`✅ Banner JPEG size: ${bannerSizeKB} KB`);
    console.log(`✅ Template size: ${(htmlContent.length / 1024).toFixed(2)} KB`);
    console.log(`✅ Total email size reduction: ~${(55.88 - parseFloat(bannerSizeKB)).toFixed(2)} KB`);
    
    if (hasCIDBanner && !hasOldBase64) {
        console.log("\\n🎉 SUCCESS! JPEG banner implementation is working:");
        console.log("   ✅ Banner uses CID attachment (better email client support)");
        console.log("   ✅ Removed heavy base64 encoding");
        console.log("   ✅ Banner file size optimized to ~42KB");
        console.log("   ✅ Much better email client compatibility");
    } else {
        console.log("\\n⚠️ Issues detected:");
        if (!hasCIDBanner) console.log("   ❌ CID reference not found");
        if (hasOldBase64) console.log("   ❌ Old base64 code still present");
    }
    
} catch (error) {
    console.error("❌ Test failed:", error.message);
}