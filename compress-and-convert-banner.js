const fs = require('fs');
const path = require('path');

// Check if sharp is available for image processing
let sharp;
try {
    sharp = require('sharp');
} catch (error) {
    console.log('⚠️  Sharp module not found. Installing...');
    console.log('Please run: npm install sharp');
    process.exit(1);
}

// Function to compress and convert image to base64
async function compressAndConvertToBase64(inputPath, targetSizeKB = 50) {
    try {
        console.log('🔄 Starting image compression and conversion...');
        
        // Read original image info
        const originalBuffer = fs.readFileSync(inputPath);
        const originalSizeKB = (originalBuffer.length / 1024).toFixed(2);
        console.log(`📊 Original image size: ${originalSizeKB} KB`);
        
        const targetSizeBytes = targetSizeKB * 1024;
        
        // Get original image metadata
        const metadata = await sharp(originalBuffer).metadata();
        console.log(`📏 Original dimensions: ${metadata.width}x${metadata.height}`);
        
        // Try different compression strategies
        let compressedBuffer;
        let quality = 85;
        let width = metadata.width;
        let height = metadata.height;
        
        // Strategy 1: Try with original dimensions but reduce quality
        console.log('🎯 Strategy 1: Reducing quality...');
        while (quality > 10) {
            compressedBuffer = await sharp(originalBuffer)
                .jpeg({ quality: quality, progressive: true })
                .toBuffer();
            
            const currentSizeKB = (compressedBuffer.length / 1024).toFixed(2);
            console.log(`   Quality ${quality}%: ${currentSizeKB} KB`);
            
            if (compressedBuffer.length <= targetSizeBytes) {
                console.log(`✅ Target achieved with quality: ${quality}%`);
                break;
            }
            quality -= 10;
        }
        
        // Strategy 2: If still too large, reduce dimensions
        if (compressedBuffer.length > targetSizeBytes) {
            console.log('🎯 Strategy 2: Reducing dimensions...');
            let scaleFactor = 0.9;
            
            while (scaleFactor > 0.3 && compressedBuffer.length > targetSizeBytes) {
                width = Math.floor(metadata.width * scaleFactor);
                height = Math.floor(metadata.height * scaleFactor);
                
                compressedBuffer = await sharp(originalBuffer)
                    .resize(width, height, { 
                        kernel: sharp.kernel.lanczos3,
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: 75, progressive: true })
                    .toBuffer();
                
                const currentSizeKB = (compressedBuffer.length / 1024).toFixed(2);
                console.log(`   Dimensions ${width}x${height}: ${currentSizeKB} KB`);
                
                if (compressedBuffer.length <= targetSizeBytes) {
                    console.log(`✅ Target achieved with dimensions: ${width}x${height}`);
                    break;
                }
                scaleFactor -= 0.1;
            }
        }
        
        // Strategy 3: More aggressive compression if needed
        if (compressedBuffer.length > targetSizeBytes) {
            console.log('🎯 Strategy 3: Aggressive compression...');
            quality = 60;
            
            while (quality > 5 && compressedBuffer.length > targetSizeBytes) {
                compressedBuffer = await sharp(originalBuffer)
                    .resize(width, height, { 
                        kernel: sharp.kernel.lanczos3,
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ 
                        quality: quality, 
                        progressive: true,
                        mozjpeg: true // Use mozjpeg encoder for better compression
                    })
                    .toBuffer();
                
                const currentSizeKB = (compressedBuffer.length / 1024).toFixed(2);
                console.log(`   Quality ${quality}% + mozjpeg: ${currentSizeKB} KB`);
                
                if (compressedBuffer.length <= targetSizeBytes) {
                    console.log(`✅ Target achieved with aggressive compression: ${quality}%`);
                    break;
                }
                quality -= 5;
            }
        }
        
        const finalSizeKB = (compressedBuffer.length / 1024).toFixed(2);
        const compressionRatio = ((originalBuffer.length - compressedBuffer.length) / originalBuffer.length * 100).toFixed(1);
        
        console.log(`📊 Final compressed size: ${finalSizeKB} KB`);
        console.log(`📉 Compression ratio: ${compressionRatio}%`);
        
        // Convert to base64
        const base64String = compressedBuffer.toString('base64');
        const mimeType = 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64String}`;
        
        // Calculate base64 size
        const base64SizeKB = (base64String.length / 1024).toFixed(2);
        console.log(`📏 Base64 size: ${base64SizeKB} KB`);
        
        return {
            compressedBuffer,
            base64: base64String,
            dataUrl: dataUrl,
            mimeType: mimeType,
            originalSize: originalBuffer.length,
            compressedSize: compressedBuffer.length,
            base64Size: base64String.length,
            compressionRatio: compressionRatio,
            finalDimensions: { width, height }
        };
        
    } catch (error) {
        console.error('❌ Error compressing image:', error.message);
        return null;
    }
}

// Main execution
async function main() {
    const bannerPath = path.join(__dirname, 'banner.jpeg');
    
    if (!fs.existsSync(bannerPath)) {
        console.error('❌ banner.jpeg not found!');
        return;
    }
    
    console.log('🖼️  Compressing banner.jpeg to ~50KB...');
    const result = await compressAndConvertToBase64(bannerPath, 50);
    
    if (result) {
        // Save compressed image
        fs.writeFileSync('banner-compressed.jpg', result.compressedBuffer);
        console.log('💾 Compressed image saved as: banner-compressed.jpg');
        
        // Save compressed base64 data
        const outputData = {
            filename: 'banner-compressed.jpg',
            mimeType: result.mimeType,
            base64: result.base64,
            dataUrl: result.dataUrl,
            generatedAt: new Date().toISOString(),
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            base64Size: result.base64Size,
            compressionRatio: result.compressionRatio,
            finalDimensions: result.finalDimensions
        };
        
        fs.writeFileSync('banner-compressed-base64.json', JSON.stringify(outputData, null, 2));
        console.log('💾 Compressed base64 data saved to: banner-compressed-base64.json');
        
        // Create compressed JavaScript module
        const jsModule = `// Auto-generated compressed base64 data for banner
// Generated at: ${new Date().toISOString()}
// Original size: ${(result.originalSize / 1024).toFixed(2)} KB
// Compressed size: ${(result.compressedSize / 1024).toFixed(2)} KB
// Base64 size: ${(result.base64Size / 1024).toFixed(2)} KB
// Compression ratio: ${result.compressionRatio}%
// Final dimensions: ${result.finalDimensions.width}x${result.finalDimensions.height}

const bannerCompressedBase64 = {
    filename: 'banner-compressed.jpg',
    mimeType: '${result.mimeType}',
    base64: '${result.base64}',
    dataUrl: '${result.dataUrl}',
    originalSize: ${result.originalSize},
    compressedSize: ${result.compressedSize},
    base64Size: ${result.base64Size},
    compressionRatio: ${result.compressionRatio},
    finalDimensions: ${JSON.stringify(result.finalDimensions)}
};

module.exports = bannerCompressedBase64;
`;
        
        fs.writeFileSync('banner-compressed-base64.js', jsModule);
        console.log('📦 Compressed JavaScript module saved to: banner-compressed-base64.js');
        
        // Update email template with compressed version
        const compressedEmailTemplate = `// Email template function using compressed base64 banner
const bannerBase64 = require('./banner-compressed-base64.js');

function createEmailWithCompressedBanner(content = {}) {
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
        .size-info {
            background-color: #e8f5e8;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-size: 12px;
            color: #2d5d2d;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <img src="\${bannerBase64.dataUrl}" alt="SHAKTI Event Banner" class="banner">
        <div class="content">
            <div class="greeting">Dear \${recipientName},</div>
            <div class="message">\${message}</div>
            <div class="size-info">
                📊 Optimized Banner: \${(bannerBase64.base64Size / 1024).toFixed(1)}KB base64 
                (Original: \${(bannerBase64.originalSize / 1024).toFixed(1)}KB, 
                Saved: \${bannerBase64.compressionRatio}%)
            </div>
        </div>
        <div class="footer">
            <p>SHAKTI - Association of Computer Engineering Students</p>
            <p>MIT-ADT University, Pune, India</p>
        </div>
    </div>
</body>
</html>\`;
}

module.exports = { createEmailWithCompressedBanner };
`;
        
        fs.writeFileSync('email-template-compressed.js', compressedEmailTemplate);
        console.log('📧 Compressed email template saved to: email-template-compressed.js');
        
        console.log('\n🎉 Compression completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   Original image: ${(result.originalSize / 1024).toFixed(2)} KB`);
        console.log(`   Compressed image: ${(result.compressedSize / 1024).toFixed(2)} KB`);
        console.log(`   Base64 size: ${(result.base64Size / 1024).toFixed(2)} KB`);
        console.log(`   Compression ratio: ${result.compressionRatio}%`);
        console.log(`   Final dimensions: ${result.finalDimensions.width}x${result.finalDimensions.height}`);
        
    } else {
        console.log('❌ Compression failed!');
    }
}

// Check if Sharp is available and run
if (typeof sharp !== 'undefined') {
    main();
}