import {defineType, defineField} from 'sanity'

// Singleton — one "About Wonder Cabinet" document.
//  • shortAbout  → homepage section (between Exhibitions and Programme)
//  • longAbout   → the inside About page (separate paragraphs with a blank line)
//  • backgroundVideo → the looping video behind the homepage section
export const aboutSection = defineType({
  name: 'aboutSection',
  title: 'About Wonder Cabinet',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // no create/delete — singleton
  preview: {prepare: () => ({title: 'About Wonder Cabinet'})},
  fields: [
    defineField({
      name: 'shortAbout',
      title: 'Short about (homepage)',
      description: 'Shown on the homepage over the video, between Exhibitions and Programme. Keep it to a few lines.',
      type: 'localeText',
    }),
    defineField({
      name: 'longAbout',
      title: 'Long about (inside page)',
      description: 'Full text for the About page. Separate paragraphs with a blank line.',
      type: 'localeText',
    }),
    defineField({
      name: 'backgroundVideo',
      title: 'Homepage background video',
      description: 'Upload the short looping video here. MP4 (H.264) plays everywhere; .mov works in most browsers but MP4 is safer. Ideally 720p, under 10 MB.',
      type: 'file',
      options: {accept: 'video/mp4,video/webm,video/quicktime'},
    }),
  ],
})
