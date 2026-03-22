import {
  AccountabilityAlertUpstreamError,
  AccountabilityAlertValidationError,
  sendAccountabilityAlertWithGateway,
  type AccountabilitySmsGatewayConfig,
} from "../accountability-alert";

const BASE_GATEWAY: AccountabilitySmsGatewayConfig = {
  enabled: true,
  timeoutMs: 2000,
  twilioAccountSid: "AC_TEST_SID",
  twilioAuthToken: "test-token",
  twilioMessagingServiceSid: "MG_TEST_SERVICE",
  twilioFromNumber: "",
};

describe("sendAccountabilityAlertWithGateway", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns fallback when gateway is disabled", async () => {
    const result = await sendAccountabilityAlertWithGateway(
      {
        phone: "+1 (415) 555-0100",
        message: "Need support now.",
      },
      {
        ...BASE_GATEWAY,
        enabled: false,
      }
    );

    expect(result).toEqual({
      delivery: "fallback_required",
      provider: "disabled",
      fallbackRequired: true,
      reason: "disabled",
    });
  });

  it("throws validation error for invalid phone", async () => {
    await expect(
      sendAccountabilityAlertWithGateway(
        {
          phone: "12",
          message: "Need support now.",
        },
        BASE_GATEWAY
      )
    ).rejects.toBeInstanceOf(AccountabilityAlertValidationError);
  });

  it("rejects message containing url-like content", async () => {
    await expect(
      sendAccountabilityAlertWithGateway(
        {
          phone: "+14155550100",
          message: "Click now https://bad.example for tips",
        },
        BASE_GATEWAY
      )
    ).rejects.toBeInstanceOf(AccountabilityAlertValidationError);
  });

  it("sends through twilio and returns sid", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          sid: "SM123",
          status: "queued",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    const result = await sendAccountabilityAlertWithGateway(
      {
        phone: "+1 (415) 555-0100",
        message: "Need support now.",
      },
      BASE_GATEWAY
    );

    expect(result).toEqual({
      delivery: "sent",
      provider: "twilio",
      fallbackRequired: false,
      messageId: "SM123",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("/Accounts/AC_TEST_SID/Messages.json");
  });

  it("throws upstream error when twilio rejects", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 21614,
          message: "The 'To' number is not a valid mobile number.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await expect(
      sendAccountabilityAlertWithGateway(
        {
          phone: "+14155550100",
          message: "Need support now.",
        },
        BASE_GATEWAY
      )
    ).rejects.toBeInstanceOf(AccountabilityAlertUpstreamError);
  });
});
