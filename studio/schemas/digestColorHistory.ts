import {defineType, defineField, defineArrayMember} from 'sanity'

// Singleton, auto-populated document -- not something anyone fills in by
// hand. api/generate-weekly-digest.mjs writes to it every time "Generate
// weekly digest" actually runs with a theme, and
// studio/components/DigestThemeTools.tsx reads it to offer one-click reuse
// of past weeks' color pairs next to the theme color pickers on
// weeklyIssue. Kept as plain hex strings (not the `color` object type)
// since this is just a small data cache read by a custom component, not a
// field anyone picks colors in directly.
export const digestColorHistory = defineType({
  name: 'digestColorHistory',
  title: 'Digest color history',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // no create/delete -- singleton
  preview: {
    select: {pairs: 'pairs'},
    prepare: ({pairs}: {pairs?: unknown[]}) => ({
      title: 'Digest color history',
      subtitle: `${(pairs || []).length} saved pair(s)`,
    }),
  },
  fields: [
    defineField({
      name: 'pairs',
      title: 'Used color pairs',
      description:
        "Filled in automatically whenever \"Generate weekly digest\" runs with a theme -- most recent first. Delete an entry here to remove it from the picker's suggestions.",
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pair',
          fields: [
            defineField({name: 'bg', title: 'Background', type: 'string'}),
            defineField({name: 'fg', title: 'Foreground', type: 'string'}),
          ],
          preview: {
            select: {bg: 'bg', fg: 'fg'},
            prepare: ({bg, fg}: {bg?: string; fg?: string}) => ({
              title: `${bg || '?'} / ${fg || '?'}`,
            }),
          },
        }),
      ],
    }),
  ],
})
