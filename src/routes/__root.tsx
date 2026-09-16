import { ClerkProvider } from "@clerk/tanstack-react-start";
import { shadcn } from "@clerk/ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { PortalHeader } from "../components/portal-header";
import { PortalFooter } from "../components/portal-footer";
import { decideHostRoute, isPortalPath } from "../lib/surface";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Be Human Company — The Future Is Human." },
      {
        name: "description",
        content:
          "Human readiness, governance, agents and leadership. We help organizations get ready for artificial intelligence without losing what makes them human.",
      },
      { name: "author", content: "The Be Human Company" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "The Be Human Company — The Future Is Human." },
      { name: "twitter:title", content: "The Be Human Company — The Future Is Human." },
      {
        property: "og:description",
        content:
          "Human readiness, governance, agents and leadership. We help organizations get ready for artificial intelligence without losing what makes them human.",
      },
      {
        name: "twitter:description",
        content:
          "Human readiness, governance, agents and leadership. We help organizations get ready for artificial intelligence without losing what makes them human.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/eb55abfeecf4f29714d837974fc48a31/id-preview-3502a2a4--d03b88e4-8da1-457b-8afc-3c434677b299.lovable.app-1786826151353.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/eb55abfeecf4f29714d837974fc48a31/id-preview-3502a2a4--d03b88e4-8da1-457b-8afc-3c434677b299.lovable.app-1786826151353.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        // Work Sans 200 backs the type scale's `-prose` register (the largest
        // reflective statements in Maya's mockups). Adding it costs nothing:
        // Google serves Work Sans as a variable font, so `wght@200;300;400;500;600`
        // and `wght@300;400;500;600` return a byte-identical set of woff2 URLs —
        // the multiple URLs are `unicode-range` subsets, not per-weight files.
        // The same is true of Oswald, which is why its weight list is not trimmed.
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;700;800&family=Caveat:wght@500&family=Work+Sans:wght@200;300;400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/*
          The shadcn theme already inherits the brand's COLOUR, because it reads
          the same `--primary`, `--background` and `--border` custom properties
          `src/styles.css` defines — which is why the sign-in button is lime
          without anything being said here.

          What it does not inherit is type and geometry: Clerk ships its own font
          stack and a rounded default, so the card read as a generic auth widget
          sitting on a Be Human page. These two variables close that gap and
          nothing else, deliberately — every colour stays delegated to the CSS
          layer, so a palette change in styles.css keeps flowing through instead
          of being pinned twice.

          Counterfactual: hardcoding colours here would make styles.css and this
          file disagree the first time either moves.
        */}
        <ClerkProvider
          appearance={{
            theme: shadcn,
            variables: {
              fontFamily: '"Work Sans", ui-sans-serif, system-ui, sans-serif',
              borderRadius: "0.125rem",
            },
          }}
        >
          {children}
          <Scripts />
        </ClerkProvider>
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const portal = isPortalPath(pathname);

  // Client-side host guard, both directions. A TanStack `<Link>` /
  // `router.navigate` never re-enters `src/server.ts`, so without this an
  // apex client navigation to `/portal` would render portal chrome on the
  // apex, and a portal navigation to `/` would render marketing on the
  // portal host. The exact same decision function the server uses, so the
  // two cannot disagree. The branch above is path-based (identical on
  // server and client) so SSR and hydration never disagree on chrome.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const decision = decideHostRoute({
      host: window.location.host,
      pathname: window.location.pathname,
      search: window.location.search,
    });
    if (decision.kind === "redirect") {
      window.location.replace(decision.location);
    } else if (decision.kind === "notFound") {
      // Let the server emit the 404.
      window.location.reload();
    }
  }, [pathname]);

  if (portal) {
    return (
      <QueryClientProvider client={queryClient}>
        <PortalHeader />
        <main>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <PortalFooter />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SiteHeader />
      <main>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </main>
      <SiteFooter />
    </QueryClientProvider>
  );
}
