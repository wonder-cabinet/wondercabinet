import {defineType, defineField} from 'sanity'

export const barMenuItem = defineType({
  name: 'barMenuItem',
  title: 'Bar Menu Item',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'localeString'}),
    defineField({name: 'description', title: 'Description', type: 'localeString'}),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {list: ['food', 'wineGlass', 'wineBottle']},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      description: 'e.g. "Small Plate" for food, or the winery/region name for wine',
    }),
    defineField({name: 'region', title: 'Region', type: 'string', description: 'e.g. Bethlehem, Taybeh, Iqrit'}),
    defineField({name: 'price', title: 'Price', type: 'number'}),
    defineField({name: 'sortOrder', title: 'Sort Order', type: 'number'}),
    defineField({name: 'available', title: 'Available', type: 'boolean', initialValue: true}),
  ],
  preview: {
    select: {title: 'name.en', subtitle: 'category'},
  },
})

export const barSettings = defineType({
  name: 'barSettings',
  title: 'The Bar — Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({name: 'heroHeadline', title: 'Hero Headline', type: 'localeString'}),
    defineField({name: 'heroBody', title: 'Hero Body', type: 'localeText'}),
    defineField({
      name: 'narrative',
      title: 'About text',
      description: 'Shown in the "about" section under the hero. Separate paragraphs with a blank line.',
      type: 'localeText',
    }),
    defineField({
      name: 'hours',
      title: 'Weekly Hours',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'dayHours',
          fields: [
            defineField({name: 'day', title: 'Day', type: 'string', options: {list: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}}),
            defineField({name: 'closed', title: 'Closed', type: 'boolean', initialValue: false}),
            defineField({name: 'open', title: 'Opens', type: 'string', description: '24h, e.g. 16:00'}),
            defineField({name: 'close', title: 'Closes', type: 'string', description: '24h, e.g. 00:00'}),
          ],
        },
      ],
    }),
  ],
})
