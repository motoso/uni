import Port = chrome.runtime.Port;
import ConnectInfo = chrome.runtime.ConnectInfo;

/**
 * 対応するサービス一覧
 * Unionで実装
 */
export const AcceptedService = {
  fanza: "FANZA",
  fanzaDojin: "FANZA（同人）",
  fanzaVideo: "FANZA（動画）",
  fanzaAnime: "FANZA（アニメ）",
  dmmDoujinBasket: "DMM同人カート", // 新しいサービスタイプを追加
  fc2ContentMarket: "FC2コンテンツマーケット",
  dlsite: "DLsite",
  dlsiteManiax: "DLsiteManiax",
  amazon: "Amazon",
  surugaya: "駿河屋",
  toranoana: "とらのあな",
  melonbooks: "メロンブックス",
  bookWalker: "Book Walker",
} as const;
export type AcceptedService =
  (typeof AcceptedService)[keyof typeof AcceptedService];

/**
 * 本のサービス
 * 本でないものは同人誌として扱う
 */
export const BookService = [
  AcceptedService.fanza,
  AcceptedService.dlsite,
  AcceptedService.amazon,
  AcceptedService.bookWalker,
];

export const isBook = (product: AcceptedService) => {
  for (const service of Object.values(BookService)) {
    if (service === product) {
      return true;
    }
  }
  return false;
};

/**
 * 動画サービス
 */
export const VideoService = [
  AcceptedService.fanzaVideo,
  AcceptedService.fanzaAnime,
  AcceptedService.fc2ContentMarket,
];

/**
 * 動画サービスかどうか
 * @param product
 */
export const isVideo = (product: AcceptedService) => {
  for (const service of Object.values(VideoService)) {
    if (service === product) {
      return true;
    }
  }
  return false;
};

export interface UniPort extends Port {
  name: AcceptedService;
}

export interface UniConnectInfo extends ConnectInfo {
  name?: AcceptedService;
}

/**
 * background scriptsとcontent scriptsでやり取りするときのコマンド
 */
export const UniCommand = {
  existsPage: "existsPage",
  createPage: "createPage",
  sendBibliography: "sendBibliography",
} as const;
export type UniCommand = (typeof UniCommand)[keyof typeof UniCommand];
