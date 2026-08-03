import type { Page } from "@playwright/test";
import {
  isTransientlyUnavailable,
  performHealthCheck,
} from "../../support/monitoring-health-check";

describe("isTransientlyUnavailable", () => {
  const maintenanceUrlPatterns = [
    "https://cdn.suruga-ya.jp/maintenance/maintenance.html",
  ];

  it("detects a successful redirect to a configured maintenance page", () => {
    expect(
      isTransientlyUnavailable(
        {
          httpStatus: 200,
          accessible: true,
          finalUrl: "https://cdn.suruga-ya.jp/maintenance/maintenance.html",
        },
        maintenanceUrlPatterns,
      ),
    ).toBe(true);
  });

  it("does not treat the product page as unavailable", () => {
    expect(
      isTransientlyUnavailable(
        {
          httpStatus: 200,
          accessible: true,
          finalUrl: "https://www.suruga-ya.jp/product/detail/ZHORE232364",
        },
        maintenanceUrlPatterns,
      ),
    ).toBe(false);
  });

  it("requires an explicitly configured maintenance URL pattern", () => {
    expect(
      isTransientlyUnavailable(
        {
          httpStatus: 200,
          accessible: true,
          finalUrl: "https://example.com/maintenance/maintenance.html",
        },
        [],
      ),
    ).toBe(false);
  });
});

describe("performHealthCheck", () => {
  it("reports the final URL after redirects", async () => {
    const page = {
      goto: async () => ({ status: () => 200 }),
      url: () => "https://cdn.suruga-ya.jp/maintenance/maintenance.html",
    } as unknown as Page;

    await expect(
      performHealthCheck(
        page,
        "https://www.suruga-ya.jp/product/detail/ZHORE232364",
      ),
    ).resolves.toEqual({
      httpStatus: 200,
      accessible: true,
      finalUrl: "https://cdn.suruga-ya.jp/maintenance/maintenance.html",
    });
  });
});
