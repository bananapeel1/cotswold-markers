import { vi } from "vitest";

// ---- Mock firebase-admin/app ----
vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(() => ({ name: "mock-app" })),
  getApps: vi.fn(() => [{ name: "mock-app" }]),
  cert: vi.fn(() => ({})),
}));

// ---- Mock firebase-admin/firestore ----
const mockDoc = {
  exists: false,
  data: vi.fn(() => ({})),
  id: "mock-id",
};

const mockDocRef = {
  get: vi.fn(async () => mockDoc),
  set: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  delete: vi.fn(async () => {}),
};

const mockCollection = {
  doc: vi.fn(() => mockDocRef),
  get: vi.fn(async () => ({
    size: 0,
    docs: [],
    forEach: vi.fn(),
  })),
  where: vi.fn(() => ({
    get: vi.fn(async () => ({ size: 0 })),
  })),
};

const mockDb = {
  collection: vi.fn(() => mockCollection),
};

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => mockDb),
  FieldValue: {
    increment: vi.fn((n: number) => ({ _increment: n }),),
  },
}));

// ---- Mock firebase-admin/auth ----
const mockAuth = {
  verifySessionCookie: vi.fn(async () => {
    throw new Error("Invalid session cookie");
  }),
  verifyIdToken: vi.fn(async () => ({
    uid: "test-user-id",
    email: "test@example.com",
    name: "Test User",
  })),
};

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => mockAuth),
}));

// Export mocks so tests can override behavior
export {
  mockDb,
  mockCollection,
  mockDocRef,
  mockDoc,
  mockAuth,
};
