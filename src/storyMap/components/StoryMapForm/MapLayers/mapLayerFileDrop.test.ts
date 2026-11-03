/*
 * Copyright © 2025 Technology Matters
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

import {
  isMapLayerFileAccepted,
  mapLayerAcceptAttribute,
  mapLayerFileRejectionCode,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/mapLayerFileDrop';

import { SHARED_DATA_MAX_SIZE } from 'terraso-web-client/config';

const makeFile = (
  name: string,
  { type = '', size = 1000 }: { type?: string; size?: number } = {}
): File => ({ name, type, size }) as File;

describe('isMapLayerFileAccepted', () => {
  test('accepts a known extension (lowercase and uppercase)', () => {
    expect(isMapLayerFileAccepted(makeFile('points.geojson'))).toBe(true);
    expect(isMapLayerFileAccepted(makeFile('POINTS.GEOJSON'))).toBe(true);
    expect(isMapLayerFileAccepted(makeFile('points.CSV'))).toBe(true);
    expect(isMapLayerFileAccepted(makeFile('points.kml'))).toBe(true);
  });

  test('accepts a known MIME type even without a known extension', () => {
    expect(
      isMapLayerFileAccepted(
        makeFile('points.dat', { type: 'application/geo+json' })
      )
    ).toBe(true);
  });

  test('rejects oversized files even with a known extension/MIME', () => {
    expect(
      isMapLayerFileAccepted(
        makeFile('points.geojson', { size: SHARED_DATA_MAX_SIZE + 1 })
      )
    ).toBe(false);
    expect(
      isMapLayerFileAccepted(
        makeFile('points.geojson', {
          type: 'application/geo+json',
          size: SHARED_DATA_MAX_SIZE + 1,
        })
      )
    ).toBe(false);
  });

  test('rejects unknown extension AND unknown MIME', () => {
    expect(isMapLayerFileAccepted(makeFile('notes.txt'))).toBe(false);
    expect(
      isMapLayerFileAccepted(makeFile('notes.txt', { type: 'text/plain' }))
    ).toBe(false);
    expect(isMapLayerFileAccepted(makeFile('no-extension'))).toBe(false);
  });
});

describe('mapLayerFileRejectionCode', () => {
  test('returns the shared rejection codes', () => {
    expect(mapLayerFileRejectionCode(makeFile('points.geojson'))).toBeNull();
    expect(
      mapLayerFileRejectionCode(
        makeFile('points.geojson', { size: SHARED_DATA_MAX_SIZE + 1 })
      )
    ).toBe('file-too-large');
    expect(mapLayerFileRejectionCode(makeFile('notes.txt'))).toBe(
      'file-invalid-type'
    );
  });

  test('oversize wins over invalid type', () => {
    expect(
      mapLayerFileRejectionCode(
        makeFile('notes.txt', {
          type: 'text/plain',
          size: SHARED_DATA_MAX_SIZE + 1,
        })
      )
    ).toBe('file-too-large');
  });
});

describe('mapLayerAcceptAttribute', () => {
  test('covers both MIME types and extensions for the file picker', () => {
    expect(mapLayerAcceptAttribute).toContain('.geojson');
    expect(mapLayerAcceptAttribute).toContain('application/geo+json');
  });
});
