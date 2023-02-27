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
import React, { useCallback, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';
import {
  Editor,
  Range,
  Element as SlateElement,
  Transforms,
  createEditor,
} from 'slate';
import { withHistory } from 'slate-history';
import { jsx } from 'slate-hyperscript';
import { Editable, Slate, useSelected, useSlate, withReact } from 'slate-react';

import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {
  Tooltip as BaseTooltip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  OutlinedInput,
  Paper,
} from '@mui/material';

import { URL_SCHEMA, isUrl, transformURL } from 'common/utils';

import { withProps } from 'react-hoc';

import ExternalLink from '../ExternalLink';
import Toolbar from './Toolbar';

import theme from 'theme';

// Sample value:
// const initialValue = [
//   {
//     type: 'paragraph',
//     children: [
//       {
//         text: 'In addition to block nodes, you can create inline nodes. Here is a ',
//       },
//       {
//         type: 'link',
//         url: 'https://en.wikipedia.org/wiki/Hypertext',
//         children: [{ text: 'hyperlink' }],
//       },
//       {
//         text: ', and here is a more unusual inline: an ',
//       },
//       {
//         text: '!',
//       },
//     ],
//   },
//   {
//     type: 'paragraph',
//     children: [
//       {
//         text: 'There are two ways to add links. You can either add a link via the toolbar icon above, or if you want in on a little secret, copy a URL to your keyboard and paste it while a range of text is selected. ',
//       },
//       // The following is an example of an inline at the end of a block.
//       // This is an edge case that can cause issues.
//       {
//         type: 'link',
//         url: 'https://twitter.com/JustMissEmma/status/1448679899531726852',
//         children: [{ text: 'Finally, here is our favorite dog video.' }],
//       },
//       { text: '' },
//     ],
//   },
// ];
const FORMAT_WRAPPERS = {
  bold: 'strong',
  italic: 'em',
};

const ELEMENT_TAGS = {
  A: el => ({ type: 'link', url: el.getAttribute('href') }),
  H1: () => ({ type: 'heading-one' }),
  H2: () => ({ type: 'heading-two' }),
  H3: () => ({ type: 'heading-three' }),
  H4: () => ({ type: 'heading-four' }),
  H5: () => ({ type: 'heading-five' }),
  H6: () => ({ type: 'heading-six' }),
  LI: () => ({ type: 'list-item' }),
  OL: () => ({ type: 'numbered-list' }),
  P: () => ({ type: 'paragraph' }),
  UL: () => ({ type: 'bulleted-list' }),
};

const TEXT_TAGS = {
  I: () => ({ italic: true }),
  STRONG: () => ({ bold: true }),
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
  let parent = el;

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

const withInlines = editor => {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = element =>
    ['link'].includes(element.type) || isInline(element);

  editor.insertText = text => {
    if (text && isUrl(text)) {
      wrapLink(editor, transformURL(text), text);
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

const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url);
  }
};

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

const wrapLink = (editor, url, text) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
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

// Put this at the start and end of an inline component to work around this Chromium bug:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
const InlineChromiumBugfix = () => (
  <span contentEditable={false} style={{ fontSize: 0 }}>
    ${String.fromCodePoint(160) /* Non-breaking space */}
  </span>
);

const LinkComponent = ({ attributes, children, element }) => {
  const selected = useSelected();
  return (
    <ExternalLink
      href={element.url}
      linkProps={{
        ...attributes,
        style: selected ? { boxShadow: '0 0 0 3px #ddd' } : null,
      }}
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </ExternalLink>
  );
};

const Element = props => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case 'link':
      return <LinkComponent {...props} />;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>;
    case 'heading-three':
      return <h3 {...attributes}>{children}</h3>;
    case 'heading-four':
      return <h4 {...attributes}>{children}</h4>;
    case 'heading-five':
      return <h5 {...attributes}>{children}</h5>;
    case 'heading-six':
      return <h6 {...attributes}>{children}</h6>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  const Wrapper = useMemo(
    () =>
      Object.keys(FORMAT_WRAPPERS).reduce(
        (Acc, format) => {
          if (leaf[format]) {
            const Component = FORMAT_WRAPPERS[format];
            return ({ children }) => (
              <Component>
                <Acc>{children}</Acc>
              </Component>
            );
          }
          return Acc;
        },
        ({ children }) => <>{children}</>
      ),
    [leaf]
  );

  return (
    <span
      // The following is a workaround for a Chromium bug where,
      // if you have an inline element at the end of a block,
      // clicking the end of a block puts the cursor inside the inline
      // instead of inside the final {text: ''} node
      // https://github.com/ianstormtaylor/slate/issues/4704#issuecomment-1006696364
      style={leaf.text === '' ? { paddingLeft: '0.1px' } : null}
      {...attributes}
    >
      <Wrapper>{children}</Wrapper>
    </span>
  );
};

const Tooltip = withProps(BaseTooltip, {
  placement: 'top',
  PopperProps: {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, -10],
        },
      },
    ],
  },
});

const AddLinkButton = () => {
  const { t } = useTranslation();
  const editor = useSlate();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState();

  const onButtonClick = useCallback(event => {
    event.preventDefault();
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleAddLink = useCallback(() => {
    try {
      URL_SCHEMA.validateSync({ url });
      insertLink(editor, transformURL(url));
      setOpen(false);
    } catch (error) {
      setError(t(error.message.key, error.message.params));
      return;
    }
  }, [editor, url, t]);

  const onInputChange = useCallback(event => setUrl(event.target.value), []);

  const label = useMemo(
    () => t('common.rich_text_editor_toolbar_link_add'),
    [t]
  );

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
        <DialogTitle>
          {t('common.rich_text_editor_link_add_dialog_title')}
        </DialogTitle>
        <DialogContent>
          <OutlinedInput fullWidth value={url} onChange={onInputChange} />
          {error && <FormHelperText error>{error}</FormHelperText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {t('common.rich_text_editor_link_add_dialog_cancel')}
          </Button>
          <Button variant="contained" onClick={handleAddLink} color="primary">
            {t('common.rich_text_editor_link_add_dialog_add')}
          </Button>
        </DialogActions>
      </Dialog>
      <Tooltip title={label}>
        <Button
          aria-label={label}
          disabled={isLinkActive(editor)}
          onMouseDown={onButtonClick}
        >
          <InsertLinkIcon />
        </Button>
      </Tooltip>
    </>
  );
};

const RemoveLinkButton = () => {
  const { t } = useTranslation();
  const editor = useSlate();

  const label = useMemo(
    () => t('common.rich_text_editor_toolbar_link_remove'),
    [t]
  );

  return (
    <Button
      aria-label={label}
      disabled={!isLinkActive(editor)}
      onMouseDown={event => {
        if (isLinkActive(editor)) {
          unwrapLink(editor);
        }
      }}
    >
      <Tooltip title={label}>
        <LinkOffIcon />
      </Tooltip>
    </Button>
  );
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks && marks[format];
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const MarkButton = props => {
  const editor = useSlate();
  const { format, Icon, label } = props;
  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        onMouseDown={event => {
          event.preventDefault();
          toggleMark(editor, format);
        }}
      >
        <Icon />
      </Button>
    </Tooltip>
  );
};

const RichTextEditor = props => {
  const { t } = useTranslation();
  const {
    id,
    label,
    editable = true,
    value,
    onChange,
    placeholder,
    addContainer,
  } = props;

  const editor = useMemo(
    () => withInlines(withHistory(withReact(createEditor()))),
    []
  );

  const parsedValue = useMemo(() => {
    if (!value) {
      return [
        {
          type: 'paragraph',
          children: [{ text: '' }],
        },
      ];
    }
    if (typeof value === 'string') {
      return [
        {
          type: 'paragraph',
          children: [{ text: value }],
        },
      ];
    }
    return value;
  }, [value]);

  const Container = useMemo(
    () =>
      addContainer
        ? withProps(Paper, {
            variant: 'outlined',
            sx: { bgcolor: 'gray.dark2', color: 'white', borderRadius: 0 },
          })
        : React.Fragment,
    [addContainer]
  );

  return (
    <Container>
      <Slate editor={editor} value={parsedValue} onChange={onChange}>
        {editable && (
          <Toolbar
            groups={[
              <>
                <MarkButton
                  format="bold"
                  Icon={FormatBoldIcon}
                  label={t('common.rich_text_editor_toolbar_bold')}
                />
                <MarkButton
                  format="italic"
                  Icon={FormatItalicIcon}
                  label={t('common.rich_text_editor_toolbar_italic')}
                />
              </>,
              <>
                <AddLinkButton />
                <RemoveLinkButton />
              </>,
            ]}
          />
        )}
        <Editable
          id={id}
          aria-label={label}
          style={
            addContainer
              ? {
                  paddingLeft: theme.spacing(2),
                  paddingRight: theme.spacing(2),
                }
              : null
          }
          readOnly={!editable}
          renderElement={props => <Element {...props} />}
          renderLeaf={props => <Leaf {...props} />}
          placeholder={placeholder}
        />
      </Slate>
    </Container>
  );
};

export default RichTextEditor;
