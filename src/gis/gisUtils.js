export const isValidLatitude = lat => lat >= -90 && lat <= 90;
export const isValidLongitude = lng => lng >= -180 && lng <= 180;

// From: https://gis.stackexchange.com/a/303362
export const normalizeLongitude = lng => (((lng % 360) + 540) % 360) - 180;
