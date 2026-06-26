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
