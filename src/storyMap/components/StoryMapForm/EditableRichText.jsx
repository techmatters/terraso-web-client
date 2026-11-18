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

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Editor } from 'slate';
import { useSlateStatic } from 'slate-react';
import { FormHelperText } from '@mui/material';

import { fragmentTextExcluding } from 'terraso-web-client/common/components/RichTextEditor/fragmentText';
import RichTextEditor from 'terraso-web-client/common/components/RichTextEditor/index';
import {
  InlineMediaCollection,
  InlineMediaToolbar,
} from 'terraso-web-client/storyMap/components/StoryMapForm/InlineMediaCollection';
import { collectInlineCollectionIds } from 'terraso-web-client/storyMap/storyMapInlineMedia';

const isInlineMediaCollection = element => element?.type === 'media-collection';

const hasCollection = node =>
  isInlineMediaCollection(node) || node.children?.some(hasCollection);

const selectionContainsCollection = editor =>
  editor?.selection &&
  Editor.fragment(editor, editor.selection).some(hasCollection);

const copyTextWithoutCollections = (event, editor) => {
  if (!selectionContainsCollection(editor)) {
    return false;
  }

  const fragment = Editor.fragment(editor, editor.selection);
  const plainText = fragmentTextExcluding(fragment, isInlineMediaCollection);
  event.preventDefault();
  event.clipboardData.setData('text/plain', plainText);
  return true;
};

const renderInlineMediaElement = (elementProps, chapter, onCollectionChange) =>
  isInlineMediaCollection(elementProps.element) ? (
    <InlineMediaCollection
      {...elementProps}
      chapter={chapter}
      onCollectionChange={onCollectionChange}
    />
  ) : null;

const CaptureEditor = ({ editorRef }) => {
  editorRef.current = useSlateStatic();
  return null;
};

// onCollectionChange is required when the chapter contains media collections;
// omitting it also disables insertion of new collections.
const EditableRichText = props => {
  const { t } = useTranslation();
  const [editorNotice, setEditorNotice] = useState('');
  const editorRef = useRef(null);
  const {
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    chapter,
    onCollectionChange,
  } = props;
  const editorValue = useMemo(() => {
    if (Array.isArray(value) && isInlineMediaCollection(value.at(-1))) {
      return [...value, { type: 'paragraph', children: [{ text: '' }] }];
    }
    return value;
  }, [value]);
  const previousCollections = useRef(collectInlineCollectionIds(value));
  const deletedCollections = useRef(new Set());
  const onDescriptionChange = nextValue => {
    const nextCollections = collectInlineCollectionIds(nextValue);
    const removed = [...previousCollections.current].filter(
      id => !nextCollections.has(id)
    );
    const restored = [...nextCollections].some(
      id =>
        !previousCollections.current.has(id) &&
        deletedCollections.current.has(id)
    );
    previousCollections.current = nextCollections;
    onChange(nextValue);
    removed.forEach(id => deletedCollections.current.add(id));
    if (restored) {
      setEditorNotice(t('storyMap.inline_media_undo_empty'));
    }
  };

  const renderCustomElement = useCallback(
    elementProps =>
      renderInlineMediaElement(elementProps, chapter, onCollectionChange),
    [chapter, onCollectionChange]
  );

  const onCopy = (event, editor) => {
    if (copyTextWithoutCollections(event, editor)) {
      setEditorNotice(t('storyMap.inline_media_copy_text_only'));
    }
  };
  const onCut = (event, editor) => {
    if (copyTextWithoutCollections(event, editor)) {
      setEditorNotice(t('storyMap.inline_media_cut_blocked'));
    }
  };

  const onDragStartCapture = event => {
    const target = event.target;
    if (
      !target.closest('[data-slate-editor="true"]') ||
      target.closest('[contenteditable="false"]')
    ) {
      return;
    }
    if (selectionContainsCollection(editorRef.current)) {
      event.preventDefault();
      event.stopPropagation();
      setEditorNotice(t('storyMap.inline_media_drag_blocked'));
    }
  };

  return (
    <div onDragStartCapture={onDragStartCapture}>
      <RichTextEditor
        addContainer
        containerSx={{ bgcolor: 'transparent', color: 'inherit' }}
        label={label}
        onBlur={onBlur}
        placeholder={placeholder}
        value={editorValue}
        onChange={onDescriptionChange}
        onCopy={onCopy}
        onCut={onCut}
        isCustomVoidElement={isInlineMediaCollection}
        renderCustomElement={renderCustomElement}
        customToolbar={
          <>
            <CaptureEditor editorRef={editorRef} />
            {onCollectionChange && <InlineMediaToolbar />}
          </>
        }
      />
      {editorNotice && (
        <FormHelperText role="status">{editorNotice}</FormHelperText>
      )}
    </div>
  );
};

export default EditableRichText;
