import type {StructureBuilder} from 'sanity/structure'

const EVENT_TYPES = [
  {value: 'Film',        label: 'Film Screenings'},
  {value: 'Performance', label: 'Performances'},
  {value: 'Workshop',    label: 'Workshops'},
  {value: 'Class',       label: 'Classes'},
  {value: 'Radio',       label: 'Radio'},
  {value: 'Reading',     label: 'Readings'},
  {value: 'Opening',     label: 'Openings'},
]

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Wonder Cabinet')
    .items([
      // ── EVENTS ──────────────────────────────────────
      S.listItem()
        .title('Events')
        .child(
          S.list()
            .title('Events')
            .items([
              S.listItem()
                .title('All Events')
                .child(
                  S.documentList()
                    .title('All Events')
                    .filter('_type == "event"')
                    .defaultOrdering([{field: 'startDateTime', direction: 'desc'}])
                ),
              S.divider(),
              ...EVENT_TYPES.map(({value, label}) =>
                S.listItem()
                  .title(label)
                  .child(
                    S.documentList()
                      .title(label)
                      .filter('_type == "event" && eventType == $type')
                      .params({type: value})
                      .defaultOrdering([{field: 'startDateTime', direction: 'desc'}])
                  )
              ),
            ])
        ),

      S.divider(),

      // ── OTHER CONTENT ────────────────────────────────
      S.listItem()
        .title('Projects')
        .schemaType('project')
        .child(
          S.documentList()
            .title('Projects')
            .filter('_type == "project"')
            .defaultOrdering([{field: 'year', direction: 'desc'}])
        ),

      S.listItem()
        .title('Artists')
        .schemaType('artist')
        .child(
          S.documentList()
            .title('Artists')
            .filter('_type == "artist"')
        ),

      S.listItem()
        .title('Residencies')
        .schemaType('residency')
        .child(
          S.documentList()
            .title('Residencies')
            .filter('_type == "residency"')
            .defaultOrdering([{field: 'year', direction: 'desc'}])
        ),

      S.listItem()
        .title('Artworks')
        .schemaType('artwork')
        .child(
          S.documentList()
            .title('Artworks')
            .filter('_type == "artwork"')
            .defaultOrdering([{field: 'year', direction: 'desc'}])
        ),

      S.listItem()
        .title('Locations')
        .schemaType('location')
        .child(
          S.documentList()
            .title('Locations')
            .filter('_type == "location"')
        ),

      S.divider(),

      // ── SETTINGS (singleton) ─────────────────────────
      S.listItem()
        .title('Site Settings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
    ])
