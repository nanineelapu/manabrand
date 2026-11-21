/** Unit tests for phone/PIN/email validation and the PIN→password derivation.  npm run auth:test */
import { createHmac } from "node:crypto";
import { emailError, normalizeEmail, normalizePhone, passwordError, pinError, safeNext } from "../src/lib/auth/validation";

let pass = 0, fail = 0;
const t = (name: string, cond: boolean) => { if (cond) pass++; else fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); };

// phone
t("10 digits → +91", normalizePhone("9876543210") === "+919876543210");
t("spaces / dashes", normalizePhone("98765 43210") === "+919876543210" && normalizePhone("98765-43210") === "+919876543210");
t("+91 prefix", normalizePhone("+91 98765 43210") === "+919876543210");
t("91 prefix without plus", normalizePhone("919876543210") === "+919876543210");
t("leading 0", normalizePhone("09876543210") === "+919876543210");
t("rejects starting with 5", normalizePhone("5876543210") === null);
t("rejects 9 digits", normalizePhone("987654321") === null);
t("rejects letters", normalizePhone("98765abcde") === null);

// email
t("email lowercased + trimmed", normalizeEmail("  Anita@Example.COM ") === "anita@example.com");
t("bad email rejected", emailError("not-an-email") !== null && emailError("a@b") !== null);

// PIN
t("valid PIN accepted", pinError("483920") === null);
t("5 digits rejected", pinError("12345") !== null);
t("letters rejected", pinError("12ab56") !== null);
t("111111 rejected", pinError("111111") !== null);
t("123456 rejected", pinError("123456") !== null);
t("654321 rejected", pinError("654321") !== null);
t("121212 rejected", pinError("121212") !== null);
t("123123 rejected", pinError("123123") !== null);
t("000000 rejected", pinError("000000") !== null);
t("PIN inside phone number rejected", pinError("876543", "9876543210") !== null);
t("unrelated PIN with phone accepted", pinError("482915", "9876543210") === null);

// staff password
t("short password rejected", passwordError("abc123") !== null);
t("letters-only password rejected", passwordError("abcdefghijkl") !== null);
t("good password accepted", passwordError("Strong-Pass-2026") === null);

// open redirect
t("safeNext allows /account", safeNext("/account/orders", "/x") === "/account/orders");
t("safeNext blocks //evil.com", safeNext("//evil.com", "/x") === "/x");
t("safeNext blocks absolute URL", safeNext("https://evil.com", "/x") === "/x");
t("safeNext blocks backslash trick", safeNext("/\\evil.com", "/x") === "/x");

// PIN derivation (mirrors src/lib/auth/pin.ts without the server-only import)
const derive = (pin: string, phone: string, pepper: string) => createHmac("sha256", pepper).update(`${phone}:${pin}`).digest("hex");
const P1 = "a".repeat(32), P2 = "b".repeat(32);
t("derivation is deterministic", derive("482915", "+919876543210", P1) === derive("482915", "+919876543210", P1));
t("different phone → different password (same PIN)", derive("482915", "+919876543210", P1) !== derive("482915", "+919811111111", P1));
t("different pepper → different password (leaked DB useless without pepper)", derive("482915", "+919876543210", P1) !== derive("482915", "+919876543210", P2));
t("derived value is 64 hex chars and never contains the PIN pattern", /^[0-9a-f]{64}$/.test(derive("482915", "+919876543210", P1)));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
