import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {publishEpisodeAction} from './actions/publish-episode'
import {syncFromPodbeanAction} from './actions/sync-from-podbean'

/** Types that exist to make the system work, not to be authored. */
const INFRASTRUCTURE_TYPES = ['slugLock']

export default defineConfig({
  name: 'default',
  title: 'The Be Human Company — Podcast',

  projectId: '5apyl3sk',
  dataset: 'production',

  plugins: [
    structureTool({
      // An explicit list rather than the default auto-listing, so `slugLock`
      // never appears in the sidebar. A lock is a mutex, not content.
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('episode').title('Episodes'),
            S.documentTypeListItem('topic').title('Topics'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Keep locks out of the "create new" menu entirely. A `drafts.slugLock-…`
    // would not reserve the published lock ID, so a hand-created draft lock
    // would be worse than useless — it would look like protection.
    newDocumentOptions: (prev) =>
      prev.filter((item) => !INFRASTRUCTURE_TYPES.includes(item.templateId)),

    // No publish, delete, duplicate or restore on a lock. Locks are written
    // only by publishEpisode(), inside the transaction that arbitrates the slug.
    //
    // Episodes get their built-in `publish` swapped for one that calls
    // publishEpisode() directly (Decision F's slug/episode compare-and-set)
    // instead of Sanity's own publish operation, and gain "Sync from Podbean"
    // — which creates drafts for feed episodes Sanity has never seen and never
    // publishes anything. Every other type — and every other action on episode
    // — passes through unchanged.
    actions: (prev, {schemaType}) => {
      if (INFRASTRUCTURE_TYPES.includes(schemaType)) return []
      if (schemaType === 'episode') {
        return [
          ...prev.map((action) => (action.action === 'publish' ? publishEpisodeAction : action)),
          syncFromPodbeanAction,
        ]
      }
      return prev
    },
  },
})
