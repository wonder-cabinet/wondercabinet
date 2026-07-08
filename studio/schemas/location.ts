import {defineType, defineField} from 'sanity'

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  preview: {
    select: {title: 'name', subtitle: 'description'},
  },
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'string', description: 'Optional note, e.g. "Ground floor, main entrance"'}),
  ],
})
