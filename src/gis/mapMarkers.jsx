/*
 * Copyright © 2023 Technology Matters
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

import theme from 'terraso-web-client/theme';

const generateMarkerSvg = ({ color, size }) =>
  `<svg height="${size}" width="${size}" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 0C3.13 0 0 3.13 0 7c0 1.74.5 3.37 1.41 4.84.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26C6 19.05 6.21 20 7 20s1-.95 1.25-1.5c.37-.81.7-1.51 1.17-2.26.96-1.53 2.21-2.85 3.16-4.4C13.5 10.37 14 8.74 14 7c0-3.87-3.13-7-7-7Zm0 9.75a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5Z" fill="${color}"/></svg>`;

export const getImage = ({ svg, size }) =>
  new Promise((resolve, reject) => {
    let img = new Image(size, size);
    img.onload = () => resolve(img);
    const base64 = btoa(svg);
    img.src = `data:image/svg+xml;base64,${base64}`;
  });

export const getMarkerImage = ({ size, color }) => {
  const svg = generateMarkerSvg({ size, color });
  return getImage({ svg, size });
};

const getMarkerImageData = ({ size, color }) => {
  const svg = generateMarkerSvg({
    color,
    size,
  });
  const encodedSVG = encodeURIComponent(svg);
  return `data:image/svg+xml;utf8,${encodedSVG}`;
};

export const MARKER_CONTROL_ICON = getMarkerImageData({
  color: theme.palette.map.markerControl,
  size: 20,
});
