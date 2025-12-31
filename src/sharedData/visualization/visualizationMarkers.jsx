/*
 * Copyright © 2021-2023 Technology Matters
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

import { Canvg } from 'canvg';

import { getImage } from 'terraso-web-client/gis/mapMarkers';

const DEFAULT_OPACITY = 0.5;

export const iconsSvg = ({ shape, size, color, opacity = DEFAULT_OPACITY }) =>
  ({
    circle: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="${size}px" viewBox="0 0 24 24" width="${size}px" fill="${color}"><g><rect fill="none" height="24" width="24"/></g><g><g><circle cx="12" cy="12" opacity="${opacity}" r="8"/><path d="M12,2C6.47,2,2,6.47,2,12c0,5.53,4.47,10,10,10s10-4.47,10-10C22,6.47,17.53,2,12,2z M12,20c-4.42,0-8-3.58-8-8 c0-4.42,3.58-8,8-8s8,3.58,8,8C20,16.42,16.42,20,12,20z"/></g></g></svg>`,
    square: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="${size}px" viewBox="0 0 24 24" width="${size}px" fill="${color}"><g><rect fill="none" height="24" width="24"/></g><g><g opacity="${opacity}"><rect height="14" width="14" x="5" y="5"/></g><g><path d="M3,3v18h18V3H3z M19,19H5V5h14V19z"/></g></g></svg>`,
    hexagon: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="${size}px" viewBox="0 0 24 24" width="${size}px" fill="${color}"><g><rect fill="none" height="24" width="24"/></g><g><polygon opacity="${opacity}" points="16.05,19 7.95,19 3.91,12 7.95,5 16.05,5 20.09,12"/><path d="M17.2,3H6.8l-5.2,9l5.2,9h10.4l5.2-9L17.2,3z M16.05,19H7.95l-4.04-7l4.04-7h8.09l4.04,7L16.05,19z"/></g></svg>`,
    triangle: `<svg xmlns="http://www.w3.org/2000/svg" height="${size}px" viewBox="0 0 24 24" width="${size}px" fill="${color}"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 7.77L5.61 18h12.78z" opacity="${opacity}"/><path d="M12 4L2 20h20L12 4zm0 3.77L18.39 18H5.61L12 7.77z"/></svg>`,
  })[shape];

// This function generates a PNG image data from a shape SVG with the
// defined size and color using a canvas component
export const getImageCanvas = ({ shape, size, color }) => {
  const canvas = document.createElement('canvas');

  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const svg = iconsSvg({ shape, size, color });
  const transform = Canvg.fromString(ctx, svg);

  transform.start();

  return canvas;
};
export const getImageData = ({ shape, size, color }) => {
  const canvas = getImageCanvas({ shape, size, color });

  const img = canvas.toDataURL('img/png');

  document.body.removeChild(canvas);

  return img;
};

export const getImageBlob = ({ shape, size, color }) => {
  return new Promise((resolve, reject) => {
    const canvas = getImageCanvas({ shape, size, color });
    canvas.toBlob(blob => {
      resolve(blob);
      document.body.removeChild(canvas);
    });
  });
};

export const getImageBitmap = ({ shape, size, color }) => {
  return getImageBlob({ shape, size, color }).then(blob =>
    createImageBitmap(blob)
  );
};

export const getLayerImage = ({ shape, size, color, opacity }) => {
  const svg = iconsSvg({ shape, size, color, opacity });
  return getImage({ svg, size });
};
