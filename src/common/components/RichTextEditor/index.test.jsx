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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';
import { createEditor, Editor, Transforms } from 'slate';
import { useSlate } from 'slate-react';

import RichTextEditor, {
  getCurrentBlockType,
  isContentChangeOperation,
  setBlockType,
  toggleBlock,
} from 'terraso-web-client/common/components/RichTextEditor/index';

const actualSlateEditor = jest.requireActual('slate').Editor;

jest.mock('slate', () => ({
  ...jest.requireActual('slate'),
  Editor: {
    ...jest.requireActual('slate').Editor,
    nodes: jest.fn(),
  },
}));

beforeEach(() => {
  global.window.open = jest.fn();
});

const setup = async () => {
  await render(
    <RichTextEditor
      initialFocused
      value={[
        {
          type: 'paragraph',
          children: [
            {
              text: 'asdasd asd asd ',
            },
            {
              url: 'https://example.com',
              type: 'link',
              children: [
                {
                  text: 'link',
                },
              ],
            },
            {
              text: ' asd as',
            },
          ],
        },
      ]}
    />
  );
};

test('RichTextEditor: Link dialog input should be empty', async () => {
  Editor.nodes.mockReturnValue([null]);
  await setup();

  const addLink = async () => {
    const linkButton = screen.getByRole('button', { name: 'Link' });
    expect(linkButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.mouseDown(linkButton);
    });

    const dialog = screen.getByRole('dialog', { name: 'Add Link' });

    const urlInput = within(dialog).getByRole('textbox', { name: 'Link' });
    await act(async () => {
      fireEvent.change(urlInput, { target: { value: 'example.com' } });
    });

    const addButton = within(dialog).getByRole('button', { name: 'Add Link' });
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Add Link' })
      ).not.toBeInTheDocument()
    );
  };

  await addLink();
  await addLink();
});

test('RichTextEditor: single link button unlinks when link is active', async () => {
  Editor.nodes.mockImplementation((_editor, options) => {
    const linkEntry = [
      {
        type: 'link',
        url: 'https://example.com',
        children: [{ text: 'link' }],
      },
      [0, 0],
    ];
    return options.match(linkEntry[0]) ? [linkEntry] : [];
  });

  await render(
    <RichTextEditor
      initialFocused
      value={[
        {
          type: 'paragraph',
          children: [
            {
              url: 'https://example.com',
              type: 'link',
              children: [{ text: 'link' }],
            },
          ],
        },
      ]}
    />
  );

  const unlinkButton = screen.getByRole('button', { name: 'Unlink' });

  await act(async () => {
    fireEvent.mouseDown(unlinkButton);
  });

  expect(
    screen.queryByRole('dialog', { name: 'Add Link' })
  ).not.toBeInTheDocument();
});

test('RichTextEditor: plain link click does not navigate in edit mode', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  await render(
    <RichTextEditor
      initialFocused
      value={[
        {
          type: 'paragraph',
          children: [
            {
              url: 'https://example.com',
              type: 'link',
              children: [{ text: 'link' }],
            },
          ],
        },
      ]}
    />
  );

  const editableLink = screen.getByRole('link', { name: /link/i });

  await act(async () => {
    fireEvent.click(editableLink);
  });

  expect(global.window.open).not.toHaveBeenCalled();
});

test('RichTextEditor: modifier-click opens link in edit mode', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  await render(
    <RichTextEditor
      initialFocused
      value={[
        {
          type: 'paragraph',
          children: [
            {
              url: 'https://example.com',
              type: 'link',
              children: [{ text: 'link' }],
            },
          ],
        },
      ]}
    />
  );

  const editableLink = screen.getByRole('link', { name: /link/i });

  await act(async () => {
    fireEvent.click(editableLink, {
      metaKey: true,
    });
  });

  expect(global.window.open).toHaveBeenCalledWith(
    'https://example.com',
    '_blank',
    'noopener,noreferrer'
  );
});

test('RichTextEditor: containerSx overrides the default editor surface', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  await render(
    <RichTextEditor
      addContainer
      containerSx={{ bgcolor: 'transparent', color: 'inherit' }}
      value="Editor content"
    />
  );

  const toolbar = screen.getByRole('toolbar');
  const container = toolbar.closest('.MuiPaper-root');

  expect(container).toHaveStyle({
    backgroundColor: 'rgba(0, 0, 0, 0)',
  });
});

test('RichTextEditor: read-only link click opens link', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  await render(
    <RichTextEditor
      editable={false}
      value={[
        {
          type: 'paragraph',
          children: [
            {
              url: 'https://example.com',
              type: 'link',
              children: [{ text: 'link' }],
            },
          ],
        },
      ]}
    />
  );

  const readOnlyLink = screen.getByRole('link', { name: /link/i });

  await act(async () => {
    fireEvent.click(readOnlyLink);
  });

  expect(global.window.open).toHaveBeenCalledWith(
    'https://example.com',
    '_blank',
    'noopener,noreferrer'
  );
});

const renderCustomElement = ({ attributes, children, element }) =>
  element.type === 'custom-block' ? (
    <div {...attributes} data-testid="custom-block">
      <span contentEditable={false}>Custom block</span>
      {children}
    </div>
  ) : null;

const InsertCustomBlock = () => {
  const editor = useSlate();
  return (
    <button
      type="button"
      onMouseDown={event => {
        event.preventDefault();
        Transforms.select(editor, { path: [0, 0], offset: 6 });
        Transforms.insertNodes(editor, {
          type: 'custom-block',
          children: [{ text: '' }],
        });
      }}
    >
      Insert custom block
    </button>
  );
};

const CheckCustomVoid = ({ onCheck }) => {
  const editor = useSlate();
  return (
    <button type="button" onClick={() => onCheck(editor)}>
      Check custom void
    </button>
  );
};

test('RichTextEditor: custom void blocks render alongside regular elements', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);
  const value = [
    { type: 'paragraph', children: [{ text: 'Before' }] },
    { type: 'custom-block', children: [{ text: '' }] },
    { type: 'heading-one', children: [{ text: 'After' }] },
  ];
  const onCheck = jest.fn();
  const { rerender } = await render(
    <RichTextEditor
      value={value}
      renderCustomElement={renderCustomElement}
      isCustomVoidElement={element => element.type === 'custom-block'}
      customToolbar={<CheckCustomVoid onCheck={onCheck} />}
    />
  );

  const block = screen.getByTestId('custom-block');
  expect(block).toHaveAttribute('data-slate-node', 'element');
  expect(block).toHaveAttribute('data-slate-void', 'true');
  expect(block.querySelector('[data-slate-node="text"]')).toBeInTheDocument();
  expect(screen.getByText('Before').closest('p')).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'After', level: 4 })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Check custom void' }));
  const editor = onCheck.mock.lastCall[0];
  expect(editor.isVoid(value[1])).toBe(true);

  await act(async () => {
    rerender(
      <RichTextEditor
        value={value}
        renderCustomElement={renderCustomElement}
        isCustomVoidElement={() => false}
        customToolbar={<CheckCustomVoid onCheck={onCheck} />}
      />
    );
  });
  fireEvent.click(screen.getByRole('button', { name: 'Check custom void' }));
  expect(onCheck.mock.lastCall[0]).toBe(editor);
  expect(editor.isVoid(value[1])).toBe(false);
});

test('RichTextEditor: custom toolbar inserts a void block at the cursor', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);
  const onChange = jest.fn();
  await render(
    <RichTextEditor
      initialFocused
      value={[{ type: 'paragraph', children: [{ text: 'BeforeAfter' }] }]}
      onChange={onChange}
      renderCustomElement={renderCustomElement}
      isCustomVoidElement={element => element.type === 'custom-block'}
      customToolbar={<InsertCustomBlock />}
    />
  );

  const toolbar = screen.getByRole('toolbar');
  const button = within(toolbar).getByRole('button', {
    name: 'Insert custom block',
  });
  await act(async () => {
    fireEvent.mouseDown(button);
  });

  expect(screen.getByText('Before').closest('p')).toBeInTheDocument();
  expect(screen.getByTestId('custom-block')).toHaveAttribute(
    'data-slate-void',
    'true'
  );
  expect(screen.getByText('After').closest('p')).toBeInTheDocument();
  expect(onChange).toHaveBeenLastCalledWith([
    { type: 'paragraph', children: [{ text: 'Before' }] },
    { type: 'custom-block', children: [{ text: '' }] },
    { type: 'paragraph', children: [{ text: 'After' }] },
  ]);
});

test('RichTextEditor: selection-only operations are not content changes', () => {
  expect(isContentChangeOperation({ type: 'set_selection' })).toBe(false);
  expect(isContentChangeOperation({ type: 'insert_text' })).toBe(true);
});

test('RichTextEditor: shows new highlight, list, and style controls', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  await render(
    <RichTextEditor
      initialFocused
      value={[
        {
          type: 'paragraph',
          children: [{ text: 'Hello world' }],
        },
      ]}
    />
  );

  expect(screen.getByRole('button', { name: 'Highlight' })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Numbered list' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Bulleted list' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('combobox', { name: 'Text style' })
  ).toBeInTheDocument();

  const toolbar = screen.getByRole('toolbar', { name: 'Textbox toolbar' });
  const controls = Array.from(
    toolbar.querySelectorAll('button, [role="combobox"]')
  ).map(control => control.getAttribute('aria-label'));

  expect(controls).toEqual([
    'Text style',
    'Bold',
    'Italic',
    'Highlight',
    'Link',
    'Numbered list',
    'Bulleted list',
  ]);

  expect(toolbar).toHaveStyle({ flexWrap: 'wrap' });
  toolbar
    .querySelectorAll('.MuiButtonGroup-root')
    .forEach(group => expect(group).toHaveStyle({ display: 'contents' }));
});

test('RichTextEditor: style select does not trigger blur when opened', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);
  const onBlur = jest.fn();

  await render(
    <RichTextEditor
      initialFocused
      onBlur={onBlur}
      value={[
        {
          type: 'paragraph',
          children: [{ text: 'Hello world' }],
        },
      ]}
    />
  );

  const editable = screen.getByRole('textbox');

  await act(async () => {
    fireEvent.focus(editable);
  });

  const styleSelect = screen.getByRole('combobox', { name: 'Text style' });

  await act(async () => {
    fireEvent.mouseDown(styleSelect);
  });

  expect(onBlur).not.toHaveBeenCalled();
  expect(screen.getByRole('listbox', { hidden: true })).toBeInTheDocument();
});

test('RichTextEditor: rerendered value replaces the live editor contents', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  const { rerender } = await render(
    <RichTextEditor
      value={[
        {
          type: 'paragraph',
          children: [{ text: 'Original value' }],
        },
      ]}
    />
  );

  expect(screen.getByText('Original value')).toBeInTheDocument();

  await act(async () => {
    rerender(
      <RichTextEditor
        initialFocused
        value={[
          {
            type: 'paragraph',
            children: [{ text: 'Updated value' }],
          },
        ]}
      />
    );
  });

  expect(screen.queryByText('Original value')).not.toBeInTheDocument();
  expect(screen.getByText('Updated value')).toBeInTheDocument();
});

test('RichTextEditor: renders independent documents for empty editors', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  await render(
    <>
      <RichTextEditor label="First empty editor" />
      <RichTextEditor label="Second empty editor" />
    </>
  );

  expect(
    screen.getByRole('textbox', { name: 'First empty editor' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('textbox', { name: 'Second empty editor' })
  ).toBeInTheDocument();
});

test('RichTextEditor: rerendered value waits until blur when editor is focused', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  const { rerender } = await render(
    <>
      <RichTextEditor
        value={[
          {
            type: 'paragraph',
            children: [{ text: 'Original value' }],
          },
        ]}
      />
      <button type="button">Outside</button>
    </>
  );

  const editable = screen.getByRole('textbox');
  const outsideButton = screen.getByRole('button', { name: 'Outside' });

  await act(async () => {
    fireEvent.focus(editable);
  });

  await act(async () => {
    rerender(
      <>
        <RichTextEditor
          value={[
            {
              type: 'paragraph',
              children: [{ text: 'Updated value' }],
            },
          ]}
        />
        <button type="button">Outside</button>
      </>
    );
  });

  expect(screen.getByText('Original value')).toBeInTheDocument();
  expect(screen.queryByText('Updated value')).not.toBeInTheDocument();

  await act(async () => {
    fireEvent.blur(editable, { relatedTarget: outsideButton });
    fireEvent.focus(outsideButton);
  });

  expect(screen.queryByText('Original value')).not.toBeInTheDocument();
  expect(screen.getByText('Updated value')).toBeInTheDocument();
});

test('RichTextEditor: rerender with a fresh containerSx object preserves the editor subtree', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  const value = [
    {
      type: 'paragraph',
      children: [{ text: 'Original value' }],
    },
  ];

  const { rerender } = await render(
    <RichTextEditor
      addContainer
      initialFocused
      containerSx={{ bgcolor: 'transparent', color: 'inherit' }}
      value={value}
    />
  );

  const editable = screen.getByRole('textbox');

  await act(async () => {
    rerender(
      <RichTextEditor
        addContainer
        initialFocused
        containerSx={{ bgcolor: 'transparent', color: 'inherit' }}
        value={value}
      />
    );
  });

  const rerenderedEditable = screen.getByRole('textbox');

  expect(rerenderedEditable).toBe(editable);
});

test('RichTextEditor: leaving toolbar triggers blur after moving from editable', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);
  const onBlur = jest.fn();

  await render(
    <>
      <RichTextEditor
        initialFocused
        onBlur={onBlur}
        value={[
          {
            type: 'paragraph',
            children: [{ text: 'Hello world' }],
          },
        ]}
      />
      <button type="button">Outside</button>
    </>
  );

  const editable = screen.getByRole('textbox');
  const highlightButton = screen.getByRole('button', { name: 'Highlight' });
  const outsideButton = screen.getByRole('button', { name: 'Outside' });

  await act(async () => {
    fireEvent.focus(editable);
  });

  await act(async () => {
    fireEvent.blur(editable, { relatedTarget: highlightButton });
    fireEvent.focus(highlightButton);
  });

  expect(onBlur).not.toHaveBeenCalled();

  await act(async () => {
    fireEvent.blur(highlightButton, { relatedTarget: outsideButton });
    fireEvent.focus(outsideButton);
  });

  expect(onBlur).toHaveBeenCalledTimes(1);
});

test('RichTextEditor: setBlockType changes paragraph to a heading', () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);
  const editor = createEditor();
  editor.children = [
    {
      type: 'paragraph',
      children: [{ text: 'Hello world' }],
    },
  ];
  editor.selection = {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 5 },
  };

  setBlockType(editor, 'heading-one');

  expect(editor.children).toEqual([
    {
      type: 'heading-one',
      children: [{ text: 'Hello world' }],
    },
  ]);
  expect(getCurrentBlockType(editor)).toBe('heading-one');
});

test('RichTextEditor: renders the heading style option as h4', async () => {
  await render(
    <RichTextEditor
      value={[
        {
          type: 'heading-one',
          children: [{ text: 'Content heading' }],
        },
      ]}
      editable={false}
    />
  );

  expect(
    screen.getByRole('heading', { name: 'Content heading', level: 4 })
  ).toBeInTheDocument();
});

test('RichTextEditor: toggleBlock wraps paragraph selection in a bulleted list', () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);
  const editor = createEditor();
  editor.children = [
    {
      type: 'paragraph',
      children: [{ text: 'Hello world' }],
    },
  ];
  editor.selection = {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 5 },
  };

  toggleBlock(editor, 'bulleted-list');

  expect(editor.children).toEqual([
    {
      type: 'bulleted-list',
      children: [
        {
          type: 'list-item',
          children: [{ text: 'Hello world' }],
        },
      ],
    },
  ]);
});
