import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * A podcast episode — the durable record.
 *
 * Sanity is the archive; the PodBean RSS feed is only a discovery mechanism for
 * new episodes. Podcast feeds are not archives (hosts cap them, and this one
 * grows ~230 kB per 39 episodes), so an episode that falls out of the feed must
 * still render — otherwise already-shared links break, which is the single
 * failure this project exists to prevent.
 *
 * IDENTITY. `_id` is deterministic: `episodeDocId(guid)` (src/lib/podcast/
 * doc-id.ts), a sanitised form of the PodBean `guid`. This departs from
 * Sanity's usual guidance against source-derived document IDs on purpose —
 * `publishEpisode()`'s Decision F (src/lib/sanity/publish.ts) relies on the
 * `_id` being derivable in advance so a strict Sanity `create` against it acts
 * as a datastore-level compare-and-set: two publish attempts for the same
 * episode collide on the same `_id` rather than racing to create two
 * documents that then have to be reconciled by a query. The `guid` field is
 * kept anyway, queryable, as the human/debugging-facing source identity — but
 * matching is done by `_id`, not by querying `guid`. (The `slugLock` type
 * uses the same deterministic-ID mechanism for its own compare-and-set; see
 * its own note.)
 *
 * GUEST FIELDS ARE INLINE, not a reference, which is a deliberate departure
 * from the usual "author → reference" pattern. The feed gives guest names only
 * as free text inside titles, parsed at ~37/39 accuracy, so a mis-parse should
 * stay a one-field correction rather than becoming a shared document to delete
 * and a reference to repoint. `guestKey` (normalised name) is the escape hatch:
 * promoting guests to a reference type later is a scripted migration, not a
 * re-authoring exercise. There are zero repeat guests across the current 39.
 */
export const episode = defineType({
  name: 'episode',
  title: 'Episode',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Identity'},
    {name: 'content', title: 'Content', default: true},
    {name: 'guest', title: 'Guest'},
    {name: 'media', title: 'Media'},
    {name: 'system', title: 'System'},
  ],
  fields: [
    /* ---------- identity ---------- */

    defineField({
      name: 'guid',
      title: 'PodBean GUID',
      description:
        'Stable identity from the feed. The document _id is derived from this value (see the IDENTITY note above) — never edit it, or the episode becomes unreachable by its own id.',
      type: 'string',
      group: 'identity',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'URL slug',
      description:
        'The permanent URL. Editable until first publish, immutable afterwards — guests share this link and it can never move.',
      type: 'slug',
      group: 'identity',
      options: {maxLength: 60},
      readOnly: ({document}) => Boolean(document?.slugFrozenAt),
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slugFrozenAt',
      title: 'Slug frozen at',
      type: 'datetime',
      group: 'system',
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),

    defineField({
      name: 'episodeNumber',
      title: 'Episode number',
      type: 'number',
      group: 'identity',
      validation: (rule) => rule.integer().positive(),
    }),

    /* ---------- content ---------- */

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Show notes',
      description: 'Full notes from the feed. Not rendered directly; the excerpt is.',
      type: 'text',
      rows: 6,
      group: 'content',
    }),

    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      description:
        'Short summary shown under the title and used as the search haystack. Seeded from the show notes with the repeated host intro trimmed; override freely.',
      type: 'text',
      rows: 3,
      group: 'content',
      validation: (rule) => rule.max(300),
    }),

    defineField({
      name: 'topics',
      title: 'Topics',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: [{type: 'topic'}]})],
      /**
       * Six, because that is the number the payload budget was measured at.
       *
       * `queries.test.ts` bounds a maximal episode at 1,200 B and builds its
       * fixture from six of the largest real topics. Measured against the
       * shipped taxonomy: six topics is 1,161 B, seven is 1,214 B. The seventh
       * topic is precisely what breaks the bound, so this is load-bearing rather
       * than tidiness — see MAX_TOPICS_PER_EPISODE in src/lib/podcast/topics.ts.
       *
       * It has to live here because the offline bound cannot see editor
       * behaviour. Decision K is explicit that the offline test is a regression
       * detector for *developer* changes; catalogue growth is the live 120 kB
       * ceiling's job. Neither one stops an editor adding a seventh topic to one
       * episode, and before this rule nothing did.
       */
      validation: (rule) => rule.unique().max(6),
    }),

    /* ---------- guest ---------- */

    defineField({
      name: 'guestName',
      title: 'Guest name',
      description: 'Pre-filled by parsing the episode title. Correct it if the parse was wrong.',
      type: 'string',
      group: 'guest',
    }),

    defineField({
      name: 'guestBio',
      title: 'Guest bio',
      description:
        'Required, with the photo, for this episode to become indexable. Kept as plain text so the enrichment predicate can use length().',
      type: 'text',
      rows: 4,
      group: 'guest',
      // min(20) is the practical guard against a whitespace-only bio, which
      // GROQ's length() cannot detect (there is no trim in GROQ).
      validation: (rule) => rule.min(20).warning('A very short bio will still count as enriched.'),
    }),

    defineField({
      name: 'guestPhoto',
      title: 'Guest photo',
      type: 'image',
      group: 'guest',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),

    defineField({
      name: 'guestKey',
      title: 'Guest key',
      description: 'Normalised guest name. Reserved for a future guest reference migration.',
      type: 'string',
      group: 'system',
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),

    /* ---------- media ---------- */

    defineField({
      name: 'coverArtwork',
      title: 'Cover artwork',
      description: 'Also used as the Open Graph image when this episode is shared.',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),

    defineField({
      name: 'podbeanUrl',
      title: 'PodBean episode URL',
      description: 'Target of the "Listen or Watch Full Episode" button.',
      type: 'url',
      group: 'media',
      validation: (rule) => rule.required().uri({scheme: ['https']}),
    }),

    defineField({
      name: 'audioUrl',
      title: 'Audio file URL',
      description: 'Direct CDN media URL, played by the on-page player.',
      type: 'url',
      group: 'media',
      validation: (rule) => rule.required().uri({scheme: ['https']}),
    }),

    defineField({
      name: 'durationSeconds',
      title: 'Duration (seconds)',
      type: 'number',
      group: 'media',
      validation: (rule) => rule.required().integer().positive(),
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'content',
      validation: (rule) => rule.required(),
    }),

    /* ---------- system ---------- */

    defineField({
      name: 'searchText',
      title: 'Search text',
      description:
        'Normalised haystack, recomputed on every publish. Never edit by hand — it will be overwritten.',
      type: 'string',
      group: 'system',
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),

    defineField({
      name: 'seededBy',
      title: 'Seeded by',
      type: 'string',
      group: 'system',
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),

    defineField({
      name: 'shareCard',
      title: 'Share card',
      description:
        'The 1200×630 image social platforms show when this episode is shared. Generated by ' +
        '`bun run podcast:share-cards`, never uploaded by hand — real cover artwork takes ' +
        'precedence over it anyway, so upload that instead if you have it.',
      type: 'image',
      group: 'system',
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),

    defineField({
      name: 'shareCardKey',
      title: 'Share card key',
      description:
        'A fingerprint of the title, guest and number the share card was generated from. It is ' +
        'what makes a stale card a query rather than an inspection: retitle an episode and this ' +
        'stops matching, so `podcast:report` can list the cards that need regenerating. A stale ' +
        'card is still a valid image, so nothing else would notice.',
      type: 'string',
      group: 'system',
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),
  ],

  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
    {
      title: 'Episode number',
      name: 'episodeNumberAsc',
      by: [{field: 'episodeNumber', direction: 'asc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      episodeNumber: 'episodeNumber',
      guestName: 'guestName',
      media: 'coverArtwork',
    },
    prepare({title, episodeNumber, guestName, media}) {
      return {
        title: episodeNumber ? `${episodeNumber}. ${title}` : title,
        subtitle: guestName ? `with ${guestName}` : 'No guest recorded',
        media,
      }
    },
  },
})
