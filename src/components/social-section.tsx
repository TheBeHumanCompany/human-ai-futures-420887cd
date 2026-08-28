import { SOCIAL_LINKS } from "@/lib/brand";

import { SocialIcon } from "./social-icons";

/**
 * The accounts that exist.
 *
 * This map is keyed on `SocialLink["name"]`, so it is a type error to add a
 * platform to `brand.ts` without giving it an icon here — the failure mode
 * being avoided is an entry that renders as an empty gap in a centred row.
 */
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
        <div className="mx-auto mt-12 flex flex-wrap justify-center gap-6 sm:mt-14 sm:gap-8 lg:mt-20 lg:gap-10">
          {SOCIAL_LINKS.map(({ name, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="group text-foreground/80 transition-colors duration-300 hover:text-lime focus-visible:outline-none focus-visible:text-lime"
            >
              <SocialIcon
                name={name}
                className="h-12 w-12 opacity-90 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-focus-visible:scale-110 group-focus-visible:opacity-100 sm:h-14 sm:w-14"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
