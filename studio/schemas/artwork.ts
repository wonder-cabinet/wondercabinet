import {defineType, defineField} from 'sanity'

export const artwork = defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  preview: {
    select: {titleEn: 'title.en', media: 'images.0', year: 'year', status: 'status'},
    prepare({titleEn, media, year, status}) {
      return {title: titleEn || '(Untitled)', subtitle: [status, year].filter(Boolean).join(' · '), media}
    },
  },
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title.en'}}),
    defineField({name: 'description', title: 'Description', type: 'localeText'}),
    defineField({
      name: 'artist',
      title: 'Artist(s)',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'artist'}]}],
    }),
    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: ['Installation', 'Sound Art', 'Video', 'Photography', 'Sculpture', 'Performance', 'Drawing', 'Painting', 'Mixed Media'],
      },
    }),
    defineField({name: 'dimensions', title: 'Dimensions', type: 'string'}),
    defineField({name: 'materials', title: 'Materials', type: 'string'}),
    defineField({name: 'year', title: 'Year', type: 'number'}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: ['In Development', 'Completed', 'Archived', 'On Show'], layout: 'radio'},
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      options: {list: ['Wonder Cabinet', 'Europe', 'Online', 'Other'], layout: 'radio'},
    }),
    defineField({name: 'exhibitionDate', title: 'Exhibition date', type: 'date'}),
    defineField({name: 'documentation', title: 'Documentation', type: 'url'}),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({name: 'project', title: 'Project', type: 'reference', to: [{type: 'project'}]}),
    defineField({name: 'residency', title: 'Residency', type: 'reference', to: [{type: 'residency'}]}),
    defineField({name: 'notionId', title: 'Notion ID', type: 'string', hidden: true}),
  ],
})
