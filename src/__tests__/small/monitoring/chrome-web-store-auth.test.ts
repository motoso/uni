import { describe, expect, test } from "@jest/globals";
import { generateKeyPairSync, verify } from "node:crypto";
import {
  createAssertion,
  requestAccessToken,
} from "../../../../.github/scripts/chrome-web-store-auth.mjs";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const credentials = {
  type: "service_account",
  client_email: "publisher@example.invalid",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
  token_uri: "https://oauth2.googleapis.com/token",
};

describe("Chrome Web Store service account authentication", () => {
  test("signs a scoped, one-hour JWT without user impersonation", () => {
    const [header, claims, signature] = createAssertion(
      credentials,
      1800000000000,
    ).split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({
      alg: "RS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(claims, "base64url").toString())).toEqual({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/chromewebstore",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1800000000,
      exp: 1800003600,
    });
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(`${header}.${claims}`),
        publicKey,
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(true);
  });

  test("rejects an unexpected token endpoint", () => {
    expect(() =>
      createAssertion({ ...credentials, token_uri: "https://example.invalid" }),
    ).toThrow("Invalid service account configuration");
  });

  test("exchanges a JWT directly at Google's OAuth endpoint", async () => {
    const token = await requestAccessToken(
      credentials,
      async (url, options) => {
        expect(url).toBe(credentials.token_uri);
        expect(options.method).toBe("POST");
        expect(options.body.get("grant_type")).toBe(
          "urn:ietf:params:oauth:grant-type:jwt-bearer",
        );
        expect(options.body.get("assertion").split(".")).toHaveLength(3);
        return { ok: true, json: async () => ({ access_token: "test-token" }) };
      },
    );
    expect(token).toBe("test-token");
  });

  test("reports an HTTP failure without including the response body", async () => {
    await expect(
      requestAccessToken(credentials, async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: "private response" }),
      })),
    ).rejects.toThrow("OAuth token exchange failed (HTTP 401)");
  });

  test("rejects multiline tokens before they can reach GitHub outputs", async () => {
    await expect(
      requestAccessToken(credentials, async () => ({
        ok: true,
        json: async () => ({ access_token: "token\nunexpected-output=value" }),
      })),
    ).rejects.toThrow("OAuth response did not contain a valid access token");
  });
});
