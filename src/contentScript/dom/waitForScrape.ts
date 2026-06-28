export type WaitForScrapeOptions = {
  /** これを超えたら null で解決する。デフォルト 10 秒。 */
  timeoutMs?: number;
  /** 監視対象のルート要素。デフォルトは document.body。 */
  root?: ParentNode & Node;
};

/**
 * `scrapeFn` が非nullを返すまで待つ。
 *
 * 1. まず即時に1回試す。
 * 2. nullなら `root` のDOM変化を MutationObserver で監視し、変化のたびに再試行する。
 * 3. `timeoutMs` を超えても成功しなければ null で解決する。
 *
 * blind な `setTimeout` 固定待ちや独自 polling を置き換えるための共通待ち関数。
 */
export function waitForScrape<T>(
  scrapeFn: () => T | null,
  options: WaitForScrapeOptions = {},
): Promise<T | null> {
  const immediate = scrapeFn();
  if (immediate != null) {
    return Promise.resolve(immediate);
  }

  const { timeoutMs = 10000 } = options;
  const root = options.root ?? document.body;
  const doc = root.ownerDocument ?? (root as Document);
  const ObserverCtor =
    doc.defaultView?.MutationObserver ?? globalThis.MutationObserver;

  return new Promise<T | null>((resolve) => {
    let settled = false;

    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      observer.disconnect();
      resolve(value);
    };

    const observer = new ObserverCtor(() => {
      const result = scrapeFn();
      if (result != null) {
        finish(result);
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    const timer = setTimeout(() => finish(null), timeoutMs);
  });
}

/**
 * `selector` に一致する要素が現れるまで待つ。
 * `waitForScrape` の薄いラッパ。
 */
export function waitForElement(
  selector: string,
  options: WaitForScrapeOptions = {},
): Promise<Element | null> {
  return waitForScrape(
    () => (options.root ?? document.body).querySelector(selector),
    options,
  );
}
