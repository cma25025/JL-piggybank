// Mock expo-sqlite for all tests running in Node environment
jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({
    runSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(),
    execSync: jest.fn(),
  })),
}));
