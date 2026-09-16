/**
 * The upload gate as a test: rendering every manifest template must produce
 * HTML/text whose `{{{KEY}}}` placeholders are exactly the declared Resend
 * variables. The real failure mode this defends: a prop added to a template
 * without a matching variable ships to clients as literal braces.
 */
import { describe, expect, test } from "bun:test";

import { TEMPLATES, type AnyTemplateSpec } from "../emails/_resend/manifest";
import { checkVariables, collectPlaceholders, renderTemplate } from "./upload-email-templates";

describe("resend template manifests", () => {
  for (const spec of TEMPLATES) {
    test(`${spec.alias}: placeholders match declared variables`, async () => {
      const { html, text } = await renderTemplate(spec);
      checkVariables(spec, html, text);

      const used = collectPlaceholders(`${html}\n${text}\n${spec.subject}`);
      const declared = new Set(spec.variables.map((variable) => variable.key));
      expect([...used].sort()).toEqual([...declared].sort());
    });
  }

  test("an undeclared placeholder fails the gate naming the key", async () => {
    const spec: AnyTemplateSpec = TEMPLATES[0];
    const { html, text } = await renderTemplate(spec);
    expect(() => checkVariables(spec, `${html}{{{ROGUE_KEY}}}`, text)).toThrow(/ROGUE_KEY/);
  });
});
