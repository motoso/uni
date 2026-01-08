/**
 * Types for scraped data from various FANZA services
 */

export interface FanzaVideoScrapedData {
  title: string;
  url: string;
  actress: string[];
  director: string | null;
  label: string;
  publishedAt: Date;
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
  publishedAt: Date;
}