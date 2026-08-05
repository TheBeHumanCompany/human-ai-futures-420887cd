import {defineType, defineField} from 'sanity'

/**
 * INFRASTRUCTURE — not content. Do not author these.
 *
 * A mutex whose `_id` IS the slug: `slugLock-<slug>`. Sanity's `create`
 * mutation (as distinct from `createIfNotExists`) fails when the `_id` already
 * exists, and a transaction is all-or-nothing — so a strict `create` of this
 * document inside the publish transaction is a datastore-level compare-and-set.
 * That is what makes a slug collision a publish-time error (AC-5) rather than
 * damage discovered afterwards.
 *
 * This is a deliberate, narrow exception to Sanity's "avoid slug-derived IDs"
 * guidance, which is about *content* documents and their relationships. Here
 * the colliding ID is not a modelling shortcut — it is the entire mechanism,
 * and it is closer to a Structure-managed singleton than to a content type.
 * Episode documents follow the guidance and use generated `_id`s, keyed by a
 * queryable `guid` field.
 *
 * Studio access is closed off in sanity.config.ts: excluded from the structure,
 * removed from `newDocumentOptions`, and `actions` returns `[]`. Note that a
 * `drafts.slugLock-…` would NOT reserve the published ID, which is one reason
 * drafts must never be creatable here.
 */
export const slugLock = defineType({
  name: 'slugLock',
  title: 'Slug Lock (infrastructure)',
  type: 'document',
  // Every field is readOnly: this document is written only by publishEpisode().
  fields: [
    defineField({
      name: 'episodeId',
      title: 'Episode document ID',
      type: 'string',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'guid',
      title: 'PodBean GUID',
      type: 'string',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'frozenAt',
      title: 'Frozen at',
      type: 'datetime',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: '_id', subtitle: 'episodeId'},
  },
})
