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

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Editor, Path, Transforms } from 'slate';
import { ReactEditor, useSlate, useSlateStatic } from 'slate-react';
import { v4 as uuidv4 } from 'uuid';
import CollectionsIcon from '@mui/icons-material/Collections';
import { Button, Tooltip } from '@mui/material';

import EditableMedia from 'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia';
import { inlineCollectionItems } from 'terraso-web-client/storyMap/storyMapInlineMedia';

export const InlineMediaToolbar = () => {
  const { t } = useTranslation();
  const editor = useSlate();
  const label = t('storyMap.inline_media_insert');

  const insertCollection = () => {
    if (!editor.selection) {
      Transforms.select(editor, Editor.end(editor, []));
    }
    const collectionId = uuidv4();
    Transforms.insertNodes(editor, {
      type: 'media-collection',
      collectionId,
      presentation: 'carousel',
      children: [{ text: '' }],
    });
    const [, collectionPath] = Editor.nodes(editor, {
      at: [],
      match: node => node.collectionId === collectionId,
    }).next().value;
    const nextPath = Path.next(collectionPath);
    if (
      !Editor.hasPath(editor, nextPath) ||
      Editor.isVoid(editor, Editor.node(editor, nextPath)[0])
    ) {
      Transforms.insertNodes(
        editor,
        { type: 'paragraph', children: [{ text: '' }] },
        { at: nextPath }
      );
    }
    Transforms.select(editor, Editor.start(editor, nextPath));
    ReactEditor.focus(editor);
  };

  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        onMouseDown={event => event.preventDefault()}
        onClick={insertCollection}
      >
        <CollectionsIcon />
      </Button>
    </Tooltip>
  );
};

export const InlineMediaCollection = ({
  attributes,
  children,
  element,
  chapter,
  onCollectionChange,
}) => {
  const { t } = useTranslation();
  const editor = useSlateStatic();
  const currentElement = useRef(element);
  const active = useRef(true);
  currentElement.current = element;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const currentPath = () => {
    if (!active.current) {
      return null;
    }
    try {
      return ReactEditor.findPath(editor, currentElement.current);
    } catch {
      return null;
    }
  };

  return (
    <div {...attributes} data-story-map-media-collection>
      <div contentEditable={false}>
        <EditableMedia
          collectionAction={compact => (
            <Button
              size={compact ? 'small' : 'medium'}
              variant="outlined"
              onClick={() => {
                const path = currentPath();
                if (path) {
                  Transforms.removeNodes(editor, { at: path });
                }
              }}
            >
              {t('storyMap.inline_media_delete')}
            </Button>
          )}
          maxItems={5}
          value={inlineCollectionItems(chapter, element.collectionId)}
          onChange={items => {
            if (currentPath()) {
              onCollectionChange(element.collectionId, items);
            }
          }}
          presentation={element.presentation || 'carousel'}
          onPresentationChange={presentation => {
            const path = currentPath();
            if (path) {
              Transforms.setNodes(editor, { presentation }, { at: path });
            }
          }}
        />
      </div>
      {children}
    </div>
  );
};
