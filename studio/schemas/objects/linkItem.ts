import {defineType, defineField} from 'sanity'

export const linkItem = defineType({
  name: 'linkItem',
  title: 'Link Item',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string'}),
    defineField({name: 'url', title: 'URL', type: 'url'}),
  ],
  preview: {
    select: {title: 'label', subtitle: 'url'},
  },
})
