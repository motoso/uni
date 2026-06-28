export interface FanzaVideoScrapedData {
  title: string;
  url: string;
  actress: string[];
  director: string | null;
  label: string;
  publishedAt: Date | null;
  id: string;
}

export interface FanzaDoujinScrapedData {
  title: string;
  url: string;
  circleName: string;
  authors: string[];
  publishedAt: Date | null;
}

export interface FanzaBooksScrapedData {
  title: string;
  url: string;
  authors: string[];
  label: string;
  publisher: string;
  publishedAt: Date | null;
}

export interface FanzaAnimeScrapedData {
  title: string;
  actress: string[];
  director: string | null;
  label: string;
  publishedAt: Date | null;
  id: string;
  manufacturerProductNumber: string;
  url: string;
}

export interface AmazonScrapedData {
  title: string;
  authors: string[];
  publisher: string | null;
  publishedAt: Date | null;
  url: string;
}

export interface BookWalkerScrapedData {
  title: string;
  authors: string[];
  publisher: string | null;
  label: string | null;
  publishedAt: Date | null;
  url: string;
}

export interface DLsiteScrapedData {
  title: string;
  authors: string[];
  voiceActors: string[];
  illustrators: string[];
  writers: string[];
  circleName: string | null;
  eventName: string | null;
  publishedAt: Date | null;
  url: string;
  productType: string;
}

export interface DLsiteBooksScrapedData {
  title: string;
  authors: string[];
  label: string | null;
  publisher: string;
  publishedAt: Date | null;
  url: string;
}

export interface MelonbooksScrapedData {
  title: string;
  authors: string[];
  circleName: string;
  genre: string[];
  eventName: string | null;
  publishedAt: Date | null;
  url: string;
}

export interface DLsiteManiaxScrapedData {
  title: string;
  type: string;
  authors: string[];
  voiceActors: string[];
  illustrators: string[];
  writers: string[];
  circleName: string;
  eventName: string | null;
  publishedAt: Date | null;
  url: string;
}

export interface Fc2ContentMarketScrapedData {
  title: string;
  director: string;
  publishedAt: Date | null;
  id: string;
  url: string;
}

export interface SurugayaScrapedData {
  title: string;
  authors: string[];
  publisher: string | null;
  publishedAt: Date | null;
  url: string;
}

export interface ToranoanaScrapedData {
  title: string;
  authors: string[];
  circleName: string;
  genre: string[];
  mainCharacters: string[];
  eventName: string | null;
  publishedAt: Date | null;
  url: string;
}
