import {defineType, defineField} from 'sanity'

// A reusable live radio station/channel (Radio alHara Ch.1/2, NTS Ch.1/2,
// etc) that events can reference via their "Live stream channel" field.
// Kept as its own document type (rather than a fixed dropdown baked into
// the event schema) specifically so producers can add a new station or
// fix a channel's URL themselves in Studio at any time, without needing a
// code change + redeploy — a station changing their relay URL, or a new
// station being added, shouldn't require a developer.
export const streamChannel = defineType({
  name: 'streamChannel',
  title: 'Stream Channel',
  type: 'document',
  description:
    'A live station/channel that events can stream from. Add a new one any time a new station comes up, or edit an existing one\'s URL if a station changes its stream link — every event referencing it picks up the change automatically.',
  preview: {
    select: {title: 'name', subtitle: 'streamUrl'},
  },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Shown on the Play button, e.g. "Radio alHara — Channel 1".',
    }),
    defineField({
      name: 'streamUrl',
      title: 'Stream URL',
      type: 'url',
      description:
        'Direct audio stream link (an Icecast/Shoutcast/relay .mp3 or .aac URL, not the station\'s homepage or embed-player page). This is what actually plays.',
    }),
  ],
})
