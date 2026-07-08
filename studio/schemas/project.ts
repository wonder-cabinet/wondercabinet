import {defineType, defineField} from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  preview: {
    select: {titleEn: 'title.en', media: 'coverImage', year: 'year', role: 'wonderCabinetRole'},
    prepare({titleEn, media, year, role}) {
      return {title: titleEn || '(Untitled)', subtitle: [role, year].filter(Boolean).join(' · '), media}
    },
  },
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title.en'}}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localeString'}),
    defineField({name: 'description', title: 'Description', type: 'localeText'}),
    defineField({name: 'type', title: 'Type', type: 'string'}),
    defineField({
      name: 'wonderCabinetRole',
      title: "Wonder Cabinet's Role",
      type: 'string',
      options: {list: ['Produced', 'Co-Produced', 'Commissioned', 'Presented', 'Hosted'], layout: 'radio'},
    }),
    defineField({name: 'status', title: 'Status', type: 'string'}),
    defineField({name: 'year', title: 'Year', type: 'number'}),
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
    defineField({name: 'residency', title: 'Residency', type: 'reference', to: [{type: 'residency'}]}),
    defineField({name: 'parentProject', title: 'Parent project', type: 'reference', to: [{type: 'project'}]}),
    defineField({
      name: 'artworks',
      title: 'Artworks',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'artwork'}]}],
    }),
    defineField({
      name: 'blocks',
      title: 'Page layout blocks',
      description: 'Freeform modular content blocks for the bespoke project page (text, image, two-column, full-bleed photo, poster, gallery, divider).',
      type: 'array',
      of: [
        {type: 'contentText'},
        {type: 'contentImage'},
        {type: 'contentTwoColumn'},
        {type: 'contentFullBleedPhoto'},
        {type: 'contentPoster'},
        {type: 'contentGallery'},
        {type: 'contentDivider'},
      ],
    }),
    defineField({name: 'notionId', title: 'Notion ID', type: 'string', hidden: true}),
  ],
})
