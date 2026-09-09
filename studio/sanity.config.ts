import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {structure} from './structure'
import {generateSocialAssetsAction} from './actions/generateSocialAssets'

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
    // Adds a manual "Generate poster + social" action to event documents,
    // alongside the default Publish/Discard/Delete actions -- see
    // studio/actions/generateSocialAssets.tsx.
    actions: (prev, context) =>
      context.schemaType === 'event' ? [...prev, generateSocialAssetsAction] : prev,
  },
})
