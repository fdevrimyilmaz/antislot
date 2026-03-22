import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { getClientIdentity } from "@/services/clientIdentity";
import { UserProvider, useUser } from "../UserContext";

jest.mock("@/services/clientIdentity", () => ({
  getClientIdentity: jest.fn(),
}));

const mockGetClientIdentity = getClientIdentity as jest.MockedFunction<typeof getClientIdentity>;
const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;

function UserProbe() {
  const { uid, loading } = useUser();
  return (
    <>
      <Text testID="uid">{uid ?? "null"}</Text>
      <Text testID="loading">{loading ? "true" : "false"}</Text>
    </>
  );
}

describe("UserProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses stored uid without resolving identity again", async () => {
    mockGetItem.mockResolvedValueOnce("stored-uid");

    const { getByTestId } = render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });

    expect(getByTestId("uid").props.children).toBe("stored-uid");
    expect(mockGetClientIdentity).not.toHaveBeenCalled();
  });

  it("resolves and persists identity when storage is empty", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    mockGetClientIdentity.mockResolvedValueOnce("client-uid-1");

    const { getByTestId } = render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });

    expect(mockGetClientIdentity).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith("APP_USER_UID", "client-uid-1");
    expect(getByTestId("uid").props.children).toBe("client-uid-1");
  });
});
