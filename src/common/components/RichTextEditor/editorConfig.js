/*
 * Copyright © 2021-2023 Technology Matters
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
  createEditor,
  Editor,
  Range,
  Element as SlateElement,
  Transforms,
} from 'slate';
import { withHistory } from 'slate-history';
import { withReact } from 'slate-react';

import { isUrl, transformURL } from 'common/utils';

import { deserialize } from './utils';

const isLinkActive = editor => {
  const [link] = Editor.nodes(editor, {
    match: n =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
  return !!link;
};

const unwrapLink = editor => {
  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
};

const wrapLinkPartial = editor => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  return (url, text) => {
    Transforms.select(editor, selection);
    const isCollapsed = selection && Range.isCollapsed(selection);
    const link = {
      type: 'link',
      url,
      children: isCollapsed ? [{ text: text || url }] : [],
    };

    if (isCollapsed) {
      Transforms.insertNodes(editor, link);
    } else {
      Transforms.wrapNodes(editor, link, { split: true });
      Transforms.collapse(editor, { edge: 'end' });
    }
  };
};

const withInlines = editor => {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = element =>
    ['link'].includes(element.type) || isInline(element);

  editor.insertText = text => {
    if (text && isUrl(text)) {
      wrapLinkPartial(editor)(transformURL(text), text);
    } else {
      insertText(text);
    }
  };

  editor.insertData = data => {
    const html = data.getData('text/html');

    if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const fragment = deserialize(parsed.body);
      Transforms.insertFragment(editor, fragment);
      return;
    }

    insertData(data);
  };

  return editor;
};

// Create editor factory function to avoid recreating on every render
export const createRichTextEditor = () => {
  return withInlines(withHistory(withReact(createEditor())));
};

export { isLinkActive, unwrapLink, wrapLinkPartial };
