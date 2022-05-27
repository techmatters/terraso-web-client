import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';

import React from 'react';

import _ from 'lodash/fp';
import { useNavigate, useParams } from 'react-router-dom';

import * as terrasoApi from 'terrasoBackend/api';

import GroupSharedDataUpload from './GroupSharedDataUpload';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const setup = async () => {
  terrasoApi.requestGraphQL.mockResolvedValue(
    _.set(
      'groups.edges[0].node',
      {
        id: 'group-id',
        name: 'Group Name',
      },
      {}
    )
  );
  await render(<GroupSharedDataUpload />);
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
});

const dropFiles = async files => {
  await setup();
  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted file formats: *.xlsx, *.xls, *.csv Maximum file size: 10 MB',
  });

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

test('GroupSharedDataUpload: Error - Invalid type', async () => {
  await dropFiles([
    new File(['content'], 'test.json', { type: 'application/json' }),
  ]);
  expect(
    await screen.findByText(
      'test.json cannot be added because the file type(s) are not supported.'
    )
  ).toBeInTheDocument();
});

test('GroupSharedDataUpload: Error - Invalid number', async () => {
  await dropFiles(
    Array(50)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.csv`, { type: 'text/plain' })
      )
  );
  expect(
    await screen.findByText('Cannot add more than 20 files.')
  ).toBeInTheDocument();
});

test('GroupSharedDataUpload: Error - Empty filename', async () => {
  await dropFiles(
    Array(5)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.csv`, { type: 'text/plain' })
      )
  );
  const file = screen.getByRole('region', { name: 'test1' });
  const name = within(file).getByRole('textbox', {
    name: 'File Name (required)',
  });
  fireEvent.change(name, { target: { value: '' } });
  expect(await within(file).findByText('name is required')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Upload Files' })).toHaveAttribute(
    'disabled'
  );
});

test('GroupSharedDataUpload: Error - API', async () => {
  terrasoApi.request.mockResolvedValue(_.set('error.all[0]', 'Test Error', {}));
  await dropFiles(
    Array(5)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.csv`, { type: 'text/plain' })
      )
  );
  const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  const file = screen.getByRole('region', { name: 'test1' });
  expect(await within(file).findByText('Test Error')).toBeInTheDocument();
});

test('GroupSharedDataUpload: Partial Success', async () => {
  terrasoApi.request.mockResolvedValueOnce(
    _.set('error.all[0]', 'Test Error', {})
  );
  terrasoApi.request.mockResolvedValueOnce({});
  await dropFiles(
    Array(2)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.csv`, { type: 'text/plain' })
      )
  );
  const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  const file0 = screen.getByRole('region', { name: 'test0' });
  expect(await within(file0).findByText('Test Error')).toBeInTheDocument();
  const file1 = screen.getByRole('region', { name: 'test1' });
  expect(
    await within(file1).findByText('Uploaded successfully.')
  ).toBeInTheDocument();
});

test('GroupSharedDataUpload: Complete Success', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  terrasoApi.request.mockResolvedValueOnce({});
  await dropFiles(
    Array(2)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.csv`, { type: 'text/plain' })
      )
  );
  const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  expect(navigate.mock.calls[0]).toEqual(['/groups/slug-1']);
});
