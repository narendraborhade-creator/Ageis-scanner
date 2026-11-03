import { describe, it, expect } from "vitest";
import { isAllowedUrl } from "../services/urlSecurityService";

describe("urlSecurityService", () => {
  it("allows valid external URLs", () => {
    expect(isAllowedUrl("https://example.com")).toBe(true);
    expect(isAllowedUrl("http://google.com")).toBe(true);
  });

  it("blocks internal IPs", () => {
    expect(isAllowedUrl("http://127.0.0.1")).toBe(false);
    expect(isAllowedUrl("http://10.0.0.1")).toBe(false);
    expect(isAllowedUrl("http://192.168.1.1")).toBe(false);
    expect(isAllowedUrl("http://172.16.0.1")).toBe(false);
    expect(isAllowedUrl("http://[::1]")).toBe(false);
    expect(isAllowedUrl("http://[::ffff:127.0.0.1]")).toBe(false);
  });

  it("blocks localhost and local domains", () => {
    expect(isAllowedUrl("http://localhost")).toBe(false);
    expect(isAllowedUrl("http://my-service.local")).toBe(false);
  });

  it("blocks non-HTTP/HTTPS protocols", () => {
    expect(isAllowedUrl("ftp://example.com")).toBe(false);
    expect(isAllowedUrl("javascript://example.com/%0aalert(1)")).toBe(false);
    expect(isAllowedUrl("file:///etc/passwd")).toBe(false);
  });

  it("blocks malformed URLs", () => {
    expect(isAllowedUrl("not-a-url")).toBe(false);
  });
});
