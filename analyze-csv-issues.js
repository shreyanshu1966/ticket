// analyze-csv-issues.js - Analyze why some attendees are not being processed
const csv = require('csv-parser');
const fs = require('fs');
const config = require('./config');

async function analyzeCsvIssues() {
    console.log('🔍 ANALYZING CSV PROCESSING ISSUES');
    console.log('==================================\n');

    return new Promise((resolve, reject) => {
        const allRows = [];
        const validAttendees = [];
        const invalidRows = [];
        const duplicateEmails = new Map();
        const issues = {
            missingName: [],
            missingEmail: [],
            invalidEmail: [],
            duplicateEmails: [],
            emptyRows: [],
            malformedRows: []
        };

        let lineNumber = 1; // Start from 1 for header

        console.log(`📖 Reading CSV file: ${config.csvFile}\n`);

        fs.createReadStream(config.csvFile)
            .pipe(csv())
            .on('data', (row) => {
                lineNumber++;
                allRows.push({ lineNumber, row });

                // Check for completely empty rows
                const hasAnyData = Object.values(row).some(value => value && value.trim() !== '');
                if (!hasAnyData) {
                    issues.emptyRows.push({ lineNumber, row });
                    return;
                }

                // Check for missing name
                if (!row.Name || row.Name.trim() === '') {
                    issues.missingName.push({ lineNumber, row });
                    invalidRows.push({ lineNumber, row, reason: 'Missing Name' });
                    return;
                }

                // Check for missing email
                if (!row['Email id'] || row['Email id'].trim() === '') {
                    issues.missingEmail.push({ lineNumber, row });
                    invalidRows.push({ lineNumber, row, reason: 'Missing Email' });
                    return;
                }

                // Validate email format
                const email = row['Email id'].trim().toLowerCase();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    issues.invalidEmail.push({ lineNumber, row, email });
                    invalidRows.push({ lineNumber, row, reason: 'Invalid Email Format' });
                    return;
                }

                // Check for duplicate emails
                if (duplicateEmails.has(email)) {
                    const originalLine = duplicateEmails.get(email);
                    issues.duplicateEmails.push({
                        email,
                        original: originalLine,
                        duplicate: { lineNumber, row }
                    });
                    invalidRows.push({ lineNumber, row, reason: 'Duplicate Email' });
                    return;
                } else {
                    duplicateEmails.set(email, { lineNumber, row });
                }

                // If we get here, the attendee is valid
                validAttendees.push({ lineNumber, row });
            })
            .on('end', () => {
                console.log('📊 ANALYSIS RESULTS');
                console.log('==================\n');

                console.log(`📋 Total Rows in CSV: ${allRows.length} (excluding header)`);
                console.log(`✅ Valid Attendees: ${validAttendees.length}`);
                console.log(`❌ Invalid Rows: ${invalidRows.length}`);
                console.log(`📧 Unique Emails: ${duplicateEmails.size}\n`);

                // Detailed breakdown
                console.log('🔍 ISSUE BREAKDOWN:');
                console.log('==================');
                console.log(`• Empty Rows: ${issues.emptyRows.length}`);
                console.log(`• Missing Name: ${issues.missingName.length}`);
                console.log(`• Missing Email: ${issues.missingEmail.length}`);
                console.log(`• Invalid Email Format: ${issues.invalidEmail.length}`);
                console.log(`• Duplicate Emails: ${issues.duplicateEmails.length}\n`);

                // Show specific issues
                if (issues.missingName.length > 0) {
                    console.log('❌ ROWS WITH MISSING NAMES:');
                    issues.missingName.slice(0, 10).forEach(item => {
                        console.log(`   Line ${item.lineNumber}: Email="${item.row['Email id']}" Contact="${item.row['Contact no.']}" Dept="${item.row['Department and branch']}"`);
                    });
                    if (issues.missingName.length > 10) {
                        console.log(`   ... and ${issues.missingName.length - 10} more\n`);
                    } else {
                        console.log('');
                    }
                }

                if (issues.missingEmail.length > 0) {
                    console.log('❌ ROWS WITH MISSING EMAILS:');
                    issues.missingEmail.slice(0, 10).forEach(item => {
                        console.log(`   Line ${item.lineNumber}: Name="${item.row.Name}" Contact="${item.row['Contact no.']}" Dept="${item.row['Department and branch']}"`);
                    });
                    if (issues.missingEmail.length > 10) {
                        console.log(`   ... and ${issues.missingEmail.length - 10} more\n`);
                    } else {
                        console.log('');
                    }
                }

                if (issues.invalidEmail.length > 0) {
                    console.log('❌ ROWS WITH INVALID EMAIL FORMAT:');
                    issues.invalidEmail.slice(0, 10).forEach(item => {
                        console.log(`   Line ${item.lineNumber}: Name="${item.row.Name}" Email="${item.email}"`);
                    });
                    if (issues.invalidEmail.length > 10) {
                        console.log(`   ... and ${issues.invalidEmail.length - 10} more\n`);
                    } else {
                        console.log('');
                    }
                }

                if (issues.duplicateEmails.length > 0) {
                    console.log('❌ DUPLICATE EMAILS:');
                    issues.duplicateEmails.slice(0, 10).forEach(item => {
                        console.log(`   Email: ${item.email}`);
                        console.log(`     Original: Line ${item.original.lineNumber} - ${item.original.row.Name}`);
                        console.log(`     Duplicate: Line ${item.duplicate.lineNumber} - ${item.duplicate.row.Name}`);
                    });
                    if (issues.duplicateEmails.length > 10) {
                        console.log(`   ... and ${issues.duplicateEmails.length - 10} more\n`);
                    } else {
                        console.log('');
                    }
                }

                if (issues.emptyRows.length > 0) {
                    console.log('❌ COMPLETELY EMPTY ROWS:');
                    issues.emptyRows.slice(0, 5).forEach(item => {
                        console.log(`   Line ${item.lineNumber}: Empty row detected`);
                    });
                    if (issues.emptyRows.length > 5) {
                        console.log(`   ... and ${issues.emptyRows.length - 5} more\n`);
                    } else {
                        console.log('');
                    }
                }

                // Summary and recommendations
                console.log('💡 SUMMARY:');
                console.log('==========');
                const expectedProcessed = validAttendees.length;
                console.log(`Expected to be processed: ${expectedProcessed}`);
                console.log(`Actually processed: 606 (from your previous run)`);
                console.log(`Difference: ${expectedProcessed - 606}\n`);

                if (expectedProcessed !== 606) {
                    console.log('🔧 POSSIBLE REASONS FOR DISCREPANCY:');
                    console.log('===================================');
                    console.log('1. Database duplicate prevention - attendees with same email already exist');
                    console.log('2. Processing errors during CSV import that were skipped');
                    console.log('3. Network/database connection issues during processing');
                    console.log('4. Previous partial runs that already saved some attendees');
                    console.log('5. Email validation differences between CSV analysis and database import\n');
                }

                console.log('🎯 RECOMMENDATIONS:');
                console.log('==================');
                if (issues.duplicateEmails.length > 0) {
                    console.log('• Clean duplicate emails in the CSV file before processing');
                }
                if (issues.invalidEmail.length > 0) {
                    console.log('• Fix invalid email formats in the CSV file');
                }
                if (issues.missingName.length > 0 || issues.missingEmail.length > 0) {
                    console.log('• Complete missing name/email information in the CSV file');
                }
                console.log('• Run "npm run check-duplicates" to see database-level duplicates');
                console.log('• Check MongoDB logs for any processing errors during import');

                resolve({
                    totalRows: allRows.length,
                    validAttendees: validAttendees.length,
                    invalidRows: invalidRows.length,
                    issues,
                    duplicateEmails: Array.from(duplicateEmails.keys())
                });
            })
            .on('error', (error) => {
                reject(new Error(`Error reading CSV file: ${error.message}`));
            });
    });
}

// Run the analysis
if (require.main === module) {
    analyzeCsvIssues().catch(error => {
        console.error('Analysis failed:', error.message);
        process.exit(1);
    });
}

module.exports = { analyzeCsvIssues };