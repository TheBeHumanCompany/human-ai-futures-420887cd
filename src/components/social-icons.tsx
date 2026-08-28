import type { ComponentType, SVGProps } from "react";

import { SOCIAL_LINKS, type SocialLink } from "@/lib/brand";

type IconProps = SVGProps<SVGSVGElement>;

const YouTubeIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <rect x="1.5" y="5" width="21" height="14" rx="4" />
    <path d="M9.5 9.5l6 2.5-6 2.5v-5z" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedInIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M5.4 4.6a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Zm.3 4.8h3v10.2h-3V9.4Zm4.8 0h2.9v1.4c.8-1 2-1.6 3.3-1.6 2.6 0 4.3 1.7 4.3 4.8v5.6h-3v-5.2c0-1.5-.5-2.5-1.8-2.5-1.2 0-2 .9-2 2.5v5.2h-3V9.4Z" />
  </svg>
);

const InstagramIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden {...props}>
    <rect x="2" y="2" width="20" height="20" rx="6" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const XIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M17.2 3h3.3l-7.2 8.3L21.8 21h-6.6l-4.4-5.6L5.7 21H2.4l7.7-8.9L2.5 3h6.8l4 5.2L17.2 3Zm-1.2 16h1.8L8.1 4.9H6.1L16 19Z" />
  </svg>
);

const TikTokIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M16.6 2h-3.2v12.4c0 2.6-2.1 4.7-4.7 4.7S4 17 4 14.4s2.1-4.7 4.7-4.7c.6 0 1.2.1 1.8.3V7.2c-.6-.1-1.2-.2-1.8-.2-4.1 0-7.4 3.3-7.4 7.4s3.3 7.4 7.4 7.4 7.4-3.3 7.4-7.4V7.6c1.3 1 2.9 1.6 4.6 1.6V5.8c-1.9 0-3.6-1-4.6-2.6V2Z" />
  </svg>
);

const SnapchatIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12 2c2.4 0 4.4 1.7 4.7 4.1 0 .2 0 .4-.1.6.4.1.8.2 1.2.2.6 0 1-.4 1-.9 0-.2 0-.4-.2-.6l.6-.4c.3.4.4.8.4 1.3 0 1-.8 1.9-1.9 1.9-.2 0-.4 0-.6-.1-.1.4-.4.8-.7 1.1.4.3.9.4 1.5.4.4 0 .8.3.8.7s-.4.7-.8.7c-.6 0-1.2.2-1.6.4-.2.8-.9 1.4-1.8 1.4h-.2c-.4.8-1.2 1.4-2.2 1.4s-1.8-.6-2.2-1.4h-.2c-.9 0-1.6-.6-1.8-1.4-.4-.2-1-.4-1.6-.4-.4 0-.8-.3-.8-.7s.4-.7.8-.7c.6 0 1.1-.1 1.5-.4-.3-.3-.6-.7-.7-1.1-.2.1-.4.1-.6.1-1.1 0-1.9-.9-1.9-1.9 0-.5.1-.9.4-1.3l.6.4c-.1.2-.2.4-.2.6 0 .5.4.9 1 .9.4 0 .8 0 1.2-.2 0-.2-.1-.4-.1-.6C7.6 3.7 9.6 2 12 2Z" />
  </svg>
);

const FacebookIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3V2Z" />
  </svg>
);

export const SOCIAL_ICONS: Record<SocialLink["name"], ComponentType<IconProps>> = {
  YouTube: YouTubeIcon,
  LinkedIn: LinkedInIcon,
  Instagram: InstagramIcon,
  X: XIcon,
  TikTok: TikTokIcon,
  Snapchat: SnapchatIcon,
  Facebook: FacebookIcon,
};

export function SocialIcon({ name, className }: { name: SocialLink["name"]; className?: string }) {
  const Icon = SOCIAL_ICONS[name];
  return <Icon className={className} />;
}

export function SocialIconRow({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <div className={`flex flex-wrap gap-4 ${className ?? ""}`}>
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.name}
          className="text-foreground/80 transition-colors duration-300 hover:text-lime focus-visible:outline-none focus-visible:text-lime"
        >
          <SocialIcon name={social.name} className={iconClassName ?? "h-5 w-5"} />
        </a>
      ))}
    </div>
  );
}
