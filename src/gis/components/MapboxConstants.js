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
export const MAPBOX_STYLES = [
  {
    titleKey: 'gis.mapbox_style_streets',
    data: 'mapbox://styles/mapbox/streets-v12',
  },
  {
    titleKey: 'gis.mapbox_style_satellite',
    data: 'mapbox://styles/mapbox/satellite-v9',
  },
  {
    titleKey: 'gis.mapbox_style_outdoors',
    data: 'mapbox://styles/mapbox/outdoors-v12',
  },
  {
    titleKey: 'gis.mapbox_style_light',
    data: 'mapbox://styles/mapbox/light-v11',
  },
  {
    titleKey: 'gis.mapbox_style_dark',
    data: 'mapbox://styles/mapbox/dark-v11',
  },
  {
    titleKey: 'gis.mapbox_style_osm',
    data: {
      name: 'osm',
      version: 8,
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
      sources: {
        'osm-raster-tiles': {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>',
        },
      },
      layers: [
        {
          id: 'osm-raster-layer',
          type: 'raster',
          source: 'osm-raster-tiles',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    },
  },
];
