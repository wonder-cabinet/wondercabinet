import {localeString} from './objects/localeString'
import {localeText} from './objects/localeText'
import {linkItem} from './objects/linkItem'
import {
  contentText,
  contentPullquote,
  contentAudio,
  contentVideo,
  contentImage,
  contentGallery,
  contentDivider,
  contentTwoColumn,
  contentFullBleedPhoto,
  contentPoster,
} from './objects/contentBlocks'
import {event} from './event'
import {artist} from './artist'
import {project} from './project'
import {residency} from './residency'
import {artwork} from './artwork'
import {siteSettings} from './siteSettings'

export const schemaTypes = [
  // Objects
  localeString,
  localeText,
  linkItem,
  contentText,
  contentPullquote,
  contentAudio,
  contentVideo,
  contentImage,
  contentGallery,
  contentDivider,
  contentTwoColumn,
  contentFullBleedPhoto,
  contentPoster,
  // Documents
  event,
  artist,
  project,
  residency,
  artwork,
  siteSettings,
]
