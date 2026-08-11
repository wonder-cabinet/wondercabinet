import {defineType, defineField} from 'sanity'

// Each week of programming, archived as its own "issue" — like a magazine
// issue: a title/theme, a short description, the date range it covers, and
// (eventually) a cover for the archive's flip-through featured-issues view.
// Replaces the old siteSettings.monthlyTheme* fields, which overwrote the
// same two fields every time the theme changed — losing history. One
// weeklyIssue doc is auto-created per week (see scripts/calendar-sync.mjs);
// the theme title/description are left blank for an editor to fill in by
// hand in Studio.
export const weeklyIssue = defineType({
  name: 'weeklyIssue',
  title: 'Weekly Issue',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Theme title',
      description: 'Shown on the homepage next to "This week" (e.g. "Movement"). Leave blank to show no theme for this week.',
      type: 'localeString',
    }),
    defineField({
      name: 'description',
      title: 'Theme description',
      description: 'Short intro text under the theme title, framing what this week\'s programme is about.',
      type: 'localeText',
    }),
    defineField({name: 'weekStart', title: 'Week start (Monday)', type: 'date'}),
    defineField({name: 'weekEnd', title: 'Week end (Sunday)', type: 'date'}),
    defineField({
      name: 'cover',
      title: 'Issue cover',
      description: 'Shown as the ambient background behind this week\'s "This week" rail on the homepage — the intro-text sidebar and any hero card that doesn\'t already have its own video/cover image. Optional; leave blank for the normal flat background. (Also intended for a future archive flip-through view.)',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'featured',
      title: 'Featured in archive',
      description: 'Mark this issue to appear as a flip-through featured card in the future archive view. Not all weeks need to be featured — pick the ones worth spotlighting.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'events',
      title: 'Highlighted events',
      description: 'Auto-filled once with everything scheduled that week, shown as the big highlighted cards on the homepage. Remove any you don\'t want shown — the sync script won\'t add them back. To de-emphasize an event instead of hiding it, move it to "Also happening this week" below rather than deleting it here. You can also add events by hand (e.g. something that doesn\'t neatly fit a Mon–Sun week).',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'event'}]}],
    }),
    defineField({
      name: 'secondaryEvents',
      title: 'Also happening this week',
      description: 'Lower-priority events for the same week — shown in a single compact list card at the end of the "This week" row instead of a full highlighted card. Move an event here from "Highlighted events" above to de-emphasize it without removing it from the week entirely.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'event'}]}],
    }),
    defineField({
      name: 'secondaryFeaturedVideo',
      title: 'Also-happening video background',
      description: 'If more than one event in "Also happening this week" above has a video uploaded, pick which one\'s video should fill the whole list card as a shared background (the others just keep their plain rows). If only one of them has a video, it\'s used automatically and this field is ignored — only needed to break the tie when there are two or more.',
      type: 'reference',
      to: [{type: 'event'}],
    }),
    defineField({
      name: 'eventsAutoAssigned',
      title: 'Events auto-assigned',
      type: 'boolean',
      hidden: true,
      initialValue: false,
    }),
  ],
  orderings: [
    {name: 'weekStartDesc', title: 'Week (newest first)', by: [{field: 'weekStart', direction: 'desc'}]},
  ],
  preview: {
    select: {titleEn: 'title.en', weekStart: 'weekStart', weekEnd: 'weekEnd', featured: 'featured'},
    prepare: ({titleEn, weekStart, weekEnd, featured}) => ({
      title: (titleEn || '(untitled issue)') + (featured ? ' ★' : ''),
      subtitle: weekStart ? `${weekStart} → ${weekEnd || '?'}` : 'No week set',
    }),
  },
})
