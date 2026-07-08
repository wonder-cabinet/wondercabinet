import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {structure} from './structure'

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
})
