import AsyncStorage from "@react-native-async-storage/async-storage";

import { getJSON, setJSON } from "@/lib/storage";
import { anonymousLogin } from "../auth";
import { getClientIdentity } from "../clientIdentity";

jest.mock("../auth", () => ({
  anonymousLogin: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  STORAGE_KEYS: {
    CLIENT_ID: "antislot_client_id",
  },
  getJSON: jest.fn(),
  setJSON: jest.fn(),
}));

const mockAnonymousLogin = anonymousLogin as jest.MockedFunction<typeof anonymousLogin>;
const mockGetJSON = getJSON as jest.MockedFunction<typeof getJSON>;
const mockSetJSON = setJSON as jest.MockedFunction<typeof setJSON>;
const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;

describe("getClientIdentity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
  });

  it("returns firebase uid when anonymous auth succeeds", async () => {
    mockAnonymousLogin.mockResolvedValueOnce("firebase-uid-1");

    const result = await getClientIdentity();

    expect(result).toBe("firebase-uid-1");
    expect(mockGetJSON).not.toHaveBeenCalled();
    expect(mockSetJSON).not.toHaveBeenCalled();
  });

  it("returns persisted client id when firebase auth is unavailable", async () => {
    mockAnonymousLogin.mockRejectedValueOnce(new Error("firebase-disabled"));
    mockGetJSON.mockResolvedValueOnce("persisted-client-id");

    const result = await getClientIdentity();

    expect(result).toBe("persisted-client-id");
    expect(mockSetJSON).not.toHaveBeenCalled();
  });

  it("migrates legacy APP_USER_UID when no secure client id exists", async () => {
    mockAnonymousLogin.mockRejectedValueOnce(new Error("firebase-disabled"));
    mockGetJSON.mockResolvedValueOnce(null);
    mockGetItem.mockResolvedValueOnce("legacy-user-42");

    const result = await getClientIdentity();

    expect(result).toBe("legacy-user-42");
    expect(mockSetJSON).toHaveBeenCalledWith("antislot_client_id", "legacy-user-42");
  });

  it("creates and stores a new local client id when nothing exists", async () => {
    mockAnonymousLogin.mockRejectedValueOnce(new Error("firebase-disabled"));
    mockGetJSON.mockResolvedValueOnce(null);
    mockGetItem.mockResolvedValueOnce(null);

    const result = await getClientIdentity();

    expect(result).toMatch(/^[a-z0-9]+-[a-z0-9]{10}$/);
    expect(mockSetJSON).toHaveBeenCalledWith("antislot_client_id", result);
  });
});
