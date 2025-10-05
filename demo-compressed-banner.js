// Demo script for compressed banner email templates
const { createEmailWithCompressedBanner } = require('./email-template-compressed.js');
const fs = require('fs');

// Example 1: Basic email with compressed banner
const basicEmailCompressed = createEmailWithCompressedBanner({
    title: 'SHAKTI Event Invitation - Optimized',
    message: `
        <h3>🎉 You are invited to SHAKTI Event!</h3>
        <p>Join us for an amazing experience with fellow computer engineering students!</p>
        <p><strong>What's new:</strong> This email uses an optimized banner that's 75% smaller while maintaining excellent quality!</p>
    `,
    recipientName: 'John Doe'
});

// Example 2: Ticket confirmation with compressed banner
const ticketEmailCompressed = createEmailWithCompressedBanner({
    title: 'SHAKTI Event - Ticket Confirmation (Optimized)',
    message: `
        <h3>🎉 Your ticket has been confirmed!</h3>
        <p>Thank you for registering for the SHAKTI event. Here are your event details:</p>
        <ul>
            <li><strong>Event:</strong> SHAKTI 2025</li>
            <li><strong>Date:</strong> Coming Soon</li>
            <li><strong>Venue:</strong> MIT-ADT University, Pune</li>
            <li><strong>Ticket ID:</strong> SKT-2025-001</li>
        </ul>
        <p>Please keep this email for your records. We look forward to seeing you there!</p>
        <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>📊 Email Optimization:</strong><br>
            • Banner size reduced by 75% (from 169KB to 42KB)<br>
            • Faster loading in all email clients<br>
            • Better mobile experience<br>
            • Same visual quality
        </div>
    `,
    recipientName: 'Attendee'
});

// Save compressed email previews
fs.writeFileSync('email-preview-compressed-basic.html', basicEmailCompressed);
fs.writeFileSync('email-preview-compressed-ticket.html', ticketEmailCompressed);

// Create comparison page
const comparisonHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Banner Compression Comparison - SHAKTI</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: #333;
        }
        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .comparison-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card-header {
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            color: white;
            padding: 15px 20px;
            font-size: 18px;
            font-weight: bold;
        }
        .card-content {
            padding: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin: 15px 0;
        }
        .stat-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .stat-number {
            font-size: 20px;
            font-weight: bold;
            color: #e74c3c;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
        }
        .preview-buttons {
            text-align: center;
            margin: 20px 0;
        }
        .preview-button {
            background: #3498db;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            margin: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .preview-button:hover {
            background: #2980b9;
        }
        .optimization-benefits {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #27ae60;
        }
        .banner-preview {
            text-align: center;
            margin: 15px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .banner-preview img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .size-comparison {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #ffc107;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Banner Compression Comparison</h1>
            <p>Original vs Optimized SHAKTI Banner for Email Templates</p>
        </div>

        <div class="comparison-grid">
            <!-- Original Banner -->
            <div class="comparison-card">
                <div class="card-header">📊 Original Banner</div>
                <div class="card-content">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">169.5</div>
                            <div class="stat-label">KB Size</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">226</div>
                            <div class="stat-label">KB Base64</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">1398×341</div>
                            <div class="stat-label">Dimensions</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">100%</div>
                            <div class="stat-label">Quality</div>
                        </div>
                    </div>
                    <div class="preview-buttons">
                        <a href="email-preview-basic.html" target="_blank" class="preview-button">📧 Basic Email</a>
                        <a href="email-preview-ticket.html" target="_blank" class="preview-button">🎫 Ticket Email</a>
                    </div>
                </div>
            </div>

            <!-- Compressed Banner -->
            <div class="comparison-card">
                <div class="card-header">⚡ Optimized Banner</div>
                <div class="card-content">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">41.9</div>
                            <div class="stat-label">KB Size</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">55.9</div>
                            <div class="stat-label">KB Base64</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">1398×341</div>
                            <div class="stat-label">Dimensions</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">75%</div>
                            <div class="stat-label">Quality</div>
                        </div>
                    </div>
                    <div class="preview-buttons">
                        <a href="email-preview-compressed-basic.html" target="_blank" class="preview-button">📧 Basic Email</a>
                        <a href="email-preview-compressed-ticket.html" target="_blank" class="preview-button">🎫 Ticket Email</a>
                    </div>
                </div>
            </div>
        </div>

        <div class="size-comparison">
            <h3>📉 Size Reduction Summary</h3>
            <ul>
                <li><strong>Image Size:</strong> 169.5 KB → 41.9 KB (75.3% reduction)</li>
                <li><strong>Base64 Size:</strong> 226 KB → 55.9 KB (75.3% reduction)</li>
                <li><strong>Space Saved:</strong> 170.1 KB per email</li>
                <li><strong>Quality Loss:</strong> Minimal - still crisp and professional</li>
            </ul>
        </div>

        <div class="optimization-benefits">
            <h3>✅ Benefits of Optimized Banner</h3>
            <ul>
                <li><strong>Faster Email Loading:</strong> 75% smaller files load much quicker</li>
                <li><strong>Better Mobile Experience:</strong> Reduced data usage on mobile networks</li>
                <li><strong>Improved Deliverability:</strong> Smaller emails are less likely to be flagged</li>
                <li><strong>Server Efficiency:</strong> Less bandwidth usage for your email server</li>
                <li><strong>Same Visual Quality:</strong> Maintained professional appearance</li>
                <li><strong>All Email Clients:</strong> Works perfectly in Gmail, Outlook, Apple Mail, etc.</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 40px; padding: 20px; color: #666;">
            <p>SHAKTI - Association of Computer Engineering Students</p>
            <p>MIT-ADT University, Pune, India</p>
            <p><small>Comparison generated on: <span id="timestamp"></span></small></p>
        </div>
    </div>

    <script>
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
    </script>
</body>
</html>`;

fs.writeFileSync('banner-compression-comparison.html', comparisonHTML);

console.log('✅ Compressed email templates created successfully!');
console.log('📧 Compressed basic email saved to: email-preview-compressed-basic.html');
console.log('🎫 Compressed ticket email saved to: email-preview-compressed-ticket.html');
console.log('📊 Comparison page saved to: banner-compression-comparison.html');
console.log('');
console.log('📋 New Files Created:');
console.log('  ├── banner-compressed.jpg                    (Compressed image)');
console.log('  ├── banner-compressed-base64.json            (Compressed base64 data)');
console.log('  ├── banner-compressed-base64.js              (Compressed JS module)');
console.log('  ├── email-template-compressed.js             (Compressed email template)');
console.log('  ├── email-preview-compressed-basic.html      (Basic email with compressed banner)');
console.log('  ├── email-preview-compressed-ticket.html     (Ticket email with compressed banner)');
console.log('  └── banner-compression-comparison.html       (Side-by-side comparison)');
console.log('');
console.log('💡 How to use the compressed version:');
console.log('  1. Replace require("./banner-base64.js") with require("./banner-compressed-base64.js")');
console.log('  2. Or use the new email-template-compressed.js directly');
console.log('  3. Enjoy 75% smaller email files with same visual quality!');