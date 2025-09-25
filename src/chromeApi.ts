import Book from "./Book";
import SearchResult from "./scrapbox/SearchResult";
import { UniCommand } from "./constant";
import Product from "./Product";
import browser from "webextension-polyfill";

type Port = browser.Runtime.Port;

// Chromeのメッセージを送るときの型がここに集約されている
// export interface SendProps {
//   book: Book;
// }
// export function sendMessage(request: SendProps) {
//   chrome.runtime.sendMessage(
//     request
//   );
// }

/**
 * UniPortを利用するときのMessage
 */
export type UniPostMessage = {
  command: UniCommand;
  product?: Product;
  searchResult?: SearchResult;
};

export function uniPostMessage(port: Port, message: UniPostMessage) {
  port.postMessage(message);
}

export const StorageKeyProjectName = "projectName";
export const StorageKeyScrapboxFormats = "scrapboxFormats";
