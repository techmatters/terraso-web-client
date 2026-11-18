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

export const MAX_MERCATOR_LAT = 85.0511287798;

/** swLng, swLat, neLng, neLat */
export type BoundsTuple = [number, number, number, number];

export type WorldShape = {
  /** West edge, as a fraction of the world */
  x0: number;
  /** East edge, as a fraction of the world */
  x1: number;
  /** North edge (Mercator y, grows south) */
  y0: number;
  /** South edge (Mercator y, grows south) */
  y1: number;
};

export const lngToX = (lng: number) =>
  ((((lng + 180) % 360) + 360) % 360) / 360;

export const xToLng = (x: number) => (((x % 1) + 1) % 1) * 360 - 180;

export const latToY = (lat: number) => {
  const clamped = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat));
  const rad = (clamped * Math.PI) / 180;
  return 0.5 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI);
};

export const yToLat = (y: number) => {
  const n = Math.PI * (1 - 2 * Math.max(0, Math.min(1, y)));
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
};

const isFiniteCoordinate = ([west, south, east, north]: BoundsTuple) =>
  [west, south, east, north].every(Number.isFinite);

export const toWorldShape = (box: BoundsTuple): WorldShape | null => {
  if (!isFiniteCoordinate(box)) {
    return null;
  }
  const [west, south, east, north] = box;
  const y0 = latToY(north);
  const y1 = latToY(south);

  // A bbox this wide is a turf artifact (antimeridian), not a real extent
  if (east - west >= 359) {
    return { x0: 0, x1: 1, y0, y1 };
  }

  const x0 = lngToX(west);
  const x1 = east >= 180 ? 1 : Math.max(x0, lngToX(east));
  return { x0, x1, y0, y1 };
};

type LngLatBoundsLike = {
  getWest(): number;
  getSouth(): number;
  getEast(): number;
  getNorth(): number;
};

export const toBoundsTuple = (bounds: LngLatBoundsLike): BoundsTuple => [
  bounds.getWest(),
  bounds.getSouth(),
  bounds.getEast(),
  bounds.getNorth(),
];
