import { AcceptedService, UniCommand } from "../constant";
import {
  StorageKeyProjectName,
  UniPostMessage,
  uniPostMessage,
} from "../chromeApi";
import SearchResult from "../scrapbox/SearchResult";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { CreatePageBar } from "../organism/CreatePageBar";
import ScrapboxApiClient from "../scrapbox/scrapboxApi";
import { AlertBar } from "../organism/AlertBar";
import Product from "../Product";
import browser from "webextension-polyfill";

/**
 * Content Scriptに必要な処理を集約したクラス
 */
export abstract class BaseContentScript {
  protected readonly ROOT_ELEM = "uniBarRoot";
  // これらは必ず実装してください
  protected readonly SERVICE: AcceptedService;

  /**
   * 開いたページから必要な情報をスクレイピングする
   * サービスのHTMLに依存する
   * @protected
   */
  protected abstract scrape(): Product;

  /**
   * 開いたページの上部のいい感じの要素を開発ツールで調べて指定する
   * サービスのHTMLに依存する
   * @protected
   */
  protected abstract createElementForBar(): void;

  execute() {
    const product = this.scrape();

    // コネクションを張って、存在しているかどうかを出す
    const port = browser.runtime.connect({ name: this.SERVICE });
    uniPostMessage(port, {
      command: UniCommand.sendBibliography,
      product: product,
    });

    // 返答待ち
    port.onMessage.addListener(async (msg: UniPostMessage) => {
      const items = await browser.storage.sync.get([StorageKeyProjectName]);
      const projectName = items[StorageKeyProjectName] as string;
      if (msg.command === UniCommand.existsPage) {
        // Message passingで型の情報がなくなっているので修正
        const result = SearchResult.makeFromListenerRequest(msg.searchResult);
        await this.createAlertBar(result, product, projectName);
      } else if (msg.command === UniCommand.createPage) {
        // Message passingで型の情報がなくなっているので修正
        const result = SearchResult.makeFromListenerRequest(msg.searchResult);
        await this.createPageBar(result, product, projectName);
      }
      // 処理が終了したので切断する
      port.disconnect();
    });
  }

  /**
   * ページ上部にアラート表示のバーの要素を出す
   * @param result
   * @param product
   * @param projectName
   * @private
   */
  protected async createAlertBar(
    result: SearchResult,
    product: Product,
    projectName: string,
  ): Promise<void> {
    this.createElementForBar();
    // メッセージを表示
    const existPages = result.pages.map((p) => {
      return {
        name: "/" + projectName + "/" + p.title,
        url:
          ScrapboxApiClient.BASE_URL +
          "/" +
          projectName +
          "/" +
          encodeURIComponent(p.title),
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
    result: SearchResult,
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
}
