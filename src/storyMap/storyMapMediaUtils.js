import i18n from 'i18next';

export const MEDIA_ASPECT_RATIO = 16 / 9;

export const calculateMediaFitScale = ({ naturalHeight, naturalWidth }) => {
  if (!naturalHeight || !naturalWidth) {
    return 1;
  }
  const aspectRatio = naturalWidth / naturalHeight;
  return Math.min(
    aspectRatio / MEDIA_ASPECT_RATIO,
    MEDIA_ASPECT_RATIO / aspectRatio
  );
};

export const getMediaKind = media =>
  ['image', 'audio', 'video'].find(kind => media.type.startsWith(kind)) ||
  'embedded';

export const getMediaSource = (media, getMediaFile) =>
  media.signedUrl ||
  media.url ||
  (media.contentId && getMediaFile?.(media.contentId));

export const getMediaLabel = (media, index) => {
  const label = i18n.t(`storyMap.media_${getMediaKind(media)}_label`);
  return index === undefined ? label : `${label} ${index + 1}`;
};
