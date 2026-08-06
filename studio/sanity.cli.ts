import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '5apyl3sk',
    dataset: 'production'
  },
  /**
   * https://thebehumancompany.sanity.studio — matches SITE_ORIGIN
   * (thebehumancompany.ca, src/lib/sanity/config.ts).
   *
   * Set here rather than answered at the prompt: `sanity deploy` asks for a
   * hostname interactively on a first run, and the name is claimed from a
   * global first-come namespace, so it is a decision that belongs in a
   * reviewable diff rather than in one operator's terminal history.
   *
   * Top-level, not under `deployment` — that block takes only `appId` and
   * `autoUpdates` (@sanity/cli-core's cliConfigSchema). Misplacing it is a
   * TS2353, and also a `--dry-run` that reports no hostname configured.
   */
  studioHost: 'thebehumancompany',

  deployment: {
    /**
     * Returned by the first `sanity deploy` (2026-08-06) and pinned at its own
     * request: without it, every subsequent deploy prompts for an application
     * id, which is the same unattended-run hazard `studioHost` is set to avoid.
     */
    appId: 'hn8kbf43rddkpl7lqoc5xyrp',

    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     *
     * Kept on deliberately (2026-08-06), and it is a real trade rather than the
     * scaffold default left unread. The deployed Studio tracks Sanity's runtime
     * independently of this repo — today's build reported local 6.9.0 against
     * runtime 6.9.1 — which is the same unpinned behaviour SANITY_API_VERSION
     * exists to refuse. Accepted here because a Studio is an internal authoring
     * tool whose breakage is visible and recoverable by a redeploy, whereas an
     * API version shift silently changes what the public site renders.
     */
    autoUpdates: true,
  },
})
