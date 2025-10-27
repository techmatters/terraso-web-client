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

const replaceMetaTag = (property, content) => html =>
  html.replace(
    new RegExp(
      `<meta property="${property}" content="[^"]*" data-rh="true"\\s*\\/?>`,
      'g'
    ),
    `<meta property="${property}" content="${content}" data-rh="true"/>`
  );

const replaceNameTag = (name, content) => html =>
  html.replace(
    new RegExp(
      `<meta name="${name}" content="[^"]*" data-rh="true"\\s*\\/?>`,
      'g'
    ),
    `<meta name="${name}" content="${content}" data-rh="true"/>`
  );

const insertMetaTag = (property, content) => html =>
  html.replace(
    /(<meta property="og:title" content="[^"]*" data-rh="true"\s*\/?>)/,
    `$1<meta property="${property}" content="${content}" data-rh="true"/>`
  );

const replaceTitle = title => html =>
  html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

const handleOgUrl = url => html =>
  html.includes('property="og:url"')
    ? replaceMetaTag('og:url', url)(html)
    : insertMetaTag('og:url', url)(html);

const isDefined = value => value !== null && value !== undefined;

const injectMetaTags = (html, metaTags) => {
  const { title, description, image, url } = metaTags;

  const transformations = [
    isDefined(title) && replaceMetaTag('og:title', title),
    isDefined(description) && replaceMetaTag('og:description', description),
    isDefined(image) && replaceMetaTag('og:image', image),
    isDefined(url) && handleOgUrl(url),
    isDefined(title) && replaceTitle(title),
    isDefined(description) && replaceNameTag('description', description),
  ].filter(Boolean);

  return transformations.reduce((acc, fn) => fn(acc), html);
};

module.exports = { injectMetaTags };
