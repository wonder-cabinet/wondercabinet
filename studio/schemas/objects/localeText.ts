import {defineType, defineField} from 'sanity'

export const localeText = defineType({
  name: 'localeText',
  title: 'Localized text',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'text'}),
    defineField({name: 'ar', title: 'Arabic', type: 'text'}),
  ],
})
