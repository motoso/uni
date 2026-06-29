import { AcceptedService } from "../constant";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { CreatePageBar } from "../organism/CreatePageBar";
import { AlertBar } from "../organism/AlertBar";
import Product from "../Product";
import browser from "webextension-polyfill";
import {
  SearchBibliographyAction,
  SearchBibliographyRequestDto,
  SearchBibliographyResponseDto,
  SearchResultDto,
} from "../scrapbox/searchDtos";
import { waitForScrape } from "./dom/waitForScrape";

type RootElementMountPosition = "append" | "prepend" | "afterend";

/**
 * Content Scriptに必要な処理を集約したクラス
 */
export abstract class BaseContentScript {
  protected readonly ROOT_ELEM = "uniBarRoot";
  // これらは必ず実装してください
  protected readonly SERVICE: AcceptedService;

  /**
   * BFF / SPA で本文が後から描画されるサイトは true にする。
   * true の場合、即時 scrape に失敗しても DOM の変化を監視して再 scrape する。
   */
  protected readonly waitForDynamicContent: boolean = false;

  /** 動的描画を待つ場合のタイムアウト（ミリ秒）。 */
  protected readonly scrapeTimeoutMs: number = 10000;

  /**
   * 開いたページから必要な情報をスクレイピングする
   * サービスのHTMLに依存する
   * @protected
   */
  protected abstract scrape(): Product | null;

  /**
   * 開いたページの上部のいい感じの要素を開発ツールで調べて指定する
   * サービスのHTMLに依存する
   * @protected
   */
  protected abstract createElementForBar(): void;

  execute() {
    // 静的サイトと、本文が即時に存在する一般的なケースはここで完結する。
    const product = this.scrape();
    if (product) {
      void this.searchAndRender(product);
      return;
    }

    // 即時 scrape に失敗した場合、動的描画サイトのみ DOM 変化を待って再 scrape する。
    if (!this.waitForDynamicContent) {
      return;
    }

    void waitForScrape(() => this.scrape(), {
      timeoutMs: this.scrapeTimeoutMs,
    }).then((delayedProduct) => {
      if (delayedProduct) {
        return this.searchAndRender(delayedProduct);
      }
    });
  }

  protected async searchAndRender(product: Product): Promise<void> {
    try {
      const response = (await browser.runtime.sendMessage(
        this.createSearchRequest(product),
      )) as SearchBibliographyResponseDto;

      if (response.status === "error") {
        console.error("[uni] Scrapbox search failed:", response.error);
        return;
      }

      if (response.searchResult.count >= 1) {
        await this.createAlertBar(
          response.searchResult,
          product,
          response.projectName,
        );
      } else {
        await this.createPageBar(
          response.searchResult,
          product,
          response.projectName,
        );
      }
    } catch (error) {
      console.error("[uni] Scrapbox search failed:", error);
    }
  }

  protected createSearchRequest(
    product: Product,
  ): SearchBibliographyRequestDto {
    return {
      action: SearchBibliographyAction,
      query: product.titleForSearch,
    };
  }

  /**
   * ページ上部にアラート表示のバーの要素を出す
   * @param result
   * @param product
   * @param projectName
   * @private
   */
  protected async createAlertBar(
    result: SearchResultDto,
    product: Product,
    projectName: string,
  ): Promise<void> {
    this.createElementForBar();
    // メッセージを表示
    const existPages = result.pages.map((p) => {
      return {
        name: "/" + projectName + "/" + p.title,
        url: p.pageUrl,
      };
    });
    const container = document.getElementById(this.ROOT_ELEM);
    const root = createRoot(container);
    root.render(
      <AlertBar
        existPages={existPages}
        product={product}
        projectName={projectName}
      />,
    );
  }

  /**
   * ページ上部にScrapboxの新規ページのバーを出す
   * @param result
   * @param product
   * @param projectName
   * @private
   */
  protected async createPageBar(
    result: SearchResultDto,
    product: Product,
    projectName: string,
  ): Promise<void> {
    this.createElementForBar();
    // メッセージを表示
    const container = document.getElementById(this.ROOT_ELEM);
    const root = createRoot(container);
    root.render(<CreatePageBar product={product} projectName={projectName} />);
  }

  /**
   * バー表示用のRoot elementを作成する
   * @protected
   */
  protected createRootElement() {
    const divElement = document.createElement("div");
    divElement.id = this.ROOT_ELEM;
    return divElement;
  }

  protected mountRootElement(
    target: Element,
    position: RootElementMountPosition = "append",
  ): HTMLDivElement {
    const rootElement = this.createRootElement();

    switch (position) {
      case "prepend":
        target.insertBefore(rootElement, target.firstChild);
        break;
      case "afterend":
        target.insertAdjacentElement("afterend", rootElement);
        break;
      default:
        target.appendChild(rootElement);
    }

    return rootElement;
  }

  protected mountRootElementAtBodyStart(): HTMLDivElement {
    return this.mountRootElement(document.body, "prepend");
  }
}
