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
 * `LegacyHtmlBody` is the single exception and is quarantined in its own module
 * so it stays greppable.
 */

const Finding = ({ block }: { block: FindingBlock }) => (
  <li className="border-t border-hairline-dark/40 py-4">
    <p className="text-[1.0625rem] leading-[1.55] text-ink/85">{block.claim}</p>
    <p className="eyebrow mt-2 text-ink/50">
      {/* A hypothesis must never read as a fact — the kind is shown, always. */}
      {block.kind}
      {block.verification ? ` · ${block.verification}` : ""}
    </p>
    {block.supportingExcerpts?.length ? (
      <ul className="mt-2 space-y-1">
        {block.supportingExcerpts.map((excerpt, i) => (
          <li key={i} className="border-l border-hairline-dark/40 pl-3 text-sm text-ink/60">
            {excerpt}
          </li>
        ))}
      </ul>
    ) : null}
  </li>
);

const Opportunity = ({ block }: { block: OpportunityBlock }) => (
  <article className="border-t border-hairline-dark/40 py-5">
    <p className="eyebrow text-ink/50">{block.label}</p>
    <h4 className="type-h4-caps mt-1">{block.title}</h4>
    <dl className="mt-3 space-y-2">
      {block.bullets.map((bullet, i) => (
        <div key={i}>
          <dt className="eyebrow text-ink/50">{bullet.label}</dt>
          <dd className="text-[1.0625rem] leading-[1.55] text-ink/80">{bullet.text}</dd>
        </div>
      ))}
    </dl>
  </article>
);

const Prose = ({ block }: { block: ProseBlock }) => (
  <>
    {block.paragraphs.map((paragraph, i) => (
      <p key={i} className="text-[1.0625rem] leading-[1.55] text-ink/80">
        {paragraph}
      </p>
    ))}
  </>
);

const Question = ({ block }: { block: QuestionBlock }) => (
  <blockquote className="type-h3-caps-light max-w-[24ch] text-balance">
    {block.question}
  </blockquote>
);

const UnknownItem = ({ block }: { block: UnknownItemBlock }) => (
  <li className="border-t border-hairline-dark/40 py-3 text-[1.0625rem] leading-[1.55] text-ink/80">
    {block.text}
  </li>
);

const Source = ({ block }: { block: SourceBlock }) => (
  <li className="border-t border-hairline-dark/40 py-2 text-sm text-ink/70">
    {/* rel=noreferrer matters here beyond hygiene: on /c/<token> the URL is the
        credential, and the route already sends Referrer-Policy: no-referrer. */}
    {block.url ? (
      <a
        className="link-underline"
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {block.label}
      </a>
    ) : (
      block.label
    )}
  </li>
);

const PlaybookRef = ({ block }: { block: PlaybookRefBlock }) => (
  <div className="border-t border-hairline-dark/40 py-3">
    <p className="eyebrow text-ink/50">Playbook</p>
    <p className="text-[1.0625rem] leading-[1.55] text-ink/80">
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
