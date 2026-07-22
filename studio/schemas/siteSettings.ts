import {defineType, defineField} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // no create/delete — singleton
  preview: {
    select: {title: 'title'},
    prepare: () => ({title: 'Site Settings'}),
  },
  fields: [
    defineField({name: 'title', title: 'Internal label', type: 'string', initialValue: 'Site Settings'}),
    defineField({name: 'themeBg', title: 'Theme: Background', type: 'string', description: 'Hex color, e.g. #f6f3ea', initialValue: '#f6f3ea'}),
    defineField({name: 'themeInk', title: 'Theme: Ink (text/lines)', type: 'string', initialValue: '#1d24ff'}),
    defineField({name: 'themeHighlight', title: 'Theme: Highlight accent', type: 'string', initialValue: '#ffe65c'}),
    defineField({name: 'themePaper', title: 'Theme: Paper (panel bg)', type: 'string', initialValue: '#f6f3ea'}),
    defineField({name: 'themeRule', title: 'Theme: Rule (borders/lines)', type: 'string', initialValue: '#1d24ff'}),
    defineField({
      name: 'ogImage',
      title: 'Share image (OG / WhatsApp)',
      description: 'Image shown when the site is shared on WhatsApp, Instagram, etc. Recommended: 1200×630px.',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({name: 'contactEmail', title: 'Contact email', type: 'string', initialValue: 'office@wondercabinet.space'}),
    defineField({
      name: 'address',
      title: 'Address',
      description: 'Physical address shown in the footer.',
      type: 'localeText',
    }),
    defineField({
      name: 'hours',
      title: 'Opening hours',
      description: 'e.g. "Every day · 9:00 – 23:00"',
      type: 'localeString',
    }),
    defineField({
      name: 'mapsUrl',
      title: 'Google Maps link',
      type: 'url',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social / footer links',
      type: 'array',
      of: [{type: 'linkItem'}],
    }),
  ],
})
