/**
 * Pure function to scrape Amazon book data from the DOM
 */

export interface AmazonScrapedData {
  title: string;
  authors: string[];
  publisher: string | null;
  publishedAt: string | null;
  url: string;
}

export function scrapeAmazonData(document: Document): AmazonScrapedData | null {
  const isCI = !!(typeof process !== 'undefined' && process.env?.CI);

  // デバッグログ関数
  const log = (message: string) => {
    if (isCI) {
      console.log(`[Amazon-Scraper] ${message}`);
    }
  };

  try {
    log('Starting Amazon scraping...');

    // タイトル取得 - より多くのセレクターを試行
    const titleSelectors = [
      "#productTitle",               // 最優先
      "#title",                     // 代替ID
      "h1.product-title",           // クラス付きh1
      "h1 span#productTitle",       // ネストしたspan
      "[data-testid='product-title']", // テストID
      ".product-title",             // クラス
      "h1",                        // 汎用h1
    ];

    let titleElement: HTMLElement | null = null;
    for (const selector of titleSelectors) {
      if (selector === "#productTitle") {
        titleElement = document.getElementById("productTitle");
      } else {
        titleElement = document.querySelector(selector) as HTMLElement;
      }

      if (titleElement?.textContent?.trim()) {
        log(`Found title with selector: ${selector}`);
        break;
      }
      log(`Title selector failed: ${selector}`);
    }

    if (!titleElement) {
      log('❌ No title found with any selector');
      return null;
    }

    const title = titleElement.textContent?.trim() || '';
    const url = document.location?.href || '';

    if (!title) {
      log('❌ Title element found but no text content');
      return null;
    }
    log(`✅ Title found: ${title.substring(0, 50)}...`);

    // Get product details - より多くのセレクターを試行
    const detailsSelectors = [
      "#detailBullets_feature_div li",        // 最優先
      "#feature-bullets li",                  // 代替セレクター
      "#productDetails_feature_div li",       // 商品詳細
      ".feature li",                          // フィーチャーリスト
      "[data-testid='product-details'] li",   // テストID付き
      ".product-details li",                  // クラス
      "#productDetails li",                   // 商品詳細リスト
    ];

    let productDetails: Element[] = [];
    for (const selector of detailsSelectors) {
      productDetails = Array.from(document.querySelectorAll(selector));
      if (productDetails.length > 0) {
        log(`Found product details with selector: ${selector} (${productDetails.length} items)`);
        break;
      }
      log(`Product details selector failed: ${selector}`);
    }

    if (productDetails.length === 0) {
      log('⚠️ No product details found, trying table-based approach');
      // テーブルベースのアプローチを試行
      const tableRows = Array.from(document.querySelectorAll("#productDetails_detailBullets_sections1 tr"));
      if (tableRows.length > 0) {
        productDetails = tableRows;
        log(`Found product details in table format (${tableRows.length} rows)`);
      }
    }

    // Extract publisher from product details (Japanese and English support)
    const publisherRows = productDetails.filter((i) => {
      const text = (i as HTMLElement).textContent || '';
      return text.includes("出版社") || text.includes("Publisher");
    });
    const publisherRow = publisherRows.length > 0 ? publisherRows[0] as HTMLElement : null;

    let publisher = null;
    if (publisherRow) {
      // Chrome・Firefox両対応のため複数パターンを試行（日本語・英語対応）
      const publisherPatterns = [
        // Japanese patterns
        /出版社\s*‏\s*:\s*‎\s*([^(]+?)\s*\(/,  // Chrome用（Unicode制御文字あり）
        /出版社\s*:\s*([^(]+?)\s*\(/,          // Firefox用（Unicode制御文字なし）
        /出版社[\s\u200E\u200F]*:[\s\u200E\u200F]*([^(]+?)\s*\(/, // 汎用パターン
        // English patterns
        /Publisher[\s\u200E\u200F]*:[\s\u200E\u200F]*([^(]+?)\s*\(/,  // English with Unicode characters
        /Publisher\s*:\s*([^(]+?)\s*\(/,                               // English simple
        /Publisher[\s\u200E\u200F]*:[\s\u200E\u200F]*([^|]+?)\s*\|/   // English with | delimiter
      ];

      for (const pattern of publisherPatterns) {
        const publisherMatch = publisherRow.textContent?.match(pattern);
        if (publisherMatch) {
          publisher = publisherMatch[1].trim();
          break;
        }
      }
    }

    // Extract publication date (Japanese and English support)
    let publishedAt = null;
    const publishedAtRows = productDetails.filter((i) => {
      const text = (i as HTMLElement).textContent || '';
      return text.includes("発売日") || text.includes("Publication date");
    });
    if (publishedAtRows.length > 0) {
      const publishedAtRow = publishedAtRows[0] as HTMLElement;
      const publishedAtPatterns = [
        // Japanese patterns
        /発売日[\s\u200E\u200F]*:[\s\u200E\u200F]*(.+)/,
        // English patterns
        /Publication date[\s\u200E\u200F]*:[\s\u200E\u200F]*([^|]+?)(?:\s*\|)/,  // English with | delimiter
        /Publication date[\s\u200E\u200F]*:[\s\u200E\u200F]*(.+)/               // English simple
      ];

      for (const pattern of publishedAtPatterns) {
        const publishedAtMatch = publishedAtRow.textContent?.match(pattern);
        if (publishedAtMatch) {
          publishedAt = publishedAtMatch[1].trim();
          break;
        }
      }
    }

    // Extract authors - より多くのセレクターを試行
    const authors: string[] = [];
    const authorSelectors = [
      "[href*='ref=dp_byline_cont_book']",     // 最優先（byline links）
      ".author a",                             // author クラス内のリンク
      "#bylineInfo a",                         // byline 情報内のリンク
      ".a-color-secondary a",                  // セカンダリカラーのリンク（著者によく使われる）
      "[data-testid='author-link']",           // テストID付き
      ".author-name",                          // 著者名クラス
      ".by-author a",                          // by-authorクラス内
    ];

    for (const selector of authorSelectors) {
      const authorElements = document.querySelectorAll(selector);
      if (authorElements.length > 0) {
        log(`Found authors with selector: ${selector} (${authorElements.length} elements)`);
        for (const authorElement of authorElements) {
          const authorName = authorElement.textContent?.trim();
          if (authorName && !authors.includes(authorName) && authorName.length > 1) {
            authors.push(authorName);
          }
        }
        if (authors.length > 0) break; // 著者が見つかったら他のセレクターは試さない
      }
      log(`Author selector failed: ${selector}`);
    }

    log(`✅ Authors found: [${authors.join(', ')}]`);

    return {
      title,
      authors,
      publisher,
      publishedAt,
      url
    };
  } catch (error) {
    console.error('Error scraping Amazon data:', error);
    return null;
  }
}