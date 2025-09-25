import { jest } from "@jest/globals";

const mockStorage = {
  sync: {
    get: jest
      .fn<() => Promise<{ [s: string]: any }>>()
      .mockResolvedValue({ scrapboxFormats: {} }),
    set: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
  local: {
    get: jest.fn<() => Promise<{ [s: string]: any }>>().mockResolvedValue({}),
    set: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }
};

const browser = {
  storage: mockStorage,
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
    connect: jest.fn(() => ({
      postMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
      },
      disconnect: jest.fn(),
    })),
  }
};

// グローバルbrowserとして利用可能にする
(global as any).browser = browser;

export default browser;