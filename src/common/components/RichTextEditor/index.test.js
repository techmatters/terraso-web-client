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

import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';
import { Editor } from 'slate';

import RichTextEditor from '.';

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

test('RichTextEditor: Should setup observer to prevent scroll when focused but not visible', async () => {
  Editor.nodes.mockReturnValue([null]);

  const observeMock = jest.fn();
  global.IntersectionObserver = jest
    .fn()
    .mockImplementation((callback, options) => {
      return {
        observe: observeMock,
        disconnect: jest.fn(),
        unobserve: jest.fn(),
      };
    });

  await setup();

  // Verify IntersectionObserver was set up correctly
  expect(global.IntersectionObserver).toHaveBeenCalledWith(
    expect.any(Function),
    expect.objectContaining({
      threshold: 0,
      rootMargin: '10px',
    })
  );

  // Verify that the observed element is specifically the Slate editor
  const slateEditorCall = observeMock.mock.calls.find(
    ([element]) => element?.getAttribute?.('data-slate-editor') === 'true'
  );
  expect(slateEditorCall).toBeDefined();
});
