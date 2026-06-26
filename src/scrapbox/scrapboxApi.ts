import Product from "../Product";
import { StorageKeyProjectName } from "../chromeApi";
import browser from "webextension-polyfill";
import {
  SearchBibliographyAction,
  SearchBibliographyResponseDto,
  SearchResultDto,
} from "./searchDtos";

type SearchProps = {
  product: Product;
};

class ScrapboxApiClient {
  async search(props: SearchProps): Promise<SearchResultDto> {
    const response = (await browser.runtime.sendMessage({
      action: SearchBibliographyAction,
      query: props.product.titleForSearch,
    })) as SearchBibliographyResponseDto;

    if (response.status === "ok") {
      console.log("[ScrapboxApiClient] Received search result:", response);
      return response.searchResult;
    }

    console.error("Search failed in background script:", response.error);
    throw new Error(response.error.message);
  }

  static async getProjectName(): Promise<{ [key: string]: string }> {
    const items = await browser.storage.sync.get([StorageKeyProjectName]);
    return items as { [key: string]: string };
    // console.log(result)
    // return result.projectName
  }
}

export default ScrapboxApiClient;
