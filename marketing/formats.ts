export type FormatName =
  | 'instagram-feed'
  | 'instagram-story'
  | 'linkedin'
  | 'x';

export type Format = {width: number; height: number};

export const FORMATS: Record<FormatName, Format> = {
  'instagram-feed': {width: 1080, height: 1350},
  'instagram-story': {width: 1080, height: 1920},
  linkedin: {width: 1200, height: 627},
  x: {width: 1600, height: 900},
};
