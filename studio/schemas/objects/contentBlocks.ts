import {defineType, defineField} from 'sanity'

export const contentText = defineType({
  name: 'contentText',
  title: 'Text',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English paragraphs', type: 'array', of: [{type: 'text'}]}),
    defineField({name: 'ar', title: 'Arabic paragraphs', type: 'array', of: [{type: 'text'}]}),
  ],
  preview: {select: {title: 'en.0'}, prepare: ({title}) => ({title: title || 'Text block'})},
})

export const contentPullquote = defineType({
  name: 'contentPullquote',
  title: 'Pull quote',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'text'}),
    defineField({name: 'ar', title: 'Arabic', type: 'text'}),
    defineField({name: 'attribution', title: 'Attribution', type: 'string'}),
  ],
  preview: {
    select: {title: 'en', subtitle: 'attribution'},
    prepare: ({title, subtitle}) => ({title: title || 'Pull quote', subtitle}),
  },
})

export const contentAudio = defineType({
  name: 'contentAudio',
  title: 'Audio',
  type: 'object',
  fields: [
    defineField({name: 'titleEn', title: 'Title (EN)', type: 'string'}),
    defineField({name: 'titleAr', title: 'Title (AR)', type: 'string'}),
    defineField({name: 'durationMin', title: 'Duration (minutes)', type: 'number'}),
    defineField({name: 'audioFile', title: 'Audio file', type: 'file', options: {accept: 'audio/*'}}),
    defineField({name: 'externalUrl', title: 'External URL (fallback)', type: 'url'}),
  ],
  preview: {
    select: {title: 'titleEn', subtitle: 'durationMin'},
    prepare: ({title, subtitle}) => ({title: title || 'Audio', subtitle: subtitle ? `${subtitle} min` : undefined}),
  },
})

export const contentVideo = defineType({
  name: 'contentVideo',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({name: 'videoFile', title: 'Video file', type: 'file', options: {accept: 'video/*'}}),
    defineField({name: 'externalUrl', title: 'External URL (e.g. YouTube/Vimeo)', type: 'url'}),
    defineField({name: 'captionEn', title: 'Caption (EN)', type: 'string'}),
    defineField({name: 'captionAr', title: 'Caption (AR)', type: 'string'}),
  ],
  preview: {
    select: {title: 'captionEn', subtitle: 'externalUrl'},
    prepare: ({title, subtitle}) => ({title: title || 'Video', subtitle}),
  },
})

export const contentImage = defineType({
  name: 'contentImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'captionEn', title: 'Caption (EN)', type: 'string'}),
    defineField({name: 'captionAr', title: 'Caption (AR)', type: 'string'}),
  ],
  preview: {
    select: {media: 'image', title: 'captionEn'},
    prepare: ({media, title}) => ({media, title: title || 'Image'}),
  },
})

export const contentGallery = defineType({
  name: 'contentGallery',
  title: 'Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
  ],
  preview: {
    select: {media: 'images.0'},
    prepare: ({media}) => ({media, title: 'Gallery'}),
  },
})

export const contentDivider = defineType({
  name: 'contentDivider',
  title: 'Divider',
  type: 'object',
  fields: [
    defineField({name: 'note', title: 'Internal note (optional)', type: 'string'}),
  ],
  preview: {
    select: {title: 'note'},
    prepare: ({title}) => ({title: title || '— Divider —'}),
  },
})

// Project-only blocks
export const contentTwoColumn = defineType({
  name: 'contentTwoColumn',
  title: 'Two column (image + text)',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'text', title: 'Text', type: 'localeText'}),
    defineField({
      name: 'imagePosition',
      title: 'Image position',
      type: 'string',
      options: {list: ['left', 'right'], layout: 'radio'},
      initialValue: 'left',
    }),
  ],
  preview: {
    select: {media: 'image', title: 'imagePosition'},
    prepare: ({media, title}) => ({media, title: `Two column · image ${title}`}),
  },
})

export const contentFullBleedPhoto = defineType({
  name: 'contentFullBleedPhoto',
  title: 'Full-bleed photo',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'captionEn', title: 'Caption (EN)', type: 'string'}),
    defineField({name: 'captionAr', title: 'Caption (AR)', type: 'string'}),
    defineField({name: 'darkOverlay', title: 'Dark overlay caption treatment', type: 'boolean', initialValue: false}),
  ],
  preview: {
    select: {media: 'image', title: 'captionEn'},
    prepare: ({media, title}) => ({media, title: title || 'Full-bleed photo'}),
  },
})

export const contentPoster = defineType({
  name: 'contentPoster',
  title: 'Poster (full-bleed opening spread)',
  type: 'object',
  fields: [
    defineField({name: 'backgroundImage', title: 'Background image (e.g. notation/texture)', type: 'image'}),
    defineField({name: 'posterImage', title: 'Poster image', type: 'image'}),
    defineField({name: 'sideTextEn', title: 'Vertical side text (EN)', type: 'string'}),
    defineField({name: 'sideTextAr', title: 'Vertical side text (AR)', type: 'string'}),
  ],
  preview: {
    select: {media: 'posterImage', title: 'sideTextEn'},
    prepare: ({media, title}) => ({media, title: title || 'Poster'}),
  },
})
