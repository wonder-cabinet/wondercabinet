import {defineType, defineField} from 'sanity'

export const artist = defineType({
  name: 'artist',
  title: 'Artist',
  type: 'document',
  preview: {
    select: {titleEn: 'name.en', media: 'photo', location: 'currentLocation'},
    prepare({titleEn, media, location}) {
      return {title: titleEn || '(No name)', subtitle: location, media}
    },
  },
  fields: [
    defineField({name: 'name', title: 'Name', type: 'localeString'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name.en'}}),
    defineField({name: 'bio', title: 'Bio', type: 'localeText'}),
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'discipline',
      title: 'Discipline',
      description: 'Short line, e.g. "Photographer" / "Multidisciplinary artist". Shown under the artist\'s name.',
      type: 'localeString',
    }),
    defineField({name: 'currentLocation', title: 'Current location', type: 'string'}),
    defineField({name: 'website', title: 'Website', type: 'url'}),
    defineField({name: 'instagram', title: 'Instagram', type: 'string'}),
    defineField({
      name: 'links',
      title: 'Links',
      description: 'Extra links shown on the artist page (portfolio, press, etc). Website/Instagram above are shown automatically too.',
      type: 'array',
      of: [{type: 'linkItem'}],
    }),
    defineField({
      name: 'residencies',
      title: 'Residencies',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'residency'}]}],
    }),
    defineField({
      name: 'projects',
      title: 'Projects',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'project'}]}],
    }),
    defineField({
      name: 'artworks',
      title: 'Artworks',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'artwork'}]}],
    }),
    defineField({name: 'notionId', title: 'Notion ID', type: 'string', hidden: true}),
  ],
})
