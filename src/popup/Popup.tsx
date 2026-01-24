import React, { useCallback, useEffect, useState } from "react";
import "./Popup.scss";
import "../css/tailwind.scss";
import { StorageKeyProjectName, StorageKeyScrapboxFormats } from "../chromeApi";
import browser from "webextension-polyfill";
import { ProductType } from "../Product";
import { normalizeProjectName } from "./normalizeProjectName";

const defaultScrapboxFormats: Record<ProductType, string> = {
  book: `[{service}で読む {url}]
[[著者]]：{authors}
[[概要]]：
[[レーベル]]：{label}
[[出版社]]: {publisher}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`,
  doujinshi: `[{service}で読む {url}]
[[著者]]：{authors}
[[概要]]：
[[サークル名]]：{circleName}
[[イベント]]: {eventName}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`,
  film: `[{service}で視聴 {url}]
[[出演者]]：{authors}
[[概要]]：
[[監督]]：{director}
[[レーベル]]：{label}
[[ID]]：{id}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`,
  asmr: `[{service}で読む {url}]
[[著者]]：{authors}
[[概要]]：
[[サークル名]]：{circleName}
[[声優]]：{voiceActors}
[[シナリオライター]]：{writers}
[[イラストレーター]]：{illustrators}
[[イベント]]: {eventName}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`,
};

const availableVariables: Record<ProductType, string[]> = {
  book: [
    "title",
    "authors",
    "service",
    "url",
    "publishedYear",
    "publishedMonth",
    "publishedDate",
    "publisher",
    "label",
  ],
  doujinshi: [
    "title",
    "authors",
    "service",
    "url",
    "publishedYear",
    "publishedMonth",
    "publishedDate",
    "circleName",
    "eventName",
  ],
  film: [
    "title",
    "authors",
    "service",
    "url",
    "publishedYear",
    "publishedMonth",
    "publishedDate",
    "director",
    "label",
    "id",
  ],
  asmr: [
    "title",
    "authors",
    "service",
    "url",
    "publishedYear",
    "publishedMonth",
    "publishedDate",
    "circleName",
    "eventName",
    "illustrators",
    "voiceActors",
    "writers",
  ],
};

export default function Popup() {
  const [projectName, setProjectName] = useState("");
  const [formats, setFormats] = useState<Record<ProductType, string>>(
    defaultScrapboxFormats,
  );
  const [activeTab, setActiveTab] = useState<ProductType>("book");

  useEffect(() => {
    (async () => {
      const result = await browser.storage.sync.get([
        StorageKeyProjectName,
        StorageKeyScrapboxFormats,
      ]);
      setProjectName(result.projectName as string);
      if (result.scrapboxFormats) {
        setFormats(result.scrapboxFormats as Record<ProductType, string>);
      }
    })();
  }, [setProjectName, setFormats]);

  const onProjectNameChangeHandler = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setProjectName(e.currentTarget.value);
    },
    [setProjectName],
  );

  const onProjectNameBlurHandler = useCallback(
    async (e: React.FormEvent<HTMLInputElement>) => {
      const newProjectName = normalizeProjectName(e.currentTarget.value);
      setProjectName(newProjectName);
      await browser.storage.sync.set({
        [StorageKeyProjectName]: newProjectName,
      });
    },
    [setProjectName],
  );

  const onFormatChangeHandler = useCallback(
    async (e: React.FormEvent<HTMLTextAreaElement>) => {
      const newFormat = e.currentTarget.value;
      const newFormats = { ...formats, [activeTab]: newFormat };
      setFormats(newFormats);
      await browser.storage.sync.set({
        [StorageKeyScrapboxFormats]: newFormats,
      });
    },
    [formats, activeTab, setFormats],
  );

  const onResetFormatHandler = useCallback(async () => {
    const newFormats = {
      ...formats,
      [activeTab]: defaultScrapboxFormats[activeTab],
    };
    setFormats(newFormats);
    await browser.storage.sync.set({ [StorageKeyScrapboxFormats]: newFormats });
  }, [formats, activeTab, setFormats]);

  return (
    <div className="popupContainer">
      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          scrapbox.io/
        </label>
        <input
          id="name"
          value={projectName}
          type="text"
          onChange={onProjectNameChangeHandler}
          onBlur={onProjectNameBlurHandler}
          placeholder="XXXX"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            onChange={(e) => setActiveTab(e.target.value as ProductType)}
            value={activeTab}
          >
            <option value="book">書籍</option>
            <option value="doujinshi">同人誌</option>
            <option value="film">動画</option>
            <option value="asmr">音声作品</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("book")}
                className={`${activeTab === "book" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                書籍
              </button>
              <button
                onClick={() => setActiveTab("doujinshi")}
                className={`${activeTab === "doujinshi" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                同人誌
              </button>
              <button
                onClick={() => setActiveTab("film")}
                className={`${activeTab === "film" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                動画
              </button>
              <button
                onClick={() => setActiveTab("asmr")}
                className={`${activeTab === "asmr" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                音声作品
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center">
          <label
            htmlFor="scrapbox-format"
            className="block text-sm font-medium text-gray-700"
          >
            Format
          </label>
          <button
            onClick={onResetFormatHandler}
            className="px-2 py-1 border border-gray-300 rounded-md shadow-xs text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            デフォルトに戻す
          </button>
        </div>
        <textarea
          id="scrapbox-format"
          value={formats[activeTab]}
          onChange={onFormatChangeHandler}
          rows={10}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
        />
      </div>

      <div>
        <p className="text-sm text-gray-500">Available variables:</p>
        <ul className="list-disc list-inside text-sm text-gray-500 grid grid-cols-2">
          {availableVariables[activeTab].map((variable) => (
            <li key={variable}>
              <code>{`{${variable}}`}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
