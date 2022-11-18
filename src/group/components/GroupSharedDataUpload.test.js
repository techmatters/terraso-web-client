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
  useNavigate.mockReturnValue(() => {});
});

const dropFiles = async files => {
  await setup();
  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted file formats: *.csv, *.doc, *.docx, *.pdf, *.ppt, *.pptx, *.xlsx, *.xls Maximum file size: 10 MB',
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
          new File(['content'], `test${index}.csv`, { type: 'text/csv' })
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
          new File(['content'], `test${index}.csv`, { type: 'text/csv' })
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
  terrasoApi.request.mockRejectedValue('Test Error');
  await dropFiles(
    Array(5)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.csv`, { type: 'text/csv' })
      )
  );
  const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  const file = screen.getByRole('region', { name: 'test1' });
  expect(
    await within(file).findByText(
      'Oops, something went wrong. Please try it again in a few minutes. (Error: Test Error)'
    )
  ).toBeInTheDocument();
});

test('GroupSharedDataUpload: Partial Success', async () => {
  terrasoApi.request.mockRejectedValueOnce(
    _.set('[0].content[0]', 'invalid_extension', [])
  );
  terrasoApi.request.mockResolvedValueOnce({});
  await dropFiles(
    Array(2)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.csv`, { type: 'text/csv' })
      )
  );
  const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  const file0 = screen.getByRole('region', { name: 'test0' });
  expect(
    await within(file0).findByText(
      "The file extension (.csv) does not match the file's contents"
    )
  ).toBeInTheDocument();
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
          new File(['content'], `test${index}.csv`, { type: 'text/csv' })
      )
  );
  const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  expect(navigate.mock.calls[0]).toEqual(['/groups/slug-1']);
});

test('GroupSharedDataUpload: PDF Success', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  terrasoApi.request.mockResolvedValueOnce({});
  await dropFiles([
    new File(['content'], 'test.pdf', { type: 'application/pdf' }),
  ]);
  const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  expect(navigate.mock.calls[0]).toEqual(['/groups/slug-1']);
});

test('GroupSharedDataUpload: MS Office Success', async () => {
  const fileTypes = [
    ['doc', 'application/msword'],
    ['xls', 'application/vnd.ms-excel'],
    ['ppt', 'application/vnd.ms-powerpoint'],
    [
      'docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    [
      'pptx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    [
      'xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  ];

  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  terrasoApi.request.mockResolvedValueOnce({});
  await dropFiles(
    Array(6)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.${fileTypes[index][0]}`, {
            type: fileTypes[index][1],
          })
      )
  );
  const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  expect(navigate.mock.calls[0]).toEqual(['/groups/slug-1']);
});
