import type { BibliographySearchGateway } from "../ports/bibliographySearch";
import { SCRAPBOX_BASE_URL } from "../scrapbox/constants";

export const searchScrapbox: BibliographySearchGateway = async (
  projectName,
  query,
) => {
  const params = new URLSearchParams({
    skip: "0",
    sort: "updated",
    limit: "30",
    q: query,
  });
  const searchUrl = `${SCRAPBOX_BASE_URL}/api/pages/${projectName}/search/query?${params}`;
  console.log("[eventPage] Performing direct search on Scrapbox:", searchUrl);
  const response = await fetch(searchUrl, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Scrapbox search failed: ${response.status}`);
  }
  return response.json();
};
