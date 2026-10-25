import type { Page } from "@playwright/test";

function isDmmHostname(hostname: string): boolean {
  return hostname === "dmm.co.jp" || hostname.endsWith(".dmm.co.jp");
}

/**
 * Returns the DMM product URL encoded in an age-check URL.
 *
 * The destination is deliberately restricted to HTTPS DMM hosts so this
 * value remains safe to use for browser navigation.
 */
export function getDmmAgeCheckRedirectUrl(
  ageCheckUrl: string,
): string | undefined {
  try {
    const ageCheck = new URL(ageCheckUrl);
    if (
      ageCheck.protocol !== "https:" ||
      !isDmmHostname(ageCheck.hostname) ||
      !ageCheck.pathname.includes("age_check")
    ) {
      return undefined;
    }

    const redirectValue = ageCheck.searchParams.get("rurl");
    if (!redirectValue) {
      return undefined;
    }

    const redirect = new URL(redirectValue);
    if (redirect.protocol !== "https:" || !isDmmHostname(redirect.hostname)) {
      return undefined;
    }

    return redirect.href;
  } catch {
    return undefined;
  }
}

export async function bypassDmmAgeCheckWithCookie(
  page: Page,
): Promise<boolean> {
  const redirectUrl = getDmmAgeCheckRedirectUrl(page.url());
  if (!redirectUrl) {
    return false;
  }

  await page.context().addCookies([
    {
      name: "age_check_done",
      value: "1",
      domain: ".dmm.co.jp",
      path: "/",
      secure: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto(redirectUrl, { waitUntil: "domcontentloaded" });
  return true;
}
