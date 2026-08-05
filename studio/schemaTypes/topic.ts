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
      validation: (rule) => rule.required(),
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
