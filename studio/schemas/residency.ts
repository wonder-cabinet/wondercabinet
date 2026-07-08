import {defineType, defineField} from 'sanity'

export const residency = defineType({
  name: 'residency',
  title: 'Residency',
  type: 'document',
  preview: {
    select: {titleEn: 'title.en', media: 'coverImage', year: 'year', location: 'location'},
    prepare({titleEn, media, year, location}) {
      return {title: titleEn || '(Untitled)', subtitle: [location, year].filter(Boolean).join(' · '), media}
    },
  },
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title.en'}}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localeString'}),
    defineField({name: 'description', title: 'Description', type: 'localeText'}),
    defineField({name: 'type', title: 'Type', type: 'string'}),
    defineField({name: 'status', title: 'Status', type: 'string'}),
    defineField({name: 'year', title: 'Year', type: 'number'}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'startDate', title: 'Start date', type: 'date'}),
    defineField({name: 'endDate', title: 'End date', type: 'date'}),
    defineField({name: 'ongoing', title: 'Ongoing', type: 'boolean'}),
    defineField({name: 'collectiveName', title: 'Collective name', type: 'string'}),
    defineField({name: 'funders', title: 'Funders', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'partners', title: 'Partners', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'coverImage', title: 'Cover image', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'artists',
      title: 'Artists',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'artist'}]}],
    }),
    defineField({name: 'project', title: 'Project', type: 'reference', to: [{type: 'project'}]}),
    defineField({name: 'parentResidency', title: 'Parent residency', type: 'reference', to: [{type: 'residency'}]}),
    defineField({
      name: 'artworks',
      title: 'Artworks',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'artwork'}]}],
    }),
    defineField({name: 'notionId', title: 'Notion ID', type: 'string', hidden: true}),
  ],
})
