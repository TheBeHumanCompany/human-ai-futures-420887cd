import type {
  Block,
  FindingBlock,
  OpportunityBlock,
  PlaybookRefBlock,
  ProseBlock,
  QuestionBlock,
  SourceBlock,
  UnknownItemBlock,
} from "@/lib/client-portal/blueprint-schema";

/**
 * Blocks as React elements, never as injected HTML.
 *
 * Every string here renders as a React child, which escapes it. That is the
 * whole point: the previous renderer passed an authored 3 MB body to
 * `dangerouslySetInnerHTML` with no sanitizer and no CSP, so a script in a
 * staged paid row would have run inside a Clerk session. Structured blocks
 * remove that class of defect rather than mitigating it.
 *
 * Styling reuses the site's own utilities from `src/styles.css`
 * (`eyebrow`, `type-h4-caps`, the ink/cream ladder), so a report looks like the
 * site instead of shipping 92 inlined font subsets to redeclare it.
 *
 * BAND-AGNOSTIC FOREGROUND. Body text and hairlines are `currentColor` with an
 * opacity modifier, never `text-ink/*` or `border-hairline-dark/*`. The section
 * wrapper alternates `.section-cream` and `.section-ink` by position
 * (`blueprint-sections.tsx`), and `--ink` is near-black: a hardcoded ink
 * foreground renders black-on-black on every odd-indexed band and on every
 * `question` band. That is not a contrast nit — the text is simply gone, and it
 * was: the funnel fixture's second preliminary section ("Fixture Method Notes")
 * seeded a prose block and screenshotted as a bare title, so a demo of an
 * 11-section blueprint would have shown half its content missing while every
 * test stayed green, because the DOM was correct and only the paint was wrong.
 * Inheriting the band's own foreground cannot drift when a band moves.
 *
 * `LegacyHtmlBody` is the single exception and is quarantined in its own module
 * so it stays greppable.
 */

const Finding = ({ block }: { block: FindingBlock }) => (
  <li className="border-t border-current/20 py-4">
    <p className="text-[1.0625rem] leading-[1.55] text-current/85">{block.claim}</p>
    <p className="eyebrow mt-2 text-current/50">
      {/* A hypothesis must never read as a fact — the kind is shown, always. */}
      {block.kind}
      {block.verification ? ` · ${block.verification}` : ""}
    </p>
    {block.supportingExcerpts?.length ? (
      <ul className="mt-2 space-y-1">
        {block.supportingExcerpts.map((excerpt, i) => (
          <li key={i} className="border-l border-current/20 pl-3 text-sm text-current/60">
            {excerpt}
          </li>
        ))}
      </ul>
    ) : null}
  </li>
);

const Opportunity = ({ block }: { block: OpportunityBlock }) => (
  <article className="border-t border-current/20 py-5">
    <p className="eyebrow text-current/50">{block.label}</p>
    <h4 className="type-h4-caps mt-1">{block.title}</h4>
    <dl className="mt-3 space-y-2">
      {block.bullets.map((bullet, i) => (
        <div key={i}>
          <dt className="eyebrow text-current/50">{bullet.label}</dt>
          <dd className="text-[1.0625rem] leading-[1.55] text-current/80">{bullet.text}</dd>
        </div>
      ))}
    </dl>
  </article>
);

const Prose = ({ block }: { block: ProseBlock }) => (
  <>
    {block.paragraphs.map((paragraph, i) => (
      <p key={i} className="text-[1.0625rem] leading-[1.55] text-current/80">
        {paragraph}
      </p>
    ))}
  </>
);

/**
 * The strategic question sizes itself against its own length, the rule the
 * hand-authored page uses (`gtm_blueprint.py:481-486`). A fixed step is the
 * defect it removes: the same size that makes a twelve-word question the
 * page's full-bleed moment turns a fifty-word one into a wall that overruns
 * the band. Three steps, and the measure widens with each, so the block keeps
 * roughly the same shape whatever the generator writes.
 */
const questionSize = (question: string) =>
  question.length < 140
    ? "type-h2-caps-light max-w-[34ch]"
    : question.length < 260
      ? "type-h3-caps-light max-w-[40ch]"
      : "type-h4-caps-light max-w-[46ch]";

const Question = ({ block }: { block: QuestionBlock }) => (
  <blockquote className={`${questionSize(block.question)} text-balance`}>
    {block.question}
  </blockquote>
);

const UnknownItem = ({ block }: { block: UnknownItemBlock }) => (
  <li className="border-t border-current/20 py-3 text-[1.0625rem] leading-[1.55] text-current/80">
    {block.text}
  </li>
);

const Source = ({ block }: { block: SourceBlock }) => (
  <li className="border-t border-current/20 py-2 text-sm text-current/70">
    {/* rel=noreferrer matters here beyond hygiene: on /c/<token> the URL is the
        credential, and the route already sends Referrer-Policy: no-referrer. */}
    {block.url ? (
      <a className="link-underline" href={block.url} target="_blank" rel="noopener noreferrer">
        {block.label}
      </a>
    ) : (
      block.label
    )}
  </li>
);

const PlaybookRef = ({ block }: { block: PlaybookRefBlock }) => (
  <div className="border-t border-current/20 py-3">
    <p className="eyebrow text-current/50">Playbook</p>
    <p className="text-[1.0625rem] leading-[1.55] text-current/80">
      {block.note ?? block.playbookId}
    </p>
  </div>
);

/**
 * A block type this build does not know renders as nothing rather than as a
 * crash or a `[object Object]`. Adding a type is a branch here, never a
 * migration — which is why the parser keeps unrecognised blocks.
 */
export function BlueprintBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "finding":
      return <Finding block={block as FindingBlock} />;
    case "opportunity":
      return <Opportunity block={block as OpportunityBlock} />;
    case "prose":
      return <Prose block={block as ProseBlock} />;
    case "question":
      return <Question block={block as QuestionBlock} />;
    case "unknown":
      return <UnknownItem block={block as UnknownItemBlock} />;
    case "source":
      return <Source block={block as SourceBlock} />;
    case "playbookRef":
      return <PlaybookRef block={block as PlaybookRefBlock} />;
    default:
      return null;
  }
}

/** Bands whose children are list items, so the wrapper element matches. */
export const LIST_BANDS = new Set(["findings", "unknowns", "sources"]);

/**
 * Every block type this build actually draws — the switch above, plus `title`,
 * which `hero.tsx` draws instead.
 *
 * The portal renders an unknown block as nothing, which is the right answer
 * for a live page that must not break on a row from a newer generator. It is
 * the wrong answer for an operator artifact: a blueprint exported with a
 * silently dropped block is a file that gets emailed to a client with a
 * section missing. `scripts/export-blueprint.ts` refuses on anything absent
 * from this set, and the set lives here so it cannot drift from the switch.
 */
export const RENDERED_BLOCK_TYPES: ReadonlySet<string> = new Set([
  "title",
  "finding",
  "opportunity",
  "prose",
  "question",
  "unknown",
  "source",
  "playbookRef",
]);
