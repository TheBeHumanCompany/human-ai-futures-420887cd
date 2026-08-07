import {defineType, defineField} from 'sanity'

/**
 * A canonical topic.
 *
 * A reference target rather than a free-text array, per Sanity's own decision
 * matrix (shared taxonomy → reference) and because the directory's server-side
 * topic filter needs canonical values — `Leadership` and `leadership` as loose
 * strings would produce two facets for one topic.
 *
 * The PodBean feed supplies no topics at all (verified: no `itunes:keywords`,
 * no per-item `category`, no `itunes:season`), so the seeder never creates one.
 * Every topic here is authored.
 */
export const topic = defineType({
  name: 'topic',
  title: 'Topic',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      /**
       * 16 characters, and it is a payload budget rather than a style rule.
       *
       * The directory fetches the whole catalogue, so every topic name is paid
       * for on every episode that references it — roughly 6 B per character per
       * episode across a six-topic array. `queries.test.ts`'s per-episode bound
       * (1,200 B) is measured against exactly this ceiling; see
       * TOPIC_NAME_MAX_LENGTH in src/lib/podcast/topics.ts.
       *
       * **This rule is what makes the ceiling real.** `scripts/apply-topics.ts`
       * uses `createIfNotExists` and so deliberately never overwrites a name an
       * editor has edited here — which means the committed taxonomy file's own
       * 16-character limit cannot bind production by itself. Without this rule a
       * rename in the Studio grows the live payload while every offline test
       * stays green against the file.
       */
      validation: (rule) => rule.required().max(16),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 60},
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'slug.current'},
  },
})
