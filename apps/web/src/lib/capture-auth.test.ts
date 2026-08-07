import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { assertCaptureApiAuthorized, CAPTURE_TOKEN_HEADER } from "./capture-auth";

describe("assertCaptureApiAuthorized", () => {
  it("allows all requests when token env is unset", () => {
    delete process.env.TELL_CAPTURE_API_TOKEN;
    const req = new NextRequest("http://localhost:3000/api/diagnose", { method: "POST" });
    expect(assertCaptureApiAuthorized(req)).toBeNull();
  });

  it("rejects missing token when env is set", () => {
    process.env.TELL_CAPTURE_API_TOKEN = "secret-token";
    const req = new NextRequest("http://localhost:3000/api/diagnose", { method: "POST" });
    const res = assertCaptureApiAuthorized(req);
    expect(res?.status).toBe(401);
    delete process.env.TELL_CAPTURE_API_TOKEN;
  });

  it("accepts matching bearer and header tokens", () => {
    process.env.TELL_CAPTURE_API_TOKEN = "secret-token";
    const bearer = new NextRequest("http://localhost:3000/api/diagnose", {
      method: "POST",
      headers: { authorization: "Bearer secret-token" },
    });
    expect(assertCaptureApiAuthorized(bearer)).toBeNull();

    const header = new NextRequest("http://localhost:3000/api/diagnose", {
      method: "POST",
      headers: { [CAPTURE_TOKEN_HEADER]: "secret-token" },
    });
    expect(assertCaptureApiAuthorized(header)).toBeNull();
    delete process.env.TELL_CAPTURE_API_TOKEN;
  });
});
