import { sign } from "node:crypto";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const tokenUrl = "https://oauth2.googleapis.com/token";
const scope = "https://www.googleapis.com/auth/chromewebstore";

export function createAssertion(credentials, now = Date.now()) {
    if (
        credentials.type !== "service_account" ||
        !credentials.client_email ||
        !credentials.private_key ||
        credentials.token_uri !== tokenUrl
    ) {
        throw new Error("Invalid service account configuration");
    }
    const encode = (value) =>
        Buffer.from(JSON.stringify(value)).toString("base64url");
    const iat = Math.floor(now / 1000);
    const unsigned = [
        encode({ alg: "RS256", typ: "JWT" }),
        encode({
            iss: credentials.client_email,
            scope,
            aud: tokenUrl,
            iat,
            exp: iat + 3600,
        }),
    ].join(".");
    const signature = sign(
        "RSA-SHA256",
        Buffer.from(unsigned),
        credentials.private_key,
    ).toString("base64url");
    return `${unsigned}.${signature}`;
}

export async function requestAccessToken(credentials, fetchImpl = fetch) {
    const response = await fetchImpl(tokenUrl, {
        method: "POST",
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: createAssertion(credentials),
        }),
        signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
        // Do not print response bodies, assertions, or credential values.
        throw new Error(
            `OAuth token exchange failed (HTTP ${response.status})`,
        );
    }
    const result = await response.json();
    if (
        typeof result.access_token !== "string" ||
        !/^[A-Za-z0-9._~-]+$/.test(result.access_token)
    ) {
        throw new Error("OAuth response did not contain a valid access token");
    }
    return result.access_token;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    try {
        const credentials = JSON.parse(process.env.CHROME_SERVICE_ACCOUNT_JSON);
        const token = await requestAccessToken(credentials);
        console.log(`::add-mask::${token}`);
        appendFileSync(process.env.GITHUB_OUTPUT, `access_token=${token}\n`);
        console.log("Chrome Web Store access token acquired.");
    } catch {
        console.error(
            "Chrome Web Store service account authentication failed.",
        );
        process.exitCode = 1;
    }
}
