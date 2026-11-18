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

import { act, fireEvent, render, screen } from 'terraso-web-client/tests/utils';
import { Editor, Transforms } from 'slate';
import { useSlate } from 'slate-react';

import RichTextEditor from 'terraso-web-client/common/components/RichTextEditor';
import EditableRichText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableRichText';

let mockEditor;
let otherEditor;

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia',
  () =>
    function MockEditableMedia({ value }) {
      const { useSlateStatic } = jest.requireActual('slate-react');
      mockEditor = useSlateStatic();
      return <button>{`Change collection ${value.length}`}</button>;
    }
);

const createClipboard = () => {
  const data = {};
  return {
    files: [],
    get types() {
      return Object.keys(data);
    },
    getData: type => data[type] || '',
    setData: (type, value) => {
      data[type] = value;
    },
  };
};

const collection = {
  type: 'media-collection',
  collectionId: 'group-1',
  presentation: 'gallery',
  children: [{ text: '' }],
};
const initialValue = [
  { type: 'paragraph', children: [{ text: 'Before', bold: true }] },
  collection,
  { type: 'paragraph', children: [{ text: 'After' }] },
];
const encodedFragment = value =>
  window.btoa(encodeURIComponent(JSON.stringify(value)));

const setup = async () => {
  await render(
    <EditableRichText
      label="Chapter text"
      chapter={{ mediaItems: [] }}
      onCollectionChange={jest.fn()}
      value={initialValue}
      onChange={jest.fn()}
    />
  );
  const textbox = screen.getByRole('textbox', { name: 'Chapter text' });
  Object.defineProperty(textbox, 'isContentEditable', { value: true });
  await act(async () => {
    textbox.focus();
  });
  return textbox;
};
const selectMixed = () =>
  Transforms.select(mockEditor, {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [2, 0], offset: 5 },
  });

test('copying a mixed selection copies only text and omits the media controls', async () => {
  const textbox = await setup();
  const clipboard = createClipboard();
  await act(async () => {
    selectMixed();
    fireEvent.copy(textbox, { clipboardData: clipboard });
  });
  expect(clipboard.getData('text/plain')).toBe('Before\nAfter');
  expect(clipboard.getData('text/html')).toBe('');
  expect(clipboard.getData('application/x-slate-fragment')).toBe('');
  expect(screen.getByRole('status')).toHaveTextContent('Only text was copied');
  await act(async () => {
    Transforms.select(mockEditor, Editor.end(mockEditor, []));
    fireEvent.paste(textbox, { clipboardData: clipboard });
  });
  expect(
    mockEditor.children.filter(node => node.type === 'media-collection')
  ).toHaveLength(1);
  expect(Editor.string(mockEditor, [])).not.toContain('Change collection');
});

test('cutting a selection containing media copies its text but leaves all content in place', async () => {
  const textbox = await setup();
  const clipboard = createClipboard();
  await act(async () => {
    selectMixed();
    fireEvent.cut(textbox, { clipboardData: clipboard });
  });
  expect(clipboard.getData('text/plain')).toBe('Before\nAfter');
  expect(mockEditor.children).toEqual(initialValue);
  expect(screen.getByRole('status')).toHaveTextContent(
    'selection was not removed'
  );
});

test('copy and cut of only a media collection do not copy controls or remove it', async () => {
  const textbox = await setup();
  const clipboard = createClipboard();
  await act(async () => {
    Transforms.select(mockEditor, {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
    fireEvent.copy(textbox, { clipboardData: clipboard });
    fireEvent.cut(textbox, { clipboardData: clipboard });
  });
  expect(clipboard.getData('text/plain')).toBe('');
  expect(clipboard.getData('text/html')).toBe('');
  expect(mockEditor.children).toEqual(initialValue);
  expect(screen.getByRole('status')).toHaveTextContent(
    'selection was not removed'
  );
});

test('ordinary text copy and cut retain Slate formatting and cut normally', async () => {
  const textbox = await setup();
  const clipboard = createClipboard();
  await act(async () => {
    Transforms.select(mockEditor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 6 },
    });
    fireEvent.copy(textbox, { clipboardData: clipboard });
  });
  expect(clipboard.getData('application/x-slate-fragment')).toBeTruthy();
  const fragment = JSON.parse(
    decodeURIComponent(
      window.atob(clipboard.getData('application/x-slate-fragment'))
    )
  );
  expect(fragment[0].children[0].bold).toBe(true);
  await act(async () => fireEvent.cut(textbox, { clipboardData: clipboard }));
  expect(Editor.string(mockEditor, [0])).toBe('');
  await act(async () => fireEvent.paste(textbox, { clipboardData: clipboard }));
  expect(mockEditor.children[0].children[0]).toEqual({
    text: 'Before',
    bold: true,
  });
});

test('dragging a selection containing a collection is canceled without removing content', async () => {
  const textbox = await setup();
  const dataTransfer = createClipboard();
  let allowed;
  await act(async () => {
    selectMixed();
    allowed = fireEvent.dragStart(textbox, { dataTransfer });
  });
  expect(allowed).toBe(false);
  expect(dataTransfer.getData('application/x-slate-fragment')).toBe('');
  expect(mockEditor.children).toEqual(initialValue);
  expect(screen.getByRole('status')).toHaveTextContent(
    'Media collections cannot be dragged'
  );
});

test('dragging a media-only selection is canceled', async () => {
  const textbox = await setup();
  await act(async () => {
    Transforms.select(mockEditor, {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
    expect(
      fireEvent.dragStart(textbox, { dataTransfer: createClipboard() })
    ).toBe(false);
  });
  expect(mockEditor.children).toEqual(initialValue);
});

test('text and gallery control drags are not blocked by the collection guard', async () => {
  const textbox = await setup();
  const dataTransfer = createClipboard();
  await act(async () => {
    Transforms.select(mockEditor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 6 },
    });
    expect(fireEvent.dragStart(textbox, { dataTransfer })).toBe(true);
    expect(dataTransfer.getData('application/x-slate-fragment')).toBeTruthy();
    selectMixed();
    expect(
      fireEvent.dragStart(
        screen.getByRole('button', { name: 'Change collection 0' }),
        {
          dataTransfer: createClipboard(),
        }
      )
    ).toBe(true);
  });
});

const CaptureEditor = () => {
  otherEditor = useSlate();
  return null;
};

test.each(['fragment', 'html'])(
  'cross-editor %s paste cannot import a collection ID or control text',
  async kind => {
    await render(
      <RichTextEditor
        label="Other editor"
        value={[{ type: 'paragraph', children: [{ text: 'Existing' }] }]}
        customToolbar={<CaptureEditor />}
      />
    );
    const textbox = screen.getByRole('textbox', { name: 'Other editor' });
    Object.defineProperty(textbox, 'isContentEditable', { value: true });
    const clipboard = createClipboard();
    const encoded = encodedFragment(initialValue);
    if (kind === 'fragment') {
      clipboard.setData('application/x-slate-fragment', encoded);
    } else {
      clipboard.setData(
        'text/html',
        `<div data-slate-fragment="${encoded}"><p>Before</p><div data-story-map-media-collection>Change collection</div><p>After</p></div>`
      );
    }
    await act(async () => {
      textbox.focus();
      Transforms.select(otherEditor, Editor.end(otherEditor, []));
      fireEvent.paste(textbox, { clipboardData: clipboard });
    });
    expect(JSON.stringify(otherEditor.children)).not.toContain('group-1');
    expect(Editor.string(otherEditor, [])).toContain('Before');
    expect(Editor.string(otherEditor, [])).toContain('After');
    expect(Editor.string(otherEditor, [])).not.toContain('Change collection');
  }
);

test('HTML without a Slate fragment strips collection controls and keeps surrounding text', async () => {
  const textbox = await setup();
  const clipboard = createClipboard();
  clipboard.setData(
    'text/html',
    '<p>Alpha</p><div data-story-map-media-collection><button>Change collection</button></div><p>Omega</p>'
  );
  await act(async () => {
    Transforms.select(mockEditor, Editor.end(mockEditor, []));
    fireEvent.paste(textbox, { clipboardData: clipboard });
  });
  expect(Editor.string(mockEditor, [])).toContain('Alpha');
  expect(Editor.string(mockEditor, [])).toContain('Omega');
  expect(Editor.string(mockEditor, [])).not.toContain('Change collection');
  expect(
    mockEditor.children.filter(node => node.type === 'media-collection')
  ).toHaveLength(1);
});

test('pasting a media-only fragment does not delete the selected text', async () => {
  const textbox = await setup();
  const clipboard = createClipboard();
  clipboard.setData(
    'application/x-slate-fragment',
    encodedFragment([collection])
  );
  await act(async () => {
    Transforms.select(mockEditor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 6 },
    });
    fireEvent.paste(textbox, { clipboardData: clipboard });
  });
  expect(mockEditor.children).toEqual(initialValue);
});

test('malformed fragments fall back to plain text without throwing', async () => {
  const textbox = await setup();
  const clipboard = createClipboard();
  clipboard.setData('application/x-slate-fragment', 'not-base64!');
  clipboard.setData('text/plain', 'safe text');
  await act(async () => {
    Transforms.select(mockEditor, Editor.end(mockEditor, []));
    fireEvent.paste(textbox, { clipboardData: clipboard });
  });
  expect(Editor.string(mockEditor, [])).toContain('safe text');
});
