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

import { act, fireEvent, render, screen, waitFor } from 'tests/utils';
import React from 'react';
import AvatarEditor from 'react-avatar-editor';
import { useParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import ProfileImageUpdate from 'landscape/components/LandscapeForm/ProfileImageUpdate';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

const setup = async () => {
  await render(<ProfileImageUpdate />);

  const description = screen.getByRole('textbox', {
    name: 'Photo Description',
  });

  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted formats: .jpeg, .jpg Maximum file size: 10 MB',
  });

  const dropFiles = async files => {
    const data = {
      dataTransfer: {
        files,
        items: files.map(file => ({
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        })),
        types: ['Files'],
      },
    };
    await act(async () => fireEvent.drop(dropzone, data));
  };
  return {
    inputs: {
      description,
      dropFiles,
    },
  };
};

const CANVAS_CONTEXT = {
  save: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
  beginPath: jest.fn(),
  rect: jest.fn(),
  fill: jest.fn(),
  restore: jest.fn(),
  clearRect: jest.fn(),
};

const AVATAR_EDITOR_IMAGE = {
  toDataURL: jest.fn(),
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  global.HTMLCanvasElement.prototype.getContext = () => CANVAS_CONTEXT;
  global.fetch = jest.fn();
  AvatarEditor.prototype.getImage = () => AVATAR_EDITOR_IMAGE;
});

test('ProfileImageUpdate: Display error', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith('query landscapes')) {
      return Promise.reject('Load landscapes error');
    }
  });
  await render(<ProfileImageUpdate />);
  expect(screen.getByText(/Load landscapes error/i)).toBeInTheDocument();
});
test('ProfileImageUpdate: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await render(<ProfileImageUpdate />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('ProfileImageUpdate: Save form', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('query landscapes')) {
      return Promise.resolve({
        landscapes: {
          edges: [
            {
              node: {
                id: '1',
                slug: 'landscape-slug',
                name: 'Landscape Name',
                description: 'Landscape Description',
                email: 'info@landscape.org',
                website: 'https://www.landscape.org',
                location: 'EC',
              },
            },
          ],
        },
      });
    }
  });
  terrasoApi.request.mockResolvedValueOnce({});
  AVATAR_EDITOR_IMAGE.toDataURL.mockReturnValueOnce(
    'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
  );
  global.fetch.mockResolvedValueOnce({
    status: 200,
    blob: () =>
      new Blob(['test content'], {
        type: 'image/jpeg',
      }),
  });

  const { inputs } = await setup();

  await act(async () =>
    fireEvent.change(inputs.description, {
      target: { value: 'Test Description' },
    })
  );

  await inputs.dropFiles([
    new File(['content'], `test.jpg`, {
      type: `image/jpeg`,
    }),
  ]);
  await inputs.dropFiles([
    new File(['content2'], `test.jpg`, {
      type: `image/jpeg`,
    }),
  ]);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Update' })).not.toHaveAttribute(
      'disabled'
    )
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Update' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
  const saveCall = terrasoApi.request.mock.calls[0];
  expect(saveCall[0].body.get('description')).toEqual('Test Description');
  expect(saveCall[0].body.get('landscape')).toEqual('landscape-slug');
  expect(saveCall[0].body.get('data_file')).not.toBeNull();
});
