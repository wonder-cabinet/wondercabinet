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
import {location} from './location'
import {event} from './event'
import {artist} from './artist'
import {project} from './project'
import {residency} from './residency'
import {artwork} from './artwork'
import {siteSettings} from './siteSettings'
import {weeklyIssue} from './weeklyIssue'
import {socialPost} from './socialPost'
import {streamChannel} from './streamChannel'

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
  location,
  event,
  artist,
  project,
  residency,
  artwork,
  siteSettings,
  weeklyIssue,
  socialPost,
  streamChannel,
]
