import { ArrowUpRight } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

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

const TikTokIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <path
      fill="#25F4EE"
      d="M14.9 3c.35 1.98 1.6 3.5 3.5 3.8v2.6c-1.36.09-2.66-.29-3.9-1.08v5.9c0 3.6-2.5 6.1-5.9 6.1A5.9 5.9 0 0 1 2.7 14.4c0-3.3 2.6-5.9 5.9-5.9.33 0 .65.03.97.09v2.8a3.1 3.1 0 0 0-.97-.16 3.2 3.2 0 1 0 3.2 3.2V3h3.1Z"
    />
    <path
      fill="#FE2C55"
      d="M17.3 3c.35 1.98 1.6 3.5 3.5 3.8v2.6c-1.36.09-2.66-.29-3.9-1.08v5.9c0 3.6-2.5 6.1-5.9 6.1a5.86 5.86 0 0 1-3.03-.83c1.05.9 2.4 1.4 3.93 1.4 3.4 0 5.9-2.5 5.9-6.1v-5.9c1.24.79 2.54 1.17 3.9 1.08V7.37c-1.9-.3-3.15-1.82-3.5-3.8h-.9Z"
    />
    <path
      fill="#FFFFFF"
      d="M16.1 3c.35 1.98 1.6 3.5 3.5 3.8v2.6c-1.36.09-2.66-.29-3.9-1.08v5.9c0 3.6-2.5 6.1-5.9 6.1A5.9 5.9 0 0 1 3.9 14.4c0-3.3 2.6-5.9 5.9-5.9.33 0 .65.03.97.09v2.8a3.1 3.1 0 0 0-.97-.16 3.2 3.2 0 1 0 3.2 3.2V3h3.1Z"
    />
  </svg>
);

const FacebookIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="11" fill="#1877F2" />
    <path
      fill="#FFFFFF"
      d="M15.4 13.1l.45-2.9h-2.8V8.32c0-.8.39-1.57 1.63-1.57h1.28V4.28s-1.16-.2-2.27-.2c-2.32 0-3.83 1.4-3.83 3.95v2.24H7.3v2.9h2.56v7h3.19v-7h2.35Z"
    />
  </svg>
);

const SnapchatIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <path
      fill="#FFFC00"
      stroke="#111111"
      strokeWidth="0.6"
      d="M12 2.2c2.9 0 4.6 2 4.6 4.7 0 .8-.05 1.5-.1 2.1.3.15.7.2 1.1.05.6-.2 1.2.6.6 1.1-.4.35-1.1.6-1.6.8-.3.1-.4.3-.3.6.5 1.4 1.7 2.9 3.3 3.2.5.1.6.7.2.95-.6.4-1.6.6-2.2.7-.15.35-.1.9-.5 1-.4.1-1.1-.15-2-.15-1 0-1.5.2-2.1.65-.6.45-1.2.9-2 .9s-1.4-.45-2-.9c-.6-.45-1.1-.65-2.1-.65-.9 0-1.6.25-2 .15-.4-.1-.35-.65-.5-1-.6-.1-1.6-.3-2.2-.7-.4-.25-.3-.85.2-.95 1.6-.3 2.8-1.8 3.3-3.2.1-.3 0-.5-.3-.6-.5-.2-1.2-.45-1.6-.8-.6-.5 0-1.3.6-1.1.4.15.8.1 1.1-.05-.05-.6-.1-1.3-.1-2.1C7.4 4.2 9.1 2.2 12 2.2Z"
    />
  </svg>
);

const XIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden {...props}>
    <path d="M17.2 3h3.3l-7.2 8.3L21.8 21h-6.6l-4.4-5.6L5.7 21H2.4l7.7-8.9L2.5 3h6.8l4 5.2L17.2 3Zm-1.2 16h1.8L8.1 4.9H6.1L16 19Z" />
  </svg>
);

const PLATFORMS: { name: string; Icon: ComponentType<IconProps>; href: string }[] = [
  { name: "YouTube", Icon: YouTubeIcon, href: "#" },
  { name: "LinkedIn", Icon: LinkedInIcon, href: "#" },
  { name: "Instagram", Icon: InstagramIcon, href: "#" },
  { name: "TikTok", Icon: TikTokIcon, href: "#" },
  { name: "Facebook", Icon: FacebookIcon, href: "#" },
  { name: "Snapchat", Icon: SnapchatIcon, href: "#" },
  { name: "X", Icon: XIcon, href: "#" },
];


export function SocialSection() {
  return (
    <section className="section-ink border-t border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-8 lg:py-20">
        {/* Intro */}
        <div className="min-w-0">
          <p className="section-label section-label-dark text-[15px] sm:text-base lg:text-lg">
            STAY CONNECTED
          </p>

          <h2 className="display mt-5 text-[clamp(2.5rem,8vw,4.75rem)] font-extrabold uppercase leading-[0.95] text-foreground">
            Follow the journey
          </h2>

          <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/70 sm:text-lg">
            Ideas. Conversations. Human stories.
          </p>
        </div>

        {/* Platform grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:mt-10 lg:grid-cols-7 lg:gap-4">
          {PLATFORMS.map(({ name, Icon, href }) => (
            <a
              key={name}
              href={href}
              className="group relative flex h-32 flex-col justify-between border border-border p-4 transition-colors duration-300 hover:border-lime focus-visible:border-lime focus-visible:outline-none sm:h-36 lg:p-5"
            >
              <div className="flex flex-1 items-center justify-center">
                <Icon className="h-12 w-12 opacity-90 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-focus-visible:scale-110 group-focus-visible:opacity-100 sm:h-14 sm:w-14" />
              </div>
              <div className="w-full">
                <div className="h-px w-full bg-border" aria-hidden />
                <div className="mt-3 flex items-end justify-between gap-2">
                  <span className="font-display text-xs font-bold uppercase tracking-[0.1em] text-foreground">
                    {name}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-lime transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Sign-off */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-foreground sm:text-sm">
            Real Recognizes Real
          </p>
          <div className="mx-auto mt-3 h-0.5 w-16 bg-lime" aria-hidden />
        </div>
      </div>
    </section>
  );
}
