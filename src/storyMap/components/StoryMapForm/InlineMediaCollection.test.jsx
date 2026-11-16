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

import EditableRichText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableRichText';

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia',
  () =>
    function MockEditableMedia({
      value,
      onChange,
      presentation,
      onPresentationChange,
    }) {
      return (
        <div>
          <span>{`items: ${value.map(item => item.id).join(',')}`}</span>
          <span>{`presentation: ${presentation}`}</span>
          <button onClick={() => onChange([...value, { id: 'new' }])}>
            Add item
          </button>
          <button onClick={() => onPresentationChange('gallery')}>
            Gallery
          </button>
        </div>
      );
    }
);

const paragraph = { type: 'paragraph', children: [{ text: 'Hello' }] };

test('inserts an empty collection through the toolbar click', async () => {
  const onChange = jest.fn();
  await render(
    <EditableRichText
      chapter={{ mediaItems: [] }}
      onCollectionChange={jest.fn()}
      value={[paragraph]}
      onChange={onChange}
    />
  );

  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert media collection' })
    );
  });

  const collection = onChange.mock.lastCall[0].find(
    node => node.type === 'media-collection'
  );
  expect(collection).toEqual({
    type: 'media-collection',
    collectionId: expect.any(String),
    presentation: 'carousel',
    children: [{ text: '' }],
  });
  expect(onChange.mock.lastCall[0].at(-1)).toEqual({
    type: 'paragraph',
    children: [{ text: '' }],
  });
  expect(screen.getByText('items:')).toBeInTheDocument();
});

test('provides an editable paragraph after a previously saved final collection', async () => {
  await render(
    <EditableRichText
      label="Chapter text"
      chapter={{ mediaItems: [] }}
      onCollectionChange={jest.fn()}
      value={[
        {
          type: 'media-collection',
          collectionId: 'group',
          presentation: 'carousel',
          children: [{ text: '' }],
        },
      ]}
      onChange={jest.fn()}
    />
  );

  const editor = screen.getByRole('textbox', { name: 'Chapter text' });
  expect(editor.lastElementChild.tagName).toBe('P');
  expect(editor.lastElementChild).toHaveTextContent('');
});

test('edits only the selected collection and saves its presentation in Slate', async () => {
  const onChange = jest.fn();
  const onCollectionChange = jest.fn();
  await render(
    <EditableRichText
      chapter={{
        mediaItems: [
          { id: 'first', inlineCollectionId: 'group' },
          { id: 'other', inlineCollectionId: 'other-group' },
        ],
      }}
      onCollectionChange={onCollectionChange}
      value={[
        paragraph,
        {
          type: 'media-collection',
          collectionId: 'group',
          presentation: 'carousel',
          children: [{ text: '' }],
        },
      ]}
      onChange={onChange}
    />
  );

  expect(screen.getByText('items: first')).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
  );
  expect(onCollectionChange).toHaveBeenCalledWith('group', [
    { id: 'first', inlineCollectionId: 'group' },
    { id: 'new' },
  ]);
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }))
  );
  expect(onChange.mock.lastCall[0][1].presentation).toBe('gallery');
});
