import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { DEGRADED_RETRY_AFTER_SECONDS } from "@/lib/podcast/degraded-status";
import { fetchSitemapEntriesFn } from "@/lib/podcast/queries";
import { SITE_ORIGIN, episodeUrl } from "@/lib/sanity/config";

// Canonical origin, confirmed 2026-08-05. Sitemap entries must be absolute;
// until this was set the sitemap emitted bare paths, which crawlers reject.
const BASE_URL = SITE_ORIGIN;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/be-human-ai", changefreq: "monthly", priority: "0.9" },
          // The priced offer. Ranked with the home page rather than with the
          // services index, because it is the page the sales pages exist to
          // reach and the only one carrying a transaction.
          { path: "/be-human-ai/blueprint", changefreq: "monthly", priority: "1.0" },
          { path: "/be-human-ai/human-readiness", changefreq: "monthly", priority: "0.8" },
          { path: "/be-human-ai/governance", changefreq: "monthly", priority: "0.8" },
          { path: "/be-human-ai/ai-strategy", changefreq: "monthly", priority: "0.8" },
          // The mission page. Ranked with the three pillar pages rather than
          // with `/be-human-ai` (0.9) or the Blueprint (1.0): those two carry
          // the priced offer and the funnel that reaches it, and ranking the
          // mission page level with them would misstate relative crawl
          // priority. It sits above the remaining brand pages at 0.7.
          { path: "/why-we-exist", changefreq: "monthly", priority: "0.8" },
          // `/about` stays. It is a live canonical page — the team, story and
          // press page — not a redirect, so dropping it here would deindex a
          // page that returns 200.
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/the-new-human-era", changefreq: "monthly", priority: "0.7" },
          { path: "/the-human-archive", changefreq: "weekly", priority: "0.7" },
          { path: "/podcast", changefreq: "weekly", priority: "0.7" },
          { path: "/contact", changefreq: "yearly", priority: "0.6" },
        ];

        /**
         * A truncated sitemap is worse than no sitemap.
         *
         * If Sanity is unreachable, emitting the seven static entries with a
         * 200 tells a crawler that this site has seven pages and the thirty-nine
         * episode URLs it already knows about are gone. That is a deliberate
         * removal signal produced by someone else's outage — the single failure
         * this whole design exists to prevent.
         *
         * So the handler refuses to answer instead. A 503 is the one status that
         * means "draw no conclusions from this", and `Retry-After` says when to
         * come back. It returns its own Response, which passes through the
         * server wrapper untouched: the catastrophic-error normaliser only fires
         * on a JSON body, and the 500→503 upgrade only fires on a 500.
         */
        let episodes;
        try {
          // The PLAIN query function, not the server-function wrapper: this is
          // already a server-only handler and cannot call one.
          episodes = await fetchSitemapEntriesFn();
        } catch {
          return new Response("", {
            status: 503,
            headers: {
              "Content-Type": "application/xml",
              "Retry-After": String(DEGRADED_RETRY_AFTER_SECONDS),
              "Cache-Control": "no-store",
            },
          });
        }

        for (const episode of episodes) {
          entries.push({
            // Routed through `episodeUrl` rather than templated here, so the
            // sitemap and the page's own canonical tag cannot disagree about
            // what an episode's URL is. The pathname is taken back off because
            // the emitter below re-adds the origin for every entry.
            path: new URL(episodeUrl(episode.slug.current)).pathname,
            lastmod: episode.updatedAt,
            changefreq: "yearly",
            priority: "0.8",
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
