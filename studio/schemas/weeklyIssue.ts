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
      description: 'For the future archive view — flip-through featured issues. Not used yet.',
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
      title: 'Events in this issue (optional override)',
      description: 'Leave empty to automatically include everything scheduled within the week range above. Only set this to hand-pick a different set (e.g. to exclude something, or to group events that don\'t neatly fit a Mon–Sun week).',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'event'}]}],
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
