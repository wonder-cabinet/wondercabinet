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
    defineField({name: 'contactEmail', title: 'Contact email', type: 'string', initialValue: 'office@wondercabinet.space'}),
    defineField({
      name: 'socialLinks',
      title: 'Social / footer links',
      type: 'array',
      of: [{type: 'linkItem'}],
    }),
  ],
})
