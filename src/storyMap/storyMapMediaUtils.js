/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import i18n from 'i18next';

export const MEDIA_ASPECT_RATIO = 16 / 9;
export const MAX_CHAPTER_MEDIA_ITEMS = 6;

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

export const calculateMediaCropGeometry = (
  crop,
  { naturalWidth, naturalHeight },
  aspectRatio = MEDIA_ASPECT_RATIO
) => {
  const imageAspectRatio = naturalWidth / naturalHeight;
  const scaledWidth = Math.max(1, imageAspectRatio / aspectRatio) * crop.scale;
  const scaledHeight = Math.max(1, aspectRatio / imageAspectRatio) * crop.scale;
  const boundCenter = (center, scaledSize) =>
    scaledSize <= 1
      ? 0.5
      : Math.max(
          1 / (2 * scaledSize),
          Math.min(center, 1 - 1 / (2 * scaledSize))
        );
  return {
    scaledWidth,
    scaledHeight,
    position: {
      x: boundCenter(crop.position.x, scaledWidth),
      y: boundCenter(crop.position.y, scaledHeight),
    },
  };
};

export const calculateMediaCropStyle = (crop, imageSize, aspectRatio) => {
  const { scaledWidth, scaledHeight, position } = calculateMediaCropGeometry(
    crop,
    imageSize,
    aspectRatio
  );
  const offsetAxis = (center, scaledSize) =>
    `${(0.5 - center * scaledSize) * 100}%`;
  return {
    width: `${scaledWidth * 100}%`,
    height: `${scaledHeight * 100}%`,
    left: offsetAxis(position.x, scaledWidth),
    top: offsetAxis(position.y, scaledHeight),
  };
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
