/**
 * Test-only wrapper around `groq-js` — GROQ's reference implementation
 * (Decision D, Decision H, R3). It exists so a test can evaluate the
 * **actual exported GROQ fragment or query** a module ships, rather than a
 * hand-written JavaScript mirror of what that fragment "should" do. A mirror
 * can agree with the test's own expectations while the real fragment is
 * broken — that mismatch is false-green audit row 16, and this helper is the
 * documented fix.
 *
 * **Imported only by `*.test.ts` files.** `groq-js` is a `devDependency`,
 * never a runtime one (Decision D): the deployed read path is the hand-rolled
 * `http.ts`, which talks to Sanity's actual Content Lake Query API, not this
 * in-memory evaluator. `layering.test.ts` asserts "no non-test file imports
 * `groq-js`" with this file as the one documented exception — it is the sole
 * place `groq-js` is imported outside a test, precisely because its only
 * consumers are tests.
 */
import { evaluate, parse } from "groq-js";

/**
 * The evaluation context accepted by `groq-js`'s own `evaluate()`, re-derived
 * from its signature rather than hand-declared, so this helper can never
 * drift from whatever shape the pinned `groq-js@2.0.0` actually expects.
 */
export type GroqEvalContext = Parameters<typeof evaluate>[1];

/**
 * Parses `fragment` and evaluates it through `groq-js`'s real parser and
 * evaluator, then unwraps the result to a plain JS value.
 *
 * `context` is passed straight through to `groq-js`'s `evaluate()` — most
 * callers only need `root` (what bare field paths resolve against, i.e. `@`)
 * and, when the fragment dereferences (`->`), `dataset` and `dereference`.
 * `dataset` defaults to `[]`: `groq-js`'s async evaluator only ever consults
 * a custom `dereference` function when `scope.source` is an array, so even a
 * fragment with no references needs a (possibly empty) array here rather
 * than `undefined`.
 */
export async function evaluateGroq(
  fragment: string,
  context: GroqEvalContext = { dataset: [] },
): Promise<unknown> {
  const tree = parse(fragment);
  const value = await evaluate(tree, context);
  return value.get();
}
