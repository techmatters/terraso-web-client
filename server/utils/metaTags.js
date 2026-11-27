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

const escape = require('lodash/fp/escape');

const injectMetaTags = (html, { title, description, image, canonical }) => {
  const replace = (source, pattern, tag) => source.replace(pattern, () => tag);
  let result = replace(html, /<title>[^<]*<\/title>/i, `<title>${escape(title)}</title>`);
  result = replace(result, /<meta(?=[^>]*\bproperty="og:title")[^>]*>/gi,
    `<meta property="og:title" content="${escape(title)}" data-rh="true"/>`);
  if (description) {
    result = replace(result, /<meta(?=[^>]*\bname="description")[^>]*>/gi,
      `<meta name="description" content="${escape(description)}" data-rh="true"/>`);
    result = replace(result, /<meta(?=[^>]*\bproperty="og:description")[^>]*>/gi,
      `<meta property="og:description" content="${escape(description)}" data-rh="true"/>`);
  }
  if (image) {
    result = replace(result, /<meta(?=[^>]*\bproperty="og:image")[^>]*>/gi,
      `<meta property="og:image" content="${escape(image)}" data-rh="true"/>`);
  }
  result = result.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\/?\s*>/gi, '');
  return replace(result, /<\/head>/i, `<link rel="canonical" href="${escape(canonical)}"/></head>`);
};

module.exports = { injectMetaTags };
