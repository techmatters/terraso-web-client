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
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  createEditor,
  Editor,
  Range,
  Element as SlateElement,
  Transforms,
} from 'slate';
import { withHistory } from 'slate-history';
import {
  Editable,
  ReactEditor,
  Slate,
  useSelected,
  useSlate,
  withReact,
} from 'slate-react';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {
  Tooltip as BaseTooltip,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  MenuItem,
  Link as MuiLink,
  OutlinedInput,
  Paper,
  Select,
  Typography,
} from '@mui/material';

import { withProps } from 'terraso-web-client/react-hoc';

import ExternalLink from 'terraso-web-client/common/components/ExternalLink';
import Toolbar from 'terraso-web-client/common/components/RichTextEditor/Toolbar';
import { deserialize } from 'terraso-web-client/common/components/RichTextEditor/utils';
import {
  isUrl,
  transformURL,
  URL_SCHEMA,
} from 'terraso-web-client/common/utils';

import { focusOutline } from 'terraso-web-client/theme';

const BLOCK_OPTIONS = [
  { value: 'paragraph', labelKey: 'common.rich_text_editor_toolbar_body' },
  {
    value: 'heading-one',
    labelKey: 'common.rich_text_editor_toolbar_heading',
  },
];
const LIST_TYPES = ['bulleted-list', 'numbered-list'];

const EMPTY_VALUE = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

const normalizeValue = value => {
  if (!value) {
    return EMPTY_VALUE;
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
};

const areValuesEqual = (left, right) =>
  JSON.stringify(left) === JSON.stringify(right);

const HighlightMark = ({ children }) => (
  <Box
    component="mark"
    sx={{
      backgroundColor: 'richText.highlightBackground',
      color: 'richText.highlightText',
      borderRadius: '2px',
      px: '0.15em',
      py: '0.05em',
    }}
  >
    {children}
  </Box>
);

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
  highlight: HighlightMark,
  italic: 'em',
};

const isBlockNode = node =>
  !Editor.isEditor(node) &&
  SlateElement.isElement(node) &&
  [
    'paragraph',
    'list-item',
    ...BLOCK_OPTIONS.map(({ value }) => value),
  ].includes(node.type);

export const getCurrentBlockType = editor => {
  const [match] = Editor.nodes(editor, {
    match: isBlockNode,
    mode: 'lowest',
  });

  if (!Array.isArray(match)) {
    return 'paragraph';
  }

  const [node] = match;
  return node.type === 'list-item' ? 'paragraph' : node.type;
};

export const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: node =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      node.type === format,
  });

  return !!match;
};

const unwrapLists = editor => {
  Transforms.unwrapNodes(editor, {
    match: node =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      LIST_TYPES.includes(node.type),
    split: true,
  });
};

export const setBlockType = (editor, format) => {
  unwrapLists(editor);
  Transforms.setNodes(editor, { type: format });
};

export const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);

  unwrapLists(editor);

  if (LIST_TYPES.includes(format)) {
    Transforms.setNodes(editor, {
      type: isActive ? 'paragraph' : 'list-item',
    });

    if (!isActive) {
      Transforms.wrapNodes(editor, {
        type: format,
        children: [],
      });
    }

    return;
  }

  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : format,
  });
};

export const isContentChangeOperation = operation =>
  operation.type !== 'set_selection';

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

const insertLinkPartial = editor =>
  editor.selection ? wrapLinkPartial(editor) : () => {};

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

// Put this at the start and end of an inline component to work around this Chromium bug:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
const InlineChromiumBugfix = () => (
  <span contentEditable={false} style={{ fontSize: 0 }}>
    ${String.fromCodePoint(160) /* Non-breaking space */}
  </span>
);

const LinkComponent = ({ attributes, children, element, editable }) => {
  const selected = useSelected();

  const onEditableClick = useCallback(
    event => {
      if (event.metaKey || event.ctrlKey) {
        window.open(element.url, '_blank', 'noopener,noreferrer');
      }

      event.preventDefault();
      event.stopPropagation();
    },
    [element.url]
  );

  if (editable) {
    return (
      <MuiLink
        href={element.url}
        onClick={onEditableClick}
        {...attributes}
        sx={{
          textDecoration: 'underline',
          color: 'richText.link',
          ...(selected ? { boxShadow: '0 0 0 3px #ddd' } : null),
        }}
      >
        <InlineChromiumBugfix />
        {children}
        <InlineChromiumBugfix />
      </MuiLink>
    );
  }

  return (
    <ExternalLink
      href={element.url}
      linkProps={{
        ...attributes,
        style: selected ? { boxShadow: '0 0 0 3px #ddd' } : null,
        sx: { textDecoration: 'underline', color: 'richText.link' },
      }}
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </ExternalLink>
  );
};

const Element = props => {
  const { attributes, children, element, editable } = props;
  switch (element.type) {
    case 'link':
      return <LinkComponent {...props} editable={editable} />;
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

const LinkButton = props => {
  const { t } = useTranslation();
  const { disabled } = props;
  const editor = useSlate();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState();
  const [insertLink, setInsertLink] = useState();
  const linkActive = isLinkActive(editor);

  const onButtonClick = useCallback(
    event => {
      event.preventDefault();

      if (linkActive) {
        unwrapLink(editor);
        return;
      }

      setInsertLink(() => insertLinkPartial(editor));
      setOpen(true);
      setUrl('');
    },
    [editor, linkActive]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleAddLink = useCallback(() => {
    try {
      URL_SCHEMA.validateSync({ url });
      insertLink(transformURL(url));
      setOpen(false);
    } catch (error) {
      setError(t(error.message.key, error.message.params));
      return;
    }
  }, [insertLink, url, t]);

  const onInputChange = useCallback(event => setUrl(event.target.value), []);

  const label = useMemo(
    () =>
      linkActive
        ? t('common.rich_text_editor_toolbar_link_remove')
        : t('common.rich_text_editor_toolbar_link_add'),
    [linkActive, t]
  );

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
        <DialogTitle>
          {t('common.rich_text_editor_link_add_dialog_title')}
        </DialogTitle>
        <DialogContent>
          <OutlinedInput
            fullWidth
            value={url}
            onChange={onInputChange}
            inputProps={{
              'aria-label': t(
                'common.rich_text_editor_link_add_dialog_input_label'
              ),
            }}
          />
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
      <ToolbarButtonContainer tooltip={label} disabled={disabled}>
        <Button
          aria-label={label}
          disabled={disabled}
          onMouseDown={onButtonClick}
        >
          {linkActive ? <LinkOffIcon /> : <InsertLinkIcon />}
        </Button>
      </ToolbarButtonContainer>
    </>
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

const ToolbarButtonContainer = props => {
  const { tooltip, disabled, children } = props;

  const Container = useMemo(
    () => (disabled ? Fragment : withProps(Tooltip, { title: tooltip })),
    [disabled, tooltip]
  );

  return <Container>{children}</Container>;
};

const MarkButton = props => {
  const editor = useSlate();
  const { format, Icon, label, disabled } = props;
  const active = isMarkActive(editor, format);

  return (
    <ToolbarButtonContainer tooltip={label} disabled={disabled}>
      <Button
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        sx={active ? { bgcolor: 'gray.lite1' } : null}
        onMouseDown={event => {
          event.preventDefault();
          toggleMark(editor, format);
        }}
      >
        <Icon />
      </Button>
    </ToolbarButtonContainer>
  );
};

const BlockButton = props => {
  const editor = useSlate();
  const { format, Icon, label, disabled } = props;
  const active = isBlockActive(editor, format);

  return (
    <ToolbarButtonContainer tooltip={label} disabled={disabled}>
      <Button
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        sx={active ? { bgcolor: 'gray.lite1' } : null}
        onMouseDown={event => {
          event.preventDefault();
          toggleBlock(editor, format);
        }}
      >
        <Icon />
      </Button>
    </ToolbarButtonContainer>
  );
};

const StyleSelect = props => {
  const { t } = useTranslation();
  const editor = useSlate();
  const { disabled, selectionRef } = props;

  const value = getCurrentBlockType(editor);
  const label = t('common.rich_text_editor_toolbar_style_label');

  const onChange = useCallback(
    event => {
      if (selectionRef.current) {
        ReactEditor.focus(editor);
        Transforms.select(editor, selectionRef.current);
      }

      setBlockType(editor, event.target.value);
    },
    [editor, selectionRef]
  );

  return (
    <ToolbarButtonContainer tooltip={label} disabled={disabled}>
      <Select
        size="small"
        variant="standard"
        disabled={disabled}
        value={value}
        onChange={onChange}
        onMouseDownCapture={() => {
          if (editor.selection) {
            selectionRef.current = editor.selection;
          }
        }}
        disableUnderline
        inputProps={{ 'aria-label': label }}
        MenuProps={{
          disablePortal: true,
          MenuListProps: {
            'aria-label': label,
          },
        }}
        sx={{
          minWidth: 112,
          px: 1,
          '& .MuiSelect-select': {
            py: 1,
            pr: 3,
            fontSize: '0.875rem',
          },
        }}
        renderValue={selected =>
          t(
            BLOCK_OPTIONS.find(option => option.value === selected)?.labelKey ??
              'common.rich_text_editor_toolbar_body'
          )
        }
      >
        {BLOCK_OPTIONS.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </MenuItem>
        ))}
      </Select>
    </ToolbarButtonContainer>
  );
};

const RichTextEditor = props => {
  const { t } = useTranslation();
  const {
    id,
    label,
    editable = true,
    onBlur,
    value,
    onChange,
    placeholder,
    addContainer,
    initialFocused = false,
  } = props;

  const [focused, setFocused] = useState(initialFocused);
  const containerRef = useRef(null);
  const selectionRef = useRef();
  const syncingExternalValueRef = useRef(false);

  const editor = useMemo(
    () => withInlines(withHistory(withReact(createEditor()))),
    []
  );

  const onChangeWrapper = useCallback(
    nextValue => {
      if (syncingExternalValueRef.current) {
        return;
      }

      if (editor.selection) {
        selectionRef.current = editor.selection;
      }

      if (!onChange) {
        return;
      }

      const hasContentChange = editor.operations.some(isContentChangeOperation);
      if (!hasContentChange) {
        return;
      }

      onChange(nextValue);
    },
    [editor, onChange]
  );

  const parsedValue = useMemo(() => normalizeValue(value), [value]);

  useEffect(() => {
    if (areValuesEqual(editor.children, parsedValue)) {
      return;
    }

    syncingExternalValueRef.current = true;

    Editor.withoutNormalizing(editor, () => {
      editor.children = parsedValue;
      editor.selection = null;
    });

    editor.history = {
      undos: [],
      redos: [],
    };
    editor.onChange();

    syncingExternalValueRef.current = false;
  }, [editor, parsedValue]);

  const Container = useMemo(
    () =>
      addContainer
        ? withProps(Paper, {
            variant: 'outlined',
            sx: { bgcolor: 'gray.dark2', color: 'white', borderRadius: 0 },
          })
        : Fragment,
    [addContainer]
  );

  const renderElement = useCallback(
    props => <Element {...props} editable={editable} />,
    [editable]
  );

  const renderPlaceholder = useCallback(
    ({ children, attributes }) => (
      <Box component="span" {...attributes}>
        <Typography component="span" variant="subtitle1" sx={{ lineHeight: 3 }}>
          {children}
        </Typography>
      </Box>
    ),
    []
  );

  return (
    <Container>
      <Box
        ref={containerRef}
        onFocus={() => setFocused(true)}
        onBlur={event => {
          if (event.currentTarget.contains(event.relatedTarget)) {
            return;
          }

          setFocused(false);
          onBlur?.(event);
        }}
      >
        <Slate
          editor={editor}
          initialValue={parsedValue}
          onChange={onChangeWrapper}
        >
          {editable && (
            <Toolbar
              groups={[
                <>
                  <MarkButton
                    disabled={!focused}
                    format="bold"
                    Icon={FormatBoldIcon}
                    label={t('common.rich_text_editor_toolbar_bold')}
                  />
                  <MarkButton
                    disabled={!focused}
                    format="italic"
                    Icon={FormatItalicIcon}
                    label={t('common.rich_text_editor_toolbar_italic')}
                  />
                </>,
                <>
                  <LinkButton disabled={!focused} />
                  <StyleSelect
                    disabled={!focused}
                    selectionRef={selectionRef}
                  />
                  <MarkButton
                    disabled={!focused}
                    format="highlight"
                    Icon={BorderColorIcon}
                    label={t('common.rich_text_editor_toolbar_highlight')}
                  />
                  <BlockButton
                    disabled={!focused}
                    format="numbered-list"
                    Icon={FormatListNumberedIcon}
                    label={t('common.rich_text_editor_toolbar_numbered_list')}
                  />
                  <BlockButton
                    disabled={!focused}
                    format="bulleted-list"
                    Icon={FormatListBulletedIcon}
                    label={t('common.rich_text_editor_toolbar_bulleted_list')}
                  />
                </>,
              ]}
            />
          )}
          <Box
            component={Editable}
            id={id}
            aria-label={label}
            sx={
              addContainer
                ? {
                    pl: 2,
                    pr: 2,
                    overflow: 'hidden',
                    outline: 'none',
                    '&:focus': focusOutline,
                  }
                : null
            }
            readOnly={!editable}
            renderElement={renderElement}
            renderLeaf={Leaf}
            placeholder={placeholder}
            renderPlaceholder={renderPlaceholder}
          />
        </Slate>
      </Box>
    </Container>
  );
};

export default RichTextEditor;
