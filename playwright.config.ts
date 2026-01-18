import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: '**/__tests__/large/**/*.test.ts',
  timeout: process.env.CI ? 180000 : 90000, // CI環境では3分（VPN遅延考慮）、ローカルは1.5分

  fullyParallel: !process.env.CI, // CI環境では安定性優先、ローカルは並列
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0, // CI環境では3回リトライでfalse positive削減
  workers: process.env.CI ? 1 : undefined, // CI環境では安定性優先で1ワーカー

  reporter: process.env.CI ? 'github' : 'html',

  use: {
    headless: !!process.env.CI, // CI環境ではヘッドレスモード強制
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // CI環境ではVPN遅延を考慮してより長いタイムアウトを設定
    navigationTimeout: process.env.CI ? 90000 : 30000, // VPN環境では1.5分
    actionTimeout: process.env.CI ? 30000 : 10000, // VPN環境では30秒
    // CI環境でのUser-Agent設定（サイトのブロック回避）
    userAgent: process.env.CI ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' : undefined,
    // Amazon等のボット検出回避のための追加設定
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    extraHTTPHeaders: {
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Firefox用の最適化されたタイムアウト設定
        navigationTimeout: 45000, // ナビゲーション用（デフォルト30秒より長め）
        actionTimeout: 15000,     // アクション用（デフォルト10秒より長め）
      },
    },
  ],

  webServer: undefined,
});