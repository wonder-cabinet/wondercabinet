import {defineType, defineField} from 'sanity'
import {ColorThemePicker} from '../components/ColorThemePicker'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  preview: {
    select: {
      titleEn: 'title.en',
      type: 'eventType',
      start: 'startDateTime',
      media: 'cover',
    },
    prepare({titleEn, type, start, media}) {
      const date = start
        ? new Date(start).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})
        : ''
      return {
        title: titleEn || '(Untitled)',
        subtitle: [type, date].filter(Boolean).join(' · '),
        media,
      }
    },
  },
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({
      name: 'relatedArtists',
      title: 'Artists',
      description: 'Pick from existing artists or create a new one directly.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'artist'}]}],
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title.en'},
    }),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localeString'}),
    defineField({
      name: 'eventType',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Performance', value: 'Performance'},
          {title: 'Film', value: 'Film'},
          {title: 'Radio', value: 'Radio'},
          {title: 'Class', value: 'Class'},
          {title: 'Workshop', value: 'Workshop'},
          {title: 'Reading', value: 'Reading'},
          {title: 'Opening', value: 'Opening'},
          {title: 'Bar', value: 'Bar'},
        ],
        layout: 'dropdown',
        allowCustomValue: true,
      },
    }),
    defineField({
      name: 'colorTheme',
      title: 'Colour theme (override)',
      description:
        'Optional. Overrides the default colour for this event. Leave blank to use the colour for the event\'s Type.',
      type: 'string',
      components: {input: ColorThemePicker},
    }),
    defineField({name: 'startDateTime', title: 'Start', type: 'datetime'}),
    defineField({name: 'endDateTime', title: 'End', type: 'datetime'}),
    defineField({
      name: 'filmDuration',
      title: 'Duration (minutes)',
      description: 'Runtime of the film, in minutes. Shown on the event page next to the screening time.',
      type: 'number',
      hidden: ({document}) => (document as any)?.eventType !== 'Film',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'reference',
      to: [{type: 'location'}],
    }),
    defineField({name: 'featured', title: 'Featured (fullscreen treatment)', type: 'boolean', initialValue: false}),
    defineField({name: 'recurring', title: 'Recurring', type: 'boolean', initialValue: false}),
    defineField({name: 'recurringLabel', title: 'Recurring label', type: 'localeString', description: 'e.g. "Every Tuesday"'}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: ['upcoming', 'past'], layout: 'radio'},
    }),
    defineField({name: 'registerUrl', title: 'Registration URL', type: 'url'}),
    defineField({name: 'shortDescription', title: 'Short description', type: 'localeText'}),
    defineField({name: 'body', title: 'Body', type: 'localeText'}),
    defineField({
      name: 'writeup',
      title: 'Retrospective write-up',
      type: 'localeText',
      description: 'Optional, shown for past/archive events',
    }),
    defineField({name: 'cover', title: 'Cover image', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'content',
      title: 'Rich content blocks',
      type: 'array',
      of: [
        {type: 'contentText'},
        {type: 'contentPullquote'},
        {type: 'contentAudio'},
        {type: 'contentImage'},
        {type: 'contentVideo'},
        {type: 'contentGallery'},
        {type: 'contentDivider'},
      ],
    }),
    defineField({
      name: 'relatedProject',
      title: 'Related project',
      type: 'reference',
      to: [{type: 'project'}],
    }),
    defineField({
      name: 'programmeEvents',
      title: 'Programme events',
      description: 'For exhibitions: events that are part of this exhibition\'s programme. Listed on the homepage card and inside the exhibition page.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'event'}]}],
      hidden: ({document}) => (document as any)?.eventType !== 'Exhibition',
    }),
    defineField({name: 'googleCalendarEventId', title: 'Google Calendar event ID', type: 'string', hidden: true}),
    defineField({name: 'notionId', title: 'Notion ID', type: 'string', hidden: true}),
  ],
  orderings: [
    {name: 'startDateDesc', title: 'Date (newest first)', by: [{field: 'startDateTime', direction: 'desc'}]},
    {name: 'startDateAsc', title: 'Date (oldest first)', by: [{field: 'startDateTime', direction: 'asc'}]},
    {name: 'eventTypeAsc', title: 'Event type', by: [{field: 'eventType', direction: 'asc'}, {field: 'startDateTime', direction: 'desc'}]},
  ],
})
