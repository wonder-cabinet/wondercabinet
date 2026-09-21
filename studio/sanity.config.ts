import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {structure} from './structure'
import {generateSocialAssetsAction} from './actions/generateSocialAssets'
import {generateWeeklyDigestAction} from './actions/generateWeeklyDigest'

export default defineConfig({
  name: 'wonder-cabinet',
  title: 'Wonder Cabinet',

  projectId: 'xdtj605l',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    visionTool(),              // lets you run GROQ queries directly in Studio
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Adds manual "Generate ..." actions alongside the default
    // Publish/Discard/Delete actions -- see studio/actions/generateSocialAssets.tsx
    // (per-event share image + A3 poster) and studio/actions/generateWeeklyDigest.tsx
    // (per-week 3-slide digest + combined A3 PDF).
    actions: (prev, context) => {
      if (context.schemaType === 'event') return [...prev, generateSocialAssetsAction]
      if (context.schemaType === 'weeklyIssue') return [...prev, generateWeeklyDigestAction]
      return prev
    },
  },
})
