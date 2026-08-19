import type { ComponentType, SVGProps } from "react";

import { SOCIAL_LINKS, type SocialLink } from "@/lib/brand";

type IconProps = SVGProps<SVGSVGElement>;

const YouTubeIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <path
      fill="#FF0000"
      d="M23.5 6.9a3 3 0 0 0-2.1-2.1C19.5 4.3 12 4.3 12 4.3s-7.5 0-9.4.5A3 3 0 0 0 .5 6.9C0 8.8 0 12 0 12s0 3.2.5 5.1a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.1.5-5.1s0-3.2-.5-5.1Z"
    />
    <path fill="#FFFFFF" d="M9.6 15.6 15.8 12 9.6 8.4v7.2Z" />
  </svg>
);

const LinkedInIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <rect width="24" height="24" rx="3" fill="#0A66C2" />
    <path
      fill="#FFFFFF"
      d="M7.1 9.4H4.6V19h2.5V9.4Zm-1.25-4a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9ZM19.4 13.6c0-2.7-1.45-3.95-3.38-3.95-1.56 0-2.26.86-2.65 1.46V9.4H10.9V19h2.47v-5.36c0-1.13.21-2.22 1.61-2.22 1.38 0 1.4 1.29 1.4 2.29V19h2.5v-5.4Z"
    />
  </svg>
);

const InstagramIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#FDF497" />
        <stop offset="25%" stopColor="#FD5949" />
        <stop offset="55%" stopColor="#D6249F" />
        <stop offset="100%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
    <rect
      x="4.4"
      y="4.4"
      width="15.2"
      height="15.2"
      rx="4.6"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="12" r="3.6" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
    <circle cx="16.9" cy="7.1" r="1.1" fill="#FFFFFF" />
  </svg>
);

const XIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden {...props}>
    <path d="M17.2 3h3.3l-7.2 8.3L21.8 21h-6.6l-4.4-5.6L5.7 21H2.4l7.7-8.9L2.5 3h6.8l4 5.2L17.2 3Zm-1.2 16h1.8L8.1 4.9H6.1L16 19Z" />
  </svg>
);

/**
 * The accounts that exist, and why the other three are gone.
 *
 * This section shipped seven platforms, every one linking to a bare fragment
 * placeholder. Three of those accounts were searched for and found nowhere,
 * so they were removed rather than pointed at a personal account or a
 * plausible-looking guess, and their icon components went with them instead of
 * being left behind for a future contributor to wire up to something that
 * still does not exist.
 *
 * `X` survives that cut — it is a live account, and it was only ever a
 * candidate for removal because it happened to sit in the same unwired list.
 * Deleting it would have been a visible product change made on inference.
 *
 * This map is keyed on `SocialLink["name"]`, so it is a type error to add a
 * platform to `brand.ts` without giving it an icon here — the failure mode
 * being avoided is an entry that renders as an empty gap in a centred row.
 */
const ICONS: Record<SocialLink["name"], ComponentType<IconProps>> = {
  LinkedIn: LinkedInIcon,
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
  X: XIcon,
};

export function SocialSection() {
  return (
    <section className="section-ink">
      <div className="mx-auto max-w-[1400px] px-6 py-16 text-center sm:px-8 sm:py-20 lg:py-24">
        {/* Intro */}
        <div className="mx-auto min-w-0 max-w-3xl">
          <h2 className="type-h2-caps-light text-foreground">Follow the journey</h2>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-lime sm:mt-6 sm:text-lg lg:mt-8">
            Ideas. Conversations. Human stories.
          </p>
        </div>

        {/* Platform list */}
        <div className="mx-auto mt-12 grid grid-cols-2 place-items-center gap-x-6 gap-y-10 sm:mt-14 sm:grid-cols-4 lg:mt-20 lg:gap-x-12 lg:gap-y-12">
          {SOCIAL_LINKS.map(({ name, href }) => {
            const Icon = ICONS[name];
            return (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center gap-4 p-2 text-center transition-opacity duration-300 focus-visible:outline-none focus-visible:opacity-100"
              >
                <Icon className="h-12 w-12 opacity-90 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-focus-visible:scale-110 group-focus-visible:opacity-100 sm:h-14 sm:w-14" />
                <span className="font-display text-xs font-bold uppercase tracking-[0.1em] text-foreground">
                  {name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
