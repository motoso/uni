global.browser = {
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({ scrapboxFormats: {} }),
      // 他にもstorage.syncで使われているAPIがあればここに追加
    },
    local: {
      // localストレージで使われているAPIがあればここに追加
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
    }
  },
  // 他のbrowser API（例: runtime, tabsなど）も必要に応じてモックを追加
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
