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
import { createEditor, Editor } from 'slate';

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
  expect(styleSelect).toHaveAttribute('aria-expanded', 'true');
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

test('RichTextEditor: focused editor applies external value after blur', async () => {
  Editor.nodes.mockImplementation(actualSlateEditor.nodes);

  const { rerender } = await render(
    <>
      <RichTextEditor
        initialFocused
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
          initialFocused
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
