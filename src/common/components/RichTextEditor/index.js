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
import { Editable, useSelected, useSlate, withReact } from 'slate-react';
import * as SlateReact from 'slate-react';

import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
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
  underline: 'u',
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
    const text = data.getData('text/plain');

    if (text && isUrl(text)) {
      wrapLink(editor, transformURL(text), text);
    } else {
      insertData(data);
    }
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
      // if you have an inline at the end of a block,
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

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
        <DialogTitle>
          {t('common.rich_text_editor_link_add_dialog_title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('common.rich_text_editor_link_add_dialog_description')}
          </DialogContentText>
          <OutlinedInput fullWidth value={url} onChange={onInputChange} />
          {error && <FormHelperText error>{error}</FormHelperText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {t('common.rich_text_editor_link_add_dialog_cancel')}
          </Button>
          <Button onClick={handleAddLink} color="primary">
            {t('common.rich_text_editor_link_add_dialog_add')}
          </Button>
        </DialogActions>
      </Dialog>
      <Button disabled={isLinkActive(editor)} onMouseDown={onButtonClick}>
        <InsertLinkIcon />
      </Button>
    </>
  );
};

const RemoveLinkButton = () => {
  const editor = useSlate();

  return (
    <Button
      disabled={!isLinkActive(editor)}
      onMouseDown={event => {
        if (isLinkActive(editor)) {
          unwrapLink(editor);
        }
      }}
    >
      <LinkOffIcon />
    </Button>
  );
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const MarkButton = ({ format, Icon }) => {
  const editor = useSlate();
  return (
    <Button
      onMouseDown={event => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon />
    </Button>
  );
};

const RichTextEditor = props => {
  const {
    id,
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
      <SlateReact.Slate editor={editor} value={parsedValue} onChange={onChange}>
        {editable && (
          <Toolbar
            groups={[
              <>
                <MarkButton format="bold" Icon={FormatBoldIcon} />
                <MarkButton format="italic" Icon={FormatItalicIcon} />
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
      </SlateReact.Slate>
    </Container>
  );
};

export default RichTextEditor;
