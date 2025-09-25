import { test, expect } from '@playwright/test';

// CI環境でのFANZA年齢認証問題の詳細デバッグ用テスト
// 通常は無効化しているが、専用デバッグワークフローでは実行される
const isDebugWorkflow = process.env.GITHUB_WORKFLOW === 'Debug CI Environment';
const describeMethod = isDebugWorkflow ? test.describe : test.describe.skip;

describeMethod('FANZA Age Verification Debug', () => {
  const failingSites = [
    {
      name: 'FANZA Video',
      url: 'https://video.dmm.co.jp/av/content/?id=apns00240',
      expectedContent: 'h1, table'
    },
    {
      name: 'FANZA Doujin',
      url: 'https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=d_335698/',
      expectedContent: '.productTitle__txt, h1'
    },
    {
      name: 'FANZA Books',
      url: 'https://book.dmm.co.jp/product/4425627/b425aakkg00576/',
      expectedContent: '.css-1omcat5, dl'
    }
  ];

  failingSites.forEach(site => {
    test(`Debug age verification: ${site.name}`, async ({ page }) => {
      const isCI = !!process.env.CI;

      console.log(`\n🔍 Debugging ${site.name}: ${site.url}`);

      try {
        // 初期アクセス
        const response = await page.goto(site.url, {
          waitUntil: 'commit',
          timeout: 30000
        });

        const status = response?.status() || 0;
        const finalUrl = page.url();
        const title = await page.title();

        console.log(`📊 Initial Response:`);
        console.log(`   Status: ${status}`);
        console.log(`   Final URL: ${finalUrl}`);
        console.log(`   Title: ${title}`);

        // 年齢認証ページかどうか確認
        if (finalUrl.includes('age_check') || title.includes('年齢認証')) {
          console.log(`\n🔞 AGE VERIFICATION PAGE DETECTED`);

          // 詳細なDOM分析
          console.log(`\n📋 DOM ANALYSIS:`);

          // 1. ページ全体のHTML構造（最初の3000文字）
          const htmlSnippet = await page.content();
          console.log(`   HTML Length: ${htmlSnippet.length} characters`);
          console.log(`   HTML Preview: ${htmlSnippet.substring(0, 500)}...`);

          // 2. すべてのボタン要素を検索
          const buttons = await page.evaluate(() => {
            const buttonElements = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a[role="button"]'));
            return buttonElements.map(btn => ({
              tagName: btn.tagName,
              type: btn.getAttribute('type'),
              textContent: btn.textContent?.trim() || '',
              innerHTML: btn.innerHTML,
              className: btn.className,
              id: btn.id,
              role: btn.getAttribute('role'),
              href: btn.getAttribute('href')
            }));
          });

          console.log(`\n🔘 BUTTON ELEMENTS FOUND (${buttons.length}):`);
          buttons.forEach((btn, idx) => {
            console.log(`   [${idx}] ${btn.tagName}: "${btn.textContent}" (class: "${btn.className}", id: "${btn.id}")`);
            if (btn.innerHTML && btn.innerHTML !== btn.textContent) {
              console.log(`       HTML: ${btn.innerHTML}`);
            }
          });

          // 3. テキストベースでのボタン検索
          const textMatches = await page.evaluate(() => {
            const allElements = Array.from(document.querySelectorAll('*'));
            const possibleButtons = allElements.filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('yes') || text.includes('enter') || text.includes('agree') ||
                     text.includes('はい') || text.includes('同意') || text.includes('18') ||
                     text.includes('adult') || text.includes('confirm');
            });

            return possibleButtons.map(el => ({
              tagName: el.tagName,
              textContent: el.textContent?.trim() || '',
              className: el.className,
              id: el.id,
              clickable: el.tagName === 'BUTTON' || el.tagName === 'A' ||
                         el.getAttribute('role') === 'button' ||
                         el.getAttribute('type') === 'submit'
            }));
          });

          console.log(`\n🎯 TEXT-BASED MATCHES (${textMatches.length}):`);
          textMatches.forEach((match, idx) => {
            console.log(`   [${idx}] ${match.tagName}: "${match.textContent}" (clickable: ${match.clickable})`);
          });

          // 4. フォーム要素の検索
          const forms = await page.evaluate(() => {
            const formElements = Array.from(document.querySelectorAll('form'));
            return formElements.map(form => ({
              action: form.action,
              method: form.method,
              inputs: Array.from(form.querySelectorAll('input')).map(input => ({
                type: input.type,
                name: input.name,
                value: input.value,
                id: input.id
              }))
            }));
          });

          console.log(`\n📝 FORM ELEMENTS (${forms.length}):`);
          forms.forEach((form, idx) => {
            console.log(`   [${idx}] Action: ${form.action}, Method: ${form.method}`);
            form.inputs.forEach((input, inputIdx) => {
              console.log(`       Input[${inputIdx}]: ${input.type} (name: "${input.name}", value: "${input.value}")`);
            });
          });

          // 5. 年齢認証の試行
          console.log(`\n🧪 ATTEMPTING AGE VERIFICATION:`);

          const ageCheckSelectors = [
            'text=はい',
            'text=Yes',
            'text=Enter',
            'text=I am 18 or older',
            'text=Agree',
            'text=Continue',
            'button:has-text("はい")',
            'button:has-text("Yes")',
            'button:has-text("Enter")',
            'input[value="はい"]',
            'input[value="Yes"]',
            'input[type="submit"]',
            '[class*="yes"], [class*="agree"], [class*="enter"]',
            'a[href*="age_check"]'
          ];

          let successfulSelector = null;
          for (const selector of ageCheckSelectors) {
            try {
              const element = page.locator(selector).first();
              if (await element.isVisible({ timeout: 1000 })) {
                console.log(`   ✅ Found working selector: ${selector}`);
                successfulSelector = selector;

                // 要素の詳細情報を取得
                const elementInfo = await element.evaluate(el => ({
                  tagName: el.tagName,
                  textContent: el.textContent,
                  className: el.className,
                  id: el.id,
                  href: el.getAttribute('href'),
                  type: el.getAttribute('type')
                }));
                console.log(`      Element details: ${JSON.stringify(elementInfo)}`);
                break;
              }
            } catch (error) {
              console.log(`   ❌ Selector failed: ${selector}`);
            }
          }

          if (successfulSelector) {
            console.log(`\n🎯 ATTEMPTING CLICK ON: ${successfulSelector}`);
            try {
              await page.locator(successfulSelector).first().click();
              await page.waitForTimeout(3000);

              const newUrl = page.url();
              const newTitle = await page.title();
              console.log(`   After click - URL: ${newUrl}`);
              console.log(`   After click - Title: ${newTitle}`);

              if (!newUrl.includes('age_check')) {
                console.log(`   ✅ Age verification succeeded!`);
              } else {
                console.log(`   ❌ Still on age verification page`);
              }
            } catch (error) {
              console.log(`   ❌ Click failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            console.log(`   ❌ No working age verification selector found`);
          }

        } else if (finalUrl.includes('login') || title.includes('ログイン')) {
          console.log(`\n🔑 LOGIN PAGE DETECTED`);
          console.log(`   This explains why FANZA Books fails - requires login from overseas IP`);

        } else {
          console.log(`\n✅ DIRECT ACCESS - No age verification or login required`);
        }

        // テストは常に成功（情報収集目的）
        expect(status).toBeGreaterThan(0);

      } catch (error) {
        console.log(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        expect(error).toBeDefined();
      }
    });
  });
});