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

const escape = require('lodash/fp/escape');

const escapeAttributeValue = str => {
  if (!str) {
    return '';
  }
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

const REGEX = {
  ogTitle: /<meta property="og:title" content="[^"]*" data-rh="true"\s*\/?>/g,
  ogDescription:
    /<meta property="og:description" content="[^"]*" data-rh="true"\s*\/?>/g,
  ogImage: /<meta property="og:image" content="[^"]*" data-rh="true"\s*\/?>/g,
  description:
    /<meta name="description" content="[^"]*" data-rh="true"\s*\/?>/g,
  title: /<title>[^<]*<\/title>/,
};

const createReplacer = (regex, template) => value => html =>
  value ? html.replace(regex, template(value)) : html;

const replaceOgTitle = createReplacer(
  REGEX.ogTitle,
  title =>
    `<meta property="og:title" content="${escape(title)}" data-rh="true"/>`
);

const replaceTitle = createReplacer(
  REGEX.title,
  title => `<title>${escape(title)}</title>`
);

const replaceOgDescription = createReplacer(
  REGEX.ogDescription,
  desc =>
    `<meta property="og:description" content="${escape(desc)}" data-rh="true"/>`
);

const replaceDescription = createReplacer(
  REGEX.description,
  desc => `<meta name="description" content="${escape(desc)}" data-rh="true"/>`
);

const replaceOgImage = createReplacer(
  REGEX.ogImage,
  img =>
    `<meta property="og:image" content="${escapeAttributeValue(img)}" data-rh="true"/>`
);

const injectMetaTags = (html, metaTags) => {
  const { title, description, image } = metaTags;

  const transformations = [
    replaceOgTitle(title),
    replaceTitle(title),
    replaceOgDescription(description),
    replaceDescription(description),
    replaceOgImage(image),
  ];

  return transformations.reduce((acc, fn) => fn(acc), html);
};

module.exports = { injectMetaTags };
