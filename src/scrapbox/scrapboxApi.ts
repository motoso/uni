import SearchResult, { GetPagesSearchResponseInterface } from "./SearchResult";
// import ky from "ky"; // No longer needed here
import Page from "./Page";
import Product from "../Product";
import { StorageKeyProjectName } from "../chromeApi";

type SearchProps = {
  product: Product;
  projectName: string;
};

class ScrapboxApiClient {
  public static BASE_URL = "https://scrapbox.io"; // Still useful for eventPage

  async search(props: SearchProps): Promise<SearchResult> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "searchScrapbox",
          projectName: props.projectName,
          query: props.product.titleForSearch,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // Handle errors from sending the message or from the extension system
            console.error("Error sending message to background script:", chrome.runtime.lastError);
            return reject(new Error(chrome.runtime.lastError.message || "Unknown error sending message"));
          }

          if (response && response.success) {
            const rawRes: GetPagesSearchResponseInterface = response.data;
            console.log("[ScrapboxApiClient] Received rawRes from background:", rawRes); // Log rawRes
            const pages = rawRes.pages.map((page) => {
              return Page.make(page.title, page.image, page.lines.join("\n"), props.projectName);
            });
            const searchResult = SearchResult.make( // Create SearchResult instance
              rawRes.count,
              rawRes.projectName,
              rawRes.searchQuery,
              pages
            );
            console.log("[ScrapboxApiClient] Constructed SearchResult:", searchResult); // Log SearchResult
            resolve(searchResult);
          } else {
            // Handle logical errors from the background script (e.g., fetch failed)
            console.error("Search failed in background script:", response ? response.error : 'No response');
            const errorMsg = response && response.error && response.error.message ? response.error.message : "Unknown error during Scrapbox search";
            reject(new Error(errorMsg));
          }
        }
      );
    });
  }

  static async getProjectName(): Promise<{ [key: string]: string }> {
    return chrome.storage.sync.get([StorageKeyProjectName]);
    // console.log(result)
    // return result.projectName
  }
}

export default ScrapboxApiClient;
