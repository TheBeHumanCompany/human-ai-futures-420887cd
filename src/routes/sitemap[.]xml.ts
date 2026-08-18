import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { DEGRADED_RETRY_AFTER_SECONDS } from "@/lib/podcast/degraded-status";
import { fetchSitemapEntriesFn } from "@/lib/podcast/queries";
import { SITE_ORIGIN, episodeUrl } from "@/lib/sanity/config";
import { sitemapSurfaces } from "@/lib/surfaces";

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
        /**
         * The static pages come from `SURFACES`, not from a list kept here.
         *
         * This handler and its test used to hold separate copies of that list,
         * and the test asserted its copy by exact equality. That arrangement
         * fails in both directions: adding a route turns the test red for a
         * reason unrelated to the change, and — far worse — updating the test's
         * copy without the handler's silently drops pages from the sitemap
         * while the suite stays green. One list, two readers.
         */
        const entries: SitemapEntry[] = sitemapSurfaces();

        /**
         * A truncated sitemap is worse than no sitemap.
         *
         * If Sanity is unreachable, emitting only the static entries with a
         * 200 tells a crawler that this site is those pages and the thirty-nine
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
