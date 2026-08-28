import { SOCIAL_LINKS, type SocialLink } from "@/lib/brand";

import { SocialIcon } from "./social-icons";

/**
 * Follow the Journey — large, full-color branded social logos.
 *
 * Unlike the footer (white-neutral, one color for every icon), each logo here
 * renders in its brand color against the ink section, scaling gently on hover.
 * `BRAND_COLORS` is keyed on `SocialLink["name"]`, so a platform added to
 * `brand.ts` without a color here is a type error, not a silent grey icon.
 */
const BRAND_COLORS: Record<SocialLink["name"], string> = {
  LinkedIn: "#0A66C2",
  Instagram: "#E4405F",
  YouTube: "#FF0000",
  X: "#FFFFFF",
  TikTok: "#FFFFFF",
  Snapchat: "#FFFC00",
  Facebook: "#1877F2",
};

export function SocialSection() {
  return (
    <section className="section-ink">
      <div className="mx-auto max-w-[1400px] px-6 py-20 text-center sm:px-8 sm:py-24 lg:py-32">
        {/* Intro */}
        <div className="mx-auto min-w-0 max-w-3xl">
          <h2 className="type-h2-caps-light text-foreground">Follow the journey</h2>

          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-lime sm:mt-8 sm:text-lg lg:mt-10">
            Ideas. Conversations. Human stories.
          </p>
        </div>

        {/* Platform list */}
        <div className="mx-auto mt-14 flex flex-wrap items-center justify-center gap-7 sm:mt-18 sm:gap-9 lg:mt-24 lg:gap-12">
          {SOCIAL_LINKS.map(({ name, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="group cursor-pointer transition-transform duration-300 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none"
            >
              <SocialIcon
                name={name}
                className="h-14 w-14 transition-opacity duration-300 group-hover:opacity-100 sm:h-16 sm:w-16"
                style={{ color: BRAND_COLORS[name] }}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
