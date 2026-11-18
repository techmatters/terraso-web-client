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

export const fragmentTextExcluding = (fragment, exclude) => {
  const text = node => {
    if (!node || typeof node !== 'object' || exclude(node)) {
      return '';
    }
    if (typeof node.text === 'string') {
      return node.text;
    }
    return Array.isArray(node.children) ? node.children.map(text).join('') : '';
  };

  return fragment
    .filter(node => !exclude(node))
    .map(text)
    .join('\n');
};
