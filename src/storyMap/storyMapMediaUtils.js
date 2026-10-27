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

export const calculateMediaCropStyle = (
  crop,
  { naturalWidth, naturalHeight },
  aspectRatio
) => {
  const imageAspectRatio = naturalWidth / naturalHeight;
  const scaledWidth = Math.max(1, imageAspectRatio / aspectRatio) * crop.scale;
  const scaledHeight = Math.max(1, aspectRatio / imageAspectRatio) * crop.scale;
  const cropWidth = 1 / scaledWidth;
  const cropHeight = 1 / scaledHeight;
  const allowOutside = cropWidth > 1 || cropHeight > 1;
  const offsetAxis = (center, cropSize, scaledSize) => {
    const cropStart = Math.max(
      allowOutside ? -cropSize : 0,
      Math.min(center - cropSize / 2, allowOutside ? 1 : 1 - cropSize)
    );
    return `${-cropStart * scaledSize * 100}%`;
  };
  return {
    width: `${scaledWidth * 100}%`,
    height: `${scaledHeight * 100}%`,
    left: offsetAxis(crop.position.x, cropWidth, scaledWidth),
    top: offsetAxis(crop.position.y, cropHeight, scaledHeight),
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
