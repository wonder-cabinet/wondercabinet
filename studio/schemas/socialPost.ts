import {defineType, defineField} from 'sanity'

// Auto-generated whenever an `event` document is published (see
// api/social-post-webhook.mjs). This is deliberately a "generate, never
// auto-send" workflow: the webhook creates one of these per event with a
// draft Instagram caption, WhatsApp message, newsletter blurb, and a branded
// share image, all sitting here for a human to review, edit, and copy/send
// by hand to each channel. Nothing on this document ever posts anywhere by
// itself — `status` is just a personal checklist for the editor.
export const socialPost = defineType({
  name: 'socialPost',
  title: 'Social Post',
  type: 'document',
  preview: {
    select: {
      titleEn: 'event.title.en',
      status: 'status',
      media: 'shareImage',
    },
    prepare({titleEn, status, media}) {
      return {
        title: titleEn || '(untitled event)',
        subtitle: status || 'Ready to send',
        media,
      }
    },
  },
  fields: [
    defineField({
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{type: 'event'}],
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: ['Ready to send', 'Sent'], layout: 'radio'},
      initialValue: 'Ready to send',
    }),
    defineField({
      name: 'shareImage',
      title: 'Share image',
      description: 'Auto-generated square image (1080×1080), branded to match the event\'s type color. Download and attach to Instagram/WhatsApp.',
      type: 'image',
      readOnly: true,
    }),
    defineField({
      name: 'instagramCaption',
      title: 'Instagram caption',
      type: 'localeText',
    }),
    defineField({
      name: 'whatsappMessage',
      title: 'WhatsApp message',
      type: 'localeText',
    }),
    defineField({
      name: 'newsletterBlurb',
      title: 'Newsletter blurb',
      type: 'localeText',
    }),
    defineField({name: 'generatedAt', title: 'Generated at', type: 'datetime', readOnly: true}),
  ],
  orderings: [
    {name: 'generatedAtDesc', title: 'Newest first', by: [{field: 'generatedAt', direction: 'desc'}]},
  ],
})
