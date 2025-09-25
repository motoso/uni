#!/usr/bin/env node
/**
 * GitHub CLI連携でCI失敗ログから失敗テストを抽出するスクリプト
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { extractFailedTests, generatePlaywrightCommands } = require('./extract-failed-tests');

async function getLatestFailedRun() {
  try {
    // 最新の失敗したワークフローランを取得
    const output = execSync('gh run list --status=failure --limit=1 --json=databaseId,conclusion,workflowName', { encoding: 'utf8' });
    const runs = JSON.parse(output);

    if (runs.length === 0) {
      console.log('❌ No failed workflow runs found');
      return null;
    }

    const latestFailed = runs[0];
    console.log(`📋 Latest failed run: ${latestFailed.workflowName} (ID: ${latestFailed.databaseId})`);
    return latestFailed.databaseId;
  } catch (error) {
    console.error('❌ Error getting latest failed run:', error.message);
    return null;
  }
}

async function getRunLogs(runId) {
  try {
    console.log(`📥 Fetching logs for run ID: ${runId}...`);
    const logs = execSync(`gh run view ${runId} --log`, { encoding: 'utf8' });
    return logs;
  } catch (error) {
    console.error(`❌ Error fetching logs for run ${runId}:`, error.message);
    console.log('💡 Make sure you have the GitHub CLI installed and authenticated');
    console.log('💡 Run: gh auth login');
    return null;
  }
}

async function main() {
  console.log('🔍 CI Failed Test Extractor\n');

  let runId = process.argv[2];

  // runIdが指定されていない場合は最新の失敗ランを取得
  if (!runId) {
    console.log('🔍 No run ID specified, looking for latest failed run...');
    runId = await getLatestFailedRun();
    if (!runId) {
      process.exit(1);
    }
  } else {
    console.log(`📋 Using specified run ID: ${runId}`);
  }

  // ログを取得
  const logs = await getRunLogs(runId);
  if (!logs) {
    process.exit(1);
  }

  // 失敗テストを抽出
  console.log('🔍 Extracting failed tests from logs...\n');
  const failedTests = extractFailedTests(logs);

  if (failedTests.length === 0) {
    console.log('✅ No failed tests found in the logs');
    return;
  }

  const result = generatePlaywrightCommands(failedTests);

  console.log(`🔍 Found ${result.count} failed tests:\n`);

  failedTests.forEach((test, i) => {
    console.log(`${i + 1}. [${test.browser}] ${test.fullName}`);
  });

  console.log(`\n🚀 Commands to run failed tests locally:\n`);
  result.commands.forEach(cmd => {
    console.log(`  ${cmd}`);
  });

  console.log(`\n📝 Grep patterns:`);
  console.log(`  "${result.patterns.join('|')}"`);

  // Write patterns to file for reuse
  const patternsFile = path.join(__dirname, '..', 'failed-tests-patterns.txt');
  fs.writeFileSync(patternsFile, result.patterns.join('\n'));
  console.log(`\n💾 Patterns saved to: ${patternsFile}`);
  console.log(`\n▶️  Next steps:`);
  console.log(`   1. Run: npm run test:failed-only`);
  console.log(`   2. Fix the failing tests`);
  console.log(`   3. Commit and push your fixes`);
  console.log(`   4. CI will run all tests to ensure no regressions\n`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getLatestFailedRun, getRunLogs };