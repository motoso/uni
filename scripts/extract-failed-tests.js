#!/usr/bin/env node
/**
 * CI失敗ログから失敗したテスト名を抽出し、再実行用のコマンドを生成するスクリプト
 */

const fs = require('fs');
const path = require('path');

function extractFailedTests(logContent) {
  const failedTests = [];

  // Playwrightの失敗テストパターンをマッチング
  const failurePatterns = [
    // Pattern 1: [chromium] › path › test name
    /\d+\)\s+\[(\w+)\]\s+›\s+([^›]+)\s+›\s+(.+?)(?:\s+Error:|TypeError:|$)/g,
    // Pattern 2: Alternative format
    /\d+\)\s+\[(\w+)\]\s+›\s+(.+?)(?:\s+Error:|TypeError:|$)/g
  ];

  for (const pattern of failurePatterns) {
    let match;
    while ((match = pattern.exec(logContent)) !== null) {
      const browser = match[1];
      let testPath, testName;

      if (match[3]) {
        // Has describe block
        testPath = match[2].trim();
        testName = match[3].trim();
      } else {
        // Direct test name
        const parts = match[2].split(' › ');
        if (parts.length > 1) {
          testPath = parts.slice(0, -1).join(' › ');
          testName = parts[parts.length - 1];
        } else {
          testName = match[2].trim();
        }
      }

      failedTests.push({
        browser,
        testPath: testPath || '',
        testName,
        fullName: testPath ? `${testPath} › ${testName}` : testName
      });
    }
  }

  return failedTests;
}

function generatePlaywrightCommands(failedTests) {
  const commands = [];

  // Group by test files and generate focused commands
  const testsByPath = {};

  failedTests.forEach(test => {
    const key = test.testPath || test.testName;
    if (!testsByPath[key]) {
      testsByPath[key] = [];
    }
    testsByPath[key].push(test);
  });

  // Generate grep patterns for failed tests
  const grepPatterns = [...new Set(failedTests.map(t => t.testName))];

  if (grepPatterns.length > 0) {
    // Create command with multiple grep patterns
    const grepPattern = grepPatterns.join('|');
    commands.push(`npx playwright test --grep "${grepPattern}"`);
    commands.push(`npm run test:failed-only`); // Will be created in package.json
  }

  return {
    commands,
    patterns: grepPatterns,
    count: failedTests.length
  };
}

function main() {
  let logContent = '';

  // Read from stdin if available, otherwise from file
  if (process.argv[2]) {
    const logFile = process.argv[2];
    if (fs.existsSync(logFile)) {
      logContent = fs.readFileSync(logFile, 'utf8');
    } else {
      console.error(`Log file not found: ${logFile}`);
      process.exit(1);
    }
  } else {
    // Read from provided log content (for testing)
    logContent = `
  1) [chromium] › src/__tests__/large/monitoring/scraping-logic.test.ts:28:7 › FANZA Video Scraping Logic › should successfully run FANZA Video scraping logic
    Error: expect(received).toBeTruthy()

  2) [chromium] › src/__tests__/large/monitoring/scraping-logic.test.ts:67:7 › FANZA Doujin Scraping Logic › should successfully run FANZA Doujin scraping logic
    TypeError: Cannot read properties of null (reading 'title')

  3) [chromium] › src/__tests__/large/monitoring/scraping-logic.test.ts:105:7 › FANZA Books Scraping Logic › should successfully run FANZA Books scraping logic
    Error: expect(received).toBeTruthy()

  4) [chromium] › src/__tests__/large/monitoring/scraping-logic.test.ts:147:9 › Amazon Scraping Logic › should successfully run Amazon scraping logic - Amazon (English)
    Error: expect(received).toBeTruthy()

  5) [chromium] › src/__tests__/large/monitoring/scraping-logic.test.ts:147:9 › Amazon Scraping Logic › should successfully run Amazon scraping logic - Amazon (Japanese)
    Error: expect(received).toBeTruthy()

  6) [chromium] › src/__tests__/large/monitoring/scraping-logic.test.ts:248:7 › DLsiteBooks Scraping Logic › should successfully run DLsiteBooks scraping logic
    Error: expect(received).toBeTruthy()

  7) [chromium] › src/__tests__/large/monitoring/scraping-logic.test.ts:317:7 › DLsiteManiax Scraping Logic › should successfully run DLsiteManiax scraping logic
    Error: expect(received).toBeTruthy()
    `;
  }

  const failedTests = extractFailedTests(logContent);
  const result = generatePlaywrightCommands(failedTests);

  console.log(`\n🔍 Found ${result.count} failed tests:\n`);

  failedTests.forEach((test, i) => {
    console.log(`${i + 1}. [${test.browser}] ${test.fullName}`);
  });

  console.log(`\n🚀 Commands to run failed tests only:\n`);
  result.commands.forEach(cmd => {
    console.log(`  ${cmd}`);
  });

  console.log(`\n📝 Grep patterns:`);
  console.log(`  "${result.patterns.join('|')}"`);

  // Write patterns to file for reuse
  const patternsFile = path.join(__dirname, '..', 'failed-tests-patterns.txt');
  fs.writeFileSync(patternsFile, result.patterns.join('\n'));
  console.log(`\n💾 Patterns saved to: ${patternsFile}`);
}

if (require.main === module) {
  main();
}

module.exports = { extractFailedTests, generatePlaywrightCommands };
