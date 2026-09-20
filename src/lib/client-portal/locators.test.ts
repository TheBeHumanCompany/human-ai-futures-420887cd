import { describe, expect, test } from "bun:test";

import { stripLocators } from "./locators";

/**
 * The client-facing locator strip (US-007), pinned against real generator
 * output. Two invariants:
 *
 * 1. A parenthetical made up entirely of locator tokens — transcript
 *    filenames, time codes, `E###` evidence ids, and their dash ranges —
 *    disappears together with the space before it.
 * 2. Any parenthetical carrying other prose survives untouched: those are
 *    real citations a client should read. Over-stripping them is the
 *    failure mode this guards.
 */
describe("stripLocators removes locator-only parentheticals", () => {
  test.each([
    [
      `grew "floodgates" (transcript:bb.txt, ~05:23; E025–E026), then moved`,
      `grew "floodgates", then moved`,
    ],
    ["payback (~42:10–43:13; E145–E147).", "payback."],
    ["rotation policy (E229) while working", "rotation policy while working"],
    ["aisle (~01:06:14–01:07:47; E223, E226) and", "aisle and"],
  ])("%s → %s", (input, expected) => {
    expect(stripLocators(input)).toBe(expected);
  });
});

describe("stripLocators leaves real citations alone", () => {
  test.each([
    ["wholesale page (birchbarkcoffeecompany.com/pages/wholesale, fetched this task) targets"],
    ["Council for Indigenous Business (ccib.ca)."],
    ["Costco's Fall 2024 launch (CoffeeTalk, Sept. 17, 2024, prior research) are"],
  ])("%s is unchanged", (input) => {
    expect(stripLocators(input)).toBe(input);
  });
});

describe("stripLocators edge shapes", () => {
  test("a bare time code without the tilde is still a locator", () => {
    expect(stripLocators("the quote (12:34) lands")).toBe("the quote lands");
  });

  test("hour-precision time codes strip", () => {
    expect(stripLocators("said it (1:06:14) outright")).toBe("said it outright");
  });

  test("a dash-led bare range at line end strips — generator bullet shape", () => {
    expect(stripLocators("growth into wholesale — ~05:23–09:53")).toBe("growth into wholesale");
    expect(stripLocators("his own company's practices — ~38:24, 55:45–01:03:29")).toBe(
      "his own company's practices",
    );
  });

  test("ordinary dash-led prose is not stripped", () => {
    expect(stripLocators("the offsite — 45 minutes of questions")).toBe(
      "the offsite — 45 minutes of questions",
    );
  });

  test("an em-dash range strips like an en-dash", () => {
    expect(stripLocators("the margin (E100—E105) held")).toBe("the margin held");
  });

  test("a locator nested inside a prose parenthetical strips, the prose stays", () => {
    // No nesting-aware matching: the inner locator-only parenthetical goes,
    // the surrounding prose parenthetical is kept as authored.
    expect(stripLocators("grew (like a weed (transcript:a.txt, ~01:02)) fast")).toBe(
      "grew (like a weed) fast",
    );
  });

  test("text without parentheses is returned untouched", () => {
    expect(stripLocators("no citations here")).toBe("no citations here");
  });
});
