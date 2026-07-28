import { Youtube, Linkedin, Instagram, Facebook, ArrowUpRight } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const TikTokIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M16.5 3c.35 1.98 1.6 3.5 3.5 3.8v2.6c-1.36.09-2.66-.29-3.9-1.08v5.9c0 3.6-2.5 6.1-5.9 6.1A5.9 5.9 0 0 1 4.3 14.4c0-3.3 2.6-5.9 5.9-5.9.33 0 .65.03.97.09v2.8a3.1 3.1 0 0 0-.97-.16 3.2 3.2 0 1 0 3.2 3.2V3h3.1Z" />
  </svg>
);

const SnapchatIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12 2.2c2.9 0 4.6 2 4.6 4.7 0 .8-.05 1.5-.1 2.1.3.15.7.2 1.1.05.6-.2 1.2.6.6 1.1-.4.35-1.1.6-1.6.8-.3.1-.4.3-.3.6.5 1.4 1.7 2.9 3.3 3.2.5.1.6.7.2.95-.6.4-1.6.6-2.2.7-.15.35-.1.9-.5 1-.4.1-1.1-.15-2-.15-1 0-1.5.2-2.1.65-.6.45-1.2.9-2 .9s-1.4-.45-2-.9c-.6-.45-1.1-.65-2.1-.65-.9 0-1.6.25-2 .15-.4-.1-.35-.65-.5-1-.6-.1-1.6-.3-2.2-.7-.4-.25-.3-.85.2-.95 1.6-.3 2.8-1.8 3.3-3.2.1-.3 0-.5-.3-.6-.5-.2-1.2-.45-1.6-.8-.6-.5 0-1.3.6-1.1.4.15.8.1 1.1-.05-.05-.6-.1-1.3-.1-2.1C7.4 4.2 9.1 2.2 12 2.2Z" />
  </svg>
);

const XIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M17.2 3h3.3l-7.2 8.3L21.8 21h-6.6l-4.4-5.6L5.7 21H2.4l7.7-8.9L2.5 3h6.8l4 5.2L17.2 3Zm-1.2 16h1.8L8.1 4.9H6.1L16 19Z" />
  </svg>
);

const PLATFORMS: { name: string; Icon: ComponentType<IconProps>; href: string }[] = [
  { name: "YouTube", Icon: Youtube, href: "#" },
  { name: "LinkedIn", Icon: Linkedin, href: "#" },
  { name: "Instagram", Icon: Instagram, href: "#" },
  { name: "TikTok", Icon: TikTokIcon, href: "#" },
  { name: "Facebook", Icon: Facebook, href: "#" },
  { name: "Snapchat", Icon: SnapchatIcon, href: "#" },
  { name: "X", Icon: XIcon, href: "#" },
];

export function SocialSection() {
  return (
    <section className="section-ink border-t border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-8 lg:py-20">
        {/* Intro */}
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-start">
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold uppercase tracking-[0.08em] text-foreground sm:text-2xl">
              Stay Connected
            </p>
            <div className="mt-3 h-1 w-20 bg-lime" aria-hidden />

            <h2 className="display mt-5 text-[clamp(2.5rem,8vw,4.75rem)] font-extrabold uppercase leading-[0.95] text-foreground">
              Follow the journey.
            </h2>

            <div className="mt-5 max-w-md space-y-2 text-base leading-relaxed text-foreground/70 sm:text-lg">
              <p>Ideas. Conversations. Human stories.</p>
              <p className="text-foreground/55">
                Join us on the channels where the New Human Era is being built.
              </p>
            </div>
          </div>

          {/* Handwritten accent */}
          <div className="hidden lg:flex lg:justify-end lg:pt-6">
            <div className="relative inline-block">
              <p className="font-hand text-3xl leading-none text-lime">
                What&rsquo;s your Human Rep today?
              </p>
              <svg
                aria-hidden
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                className="mt-2 h-2 w-full text-lime"
              >
                <path
                  d="M2 5 C 40 1, 80 7, 120 3 S 180 6, 198 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Platform grid */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:mt-12 lg:grid-cols-7 lg:gap-4">
          {PLATFORMS.map(({ name, Icon, href }) => (
            <a
              key={name}
              href={href}
              className="group relative flex h-32 flex-col justify-between border border-border p-4 transition-colors duration-300 hover:border-lime focus-visible:border-lime focus-visible:outline-none sm:h-36 lg:p-5"
            >
              <Icon className="h-8 w-8 text-foreground/70 transition-colors duration-300 group-hover:text-foreground group-focus-visible:text-foreground" />
              <div>
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
            Real Recognizes Real.
          </p>
          <div className="mx-auto mt-3 h-1 w-16 bg-lime" aria-hidden />
        </div>
      </div>
    </section>
  );
}
