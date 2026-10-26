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
      description: 'Pick from the list, or just type a new one — anything you type here becomes a usable type immediately, no developer needed. New types show up in the homepage filter bar automatically, but won\'t have a custom color until one is added in code (they\'ll use a default color until then).',
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
          {title: 'Open Studio', value: 'Open Studio'},
          {title: 'Exhibition', value: 'Exhibition'},
        ],
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
    defineField({name: 'featured', title: 'Featured (fullscreen treatment)', type: 'boolean', initialValue: false, description: 'Shows a "Featured" tag in the Programme timeline, and also force-includes this event in the homepage\'s "This week" highlighted cards for its own week — even if it was added after that week\'s auto-assign already ran.'}),
    defineField({
      name: 'neverHighlighted',
      title: 'Never show in "This week" highlights',
      description: 'For a standing weekly fixture (e.g. the Yoga class) that shouldn\'t take up a big hero card every single week. It still shows normally in the Programme timeline — this only keeps it out of the homepage "This week" highlighted cards and out of auto-assign\'s weekly picks, permanently.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'featuredUpcoming',
      title: 'Feature on homepage ("Coming up")',
      description: 'Shows this event as a full card on the homepage, right after "This week", under a "Coming up" divider. Meant for selected events outside Wonder Cabinet, such as performances abroad that Wonder Cabinet produces. The card shows the Location, so set it (e.g. "Le Guess Who?, Utrecht"). Ordered by date, up to 6, and drops off automatically once the event is over.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'timezone',
      title: 'Time zone (events outside Bethlehem)',
      description: 'Where the event takes place, so the time shows as local venue time (e.g. 20:00 in Utrecht) for every visitor. Leave empty for events in Bethlehem. Pick from the list or type any IANA name.',
      type: 'string',
      options: {
        list: [
          {title: 'Bethlehem / Palestine', value: 'Asia/Hebron'},
          {title: 'Amman (Jordan)', value: 'Asia/Amman'},
          {title: 'Utrecht / Amsterdam', value: 'Europe/Amsterdam'},
          {title: 'Ghent / Brussels', value: 'Europe/Brussels'},
          {title: 'Assisi / Rome', value: 'Europe/Rome'},
          {title: 'Paris', value: 'Europe/Paris'},
          {title: 'Berlin', value: 'Europe/Berlin'},
          {title: 'Zurich', value: 'Europe/Zurich'},
          {title: 'London', value: 'Europe/London'},
        ],
        allowCustomValue: true,
      },
    }),
    defineField({name: 'recurring', title: 'Recurring', type: 'boolean', initialValue: false}),
    defineField({name: 'recurringLabel', title: 'Recurring label', type: 'localeString', description: 'e.g. "Every Tuesday"'}),
    defineField({
      name: 'recurringBaseTitle',
      title: 'Default title (recurring)',
      description: 'Only used for recurring events (and for "each occurrence is its own episode" shows, where new episodes are created with this title). The show\'s generic name (e.g. "NTS x Wonder Cabinet"), with no specific guest/episode in it. Every time the calendar sync advances this event to its next occurrence, the Title field above is automatically reset back to this — so a guest name you added for one episode doesn\'t linger on the listing after that episode has aired. Set this once; then edit Title by hand for each upcoming episode\'s guest as it\'s confirmed.',
      type: 'localeString',
      hidden: ({document}) => !((document as any)?.recurring || (document as any)?.separateEpisodes),
    }),
    defineField({
      name: 'separateEpisodes',
      title: 'Each occurrence is its own episode',
      description:
        "For a recurring show where every date has different content (e.g. NTS x Wonder Cabinet — a new guest each time). Tick this and the calendar sync stops moving this one event from date to date. This event stays as its current episode, and a separate event is created for each of the next few dates — each with its own title, image, artists and text, which the sync never changes or resets. Past episodes stay on the site as normal past events. To skip an episode, delete its event: it won't be recreated.",
      type: 'boolean',
      initialValue: false,
      hidden: ({document}) => !((document as any)?.recurring || (document as any)?.separateEpisodes),
    }),
    defineField({
      name: 'episodeIdsCreated',
      title: 'Episodes created by the calendar sync',
      type: 'array',
      of: [{type: 'string'}],
      hidden: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: ['upcoming', 'past'], layout: 'radio'},
    }),
    defineField({
      name: 'registerUrl',
      title: 'Registration URL',
      description: 'For free events that still need an RSVP. Shows a "Register" tag/link on listings — takes priority over Admission below.',
      type: 'url',
    }),
    defineField({
      name: 'admissionType',
      title: 'Admission',
      description:
        'Controls the small tag shown on event listings (top right of each Programme row). Leave blank to show no tag at all. Ignored if a Registration URL is set above (that always shows "Register" instead).',
      type: 'string',
      options: {list: [{title: 'Free entry', value: 'free'}, {title: 'Ticketed', value: 'ticketed'}], layout: 'radio'},
    }),
    defineField({
      name: 'ticketsUrl',
      title: 'Tickets URL',
      description: 'Where people can buy a ticket. Shown as a clickable "Tickets" tag/link on listings instead of plain "Ticketed" text.',
      type: 'url',
      hidden: ({document}) => (document as any)?.admissionType !== 'ticketed',
    }),
    defineField({
      name: 'streamChannel',
      title: 'Live stream channel',
      description:
        'For radio episodes and listening sessions that stream live from an external station. Pick one from the Stream Channels list — its URL is what the Play button connects to. Need a station that isn\'t listed yet, or a URL that changed? Add/edit it under "Stream Channels" in the sidebar; no code change needed. Not tied to the event Type field, since not every radio/listening-session event is reliably tagged that way.',
      type: 'reference',
      to: [{type: 'streamChannel'}],
    }),
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
    // Internal bookkeeping for scripts/calendar-sync.mjs — the calendar
    // title/description text as of the last sync run, NOT the current
    // Studio value. Lets the sync tell "the calendar changed" apart from
    // "an editor hand-edited this in Studio" (both look like "differs from
    // the calendar" otherwise) so a hand edit never gets silently reverted
    // on the next hourly run. Never edit these by hand.
    defineField({name: 'calendarSyncTitleEn', title: 'Calendar sync: last title (EN)', type: 'string', hidden: true}),
    defineField({name: 'calendarSyncTitleAr', title: 'Calendar sync: last title (AR)', type: 'string', hidden: true}),
    defineField({name: 'calendarSyncBodyEn', title: 'Calendar sync: last body (EN)', type: 'text', hidden: true}),
    defineField({name: 'calendarSyncBodyAr', title: 'Calendar sync: last body (AR)', type: 'text', hidden: true}),
  ],
  orderings: [
    {name: 'startDateDesc', title: 'Date (newest first)', by: [{field: 'startDateTime', direction: 'desc'}]},
    {name: 'startDateAsc', title: 'Date (oldest first)', by: [{field: 'startDateTime', direction: 'asc'}]},
    {name: 'eventTypeAsc', title: 'Event type', by: [{field: 'eventType', direction: 'asc'}, {field: 'startDateTime', direction: 'desc'}]},
  ],
})
