import type { Page } from "@playwright/test";

export interface HealthCheckResult {
  httpStatus: number | null;
  accessible: boolean;
  finalUrl?: string;
  error?: string;
}

// HTTP 403 は STRUCTURE_ERROR ではなく NETWORK_ERROR（ページすら読めていない）。
// allowIpBlock 指定サイトでは構造変更検知を諦め、CIのVPNデータセンターIPブロックという
// 環境ノイズをテスト失敗ではなく skip に変換する。
export function isEnvironmentalIpBlock(
  healthCheck: Pick<HealthCheckResult, "httpStatus">,
  allowIpBlock?: boolean,
): boolean {
  return !!allowIpBlock && healthCheck.httpStatus === 403;
}

export function isTransientlyUnavailable(
  healthCheck: HealthCheckResult,
  unavailableUrlPatterns: string[] = [],
): boolean {
  return unavailableUrlPatterns.some((pattern) =>
    healthCheck.finalUrl?.includes(pattern),
  );
}

// ヘルスチェック関数 - ネットワーク問題か構造問題かを判別
export async function performHealthCheck(
  page: Page,
  url: string,
): Promise<HealthCheckResult> {
  try {
    const response = await page.goto(url, { waitUntil: "commit" });
    const status = response?.status() ?? null;

    return {
      httpStatus: status,
      accessible: status ? status < 400 : false,
      finalUrl: page.url(),
    };
  } catch (error) {
    return {
      httpStatus: null,
      accessible: false,
      finalUrl: page.url(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
