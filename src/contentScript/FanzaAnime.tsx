// CSSを有効にする
import "../organism/Bar.scss";

import { BaseContentScript } from "./BaseContentScript";
import { AcceptedService, UniCommand } from "../constant";
import { StorageKeyProjectName, uniPostMessage } from "../chromeApi";
import SearchResult from "../scrapbox/SearchResult";
import dayjs from "dayjs";
import Film from "../Film";
import { scrapeFanzaAnimeData } from "../scraping/fanza-anime-scraper";
import browser from "webextension-polyfill";

class FanzaAnime extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanzaAnime;

  protected createElementForBar(): void {
    const rootElement = this.createRootElement();

    // ヘッダー直後に要素を配置する
    const header = document.querySelector("header");

    // より安全なinsertAdjacentElementを使用
    header.insertAdjacentElement("afterend", rootElement);
  }

  protected scrape(): Film {
    console.log("[FanzaAnime] Starting scrape process...");

    // Try immediate scraping first
    let scrapedData = scrapeFanzaAnimeData(document);
    if (scrapedData) {
      console.log(
        "[FanzaAnime] Immediate scraping successful:",
        scrapedData.title,
      );
      return this.createFilm(scrapedData);
    }

    console.log(
      "[FanzaAnime] Immediate scraping failed, waiting for SPA content...",
    );

    // Wait for SPA content using MutationObserver
    this.waitForSPAContent().then((success) => {
      if (success) {
        const delayedData = scrapeFanzaAnimeData(document);
        if (delayedData) {
          console.log(
            "[FanzaAnime] Delayed scraping successful:",
            delayedData.title,
          );
          // Re-execute the content script flow with the new data
          this.handleDelayedScraping(delayedData);
        }
      }
    });

    // Return null for now, delayed scraping will handle success case
    return null;
  }

  private createFilm(scrapedData: any): Film {
    return Film.make(
      AcceptedService.fanzaAnime,
      scrapedData.title,
      scrapedData.actress,
      scrapedData.director,
      scrapedData.url,
      dayjs(scrapedData.publishedAt),
      scrapedData.label,
      scrapedData.manufacturerProductNumber,
    );
  }

  private async waitForSPAContent(): Promise<boolean> {
    console.log("[FanzaAnime] Setting up MutationObserver for SPA content...");

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log("[FanzaAnime] SPA content wait timeout");
        resolve(false);
      }, 10000); // 10 second timeout

      const observer = new MutationObserver((mutations) => {
        // Check if h1 elements have been added
        const h1Elements = document.querySelectorAll("h1");
        if (h1Elements.length > 0) {
          console.log(
            "[FanzaAnime] SPA content detected, h1 elements found:",
            h1Elements.length,
          );
          clearTimeout(timeout);
          observer.disconnect();
          resolve(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  private handleDelayedScraping(scrapedData: any): void {
    console.log("[FanzaAnime] Handling delayed scraping results...");

    const film = this.createFilm(scrapedData);
    console.log("[FanzaAnime] Created film object:", film.title);

    // Re-execute the content script flow with the successful data
    const port = browser.runtime.connect({ name: this.SERVICE });
    uniPostMessage(port, {
      command: UniCommand.sendBibliography,
      product: film,
    });

    // Handle response (same as BaseContentScript.execute())
    port.onMessage.addListener(async (msg: any) => {
      const items = await browser.storage.sync.get([StorageKeyProjectName]);
      const projectName = items[StorageKeyProjectName] as string;

      if (msg.command === UniCommand.existsPage) {
        const result = SearchResult.makeFromListenerRequest(msg.searchResult);
        await this.createAlertBar(result, film, projectName);
      } else if (msg.command === UniCommand.createPage) {
        const result = SearchResult.makeFromListenerRequest(msg.searchResult);
        await this.createPageBar(result, film, projectName);
      }
      port.disconnect();
    });

    console.log("[FanzaAnime] Delayed scraping flow initiated");
  }
}

const f = new FanzaAnime();
f.execute();
