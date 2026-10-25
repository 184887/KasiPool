import { describe, expect, it } from "vitest";

import { isValidPin, loginToPhone, phoneToLogin } from "@/lib/phone-auth";

describe("phoneToLogin", () => {
  it("maps local and international formats to the same login", () => {
    const login = "27721234567@phone.kasipool.co.za";
    expect(phoneToLogin("072 123 4567")).toBe(login);
    expect(phoneToLogin("0721234567")).toBe(login);
    expect(phoneToLogin("+27 72 123 4567")).toBe(login);
    expect(phoneToLogin("27721234567")).toBe(login);
  });

  it("rejects numbers that aren't SA mobiles", () => {
    expect(phoneToLogin("021 123 4567")).toBeNull();
    expect(phoneToLogin("12345")).toBeNull();
    expect(phoneToLogin("")).toBeNull();
  });
});

describe("loginToPhone", () => {
  it("round-trips a phone login", () => {
    expect(loginToPhone(phoneToLogin("072 123 4567"))).toBe("+27721234567");
  });

  it("ignores other addresses", () => {
    expect(loginToPhone("someone@gmail.com")).toBeNull();
    expect(loginToPhone("27721234567@evil.example")).toBeNull();
    expect(loginToPhone(null)).toBeNull();
  });
});

describe("isValidPin", () => {
  it("accepts exactly six digits", () => {
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a456")).toBe(false);
  });
});
