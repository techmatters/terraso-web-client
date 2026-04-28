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

import { Node as SlateNode } from 'slate';
import { jsx } from 'slate-hyperscript';

const HEADING_TAG = () => ({ type: 'heading-one' });

const ELEMENT_TAGS = {
  A: el => ({ type: 'link', url: el.getAttribute('href') }),
  H1: HEADING_TAG,
  H2: HEADING_TAG,
  H3: HEADING_TAG,
  H4: HEADING_TAG,
  H5: HEADING_TAG,
  H6: HEADING_TAG,
  LI: () => ({ type: 'list-item' }),
  OL: () => ({ type: 'numbered-list' }),
  P: () => ({ type: 'paragraph' }),
  UL: () => ({ type: 'bulleted-list' }),
};

const TEXT_TAGS = {
  I: () => ({ italic: true }),
  MARK: () => ({ highlight: true }),
  STRONG: () => ({ bold: true }),
};

export const serialize = nodes => {
  if (!nodes) {
    return;
  }

  if (typeof nodes === 'string') {
    return nodes;
  }

  if (!Array.isArray(nodes)) {
    return;
  }

  return nodes.map(n => SlateNode.string(n)).join(' ');
};

export const deserialize = el => {
  if (el.nodeType === Node.TEXT_NODE) {
    return el.textContent;
  } else if (el.nodeType !== Node.ELEMENT_NODE) {
    return null;
  } else if (el.nodeName === 'BR') {
    return '\n';
  }

  const { nodeName } = el;
  const parent = el;

  let children = Array.from(parent.childNodes).map(deserialize).flat();

  if (children.length === 0) {
    children = [{ text: '' }];
  }

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children);
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el);
    return jsx('element', attrs, children);
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName](el);
    return children.map(child => jsx('text', attrs, child));
  }

  return children;
};
