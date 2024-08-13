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

import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';
import React from 'react';
import _ from 'lodash/fp';
import { useNavigate, useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { GROUP_TYPES_WITH_REDIRECTS } from 'tests/constants';

import { useAnalytics } from 'monitoring/analytics';

import GroupSharedDataUpload from './GroupSharedDataUpload';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('monitoring/analytics', () => ({
  ...jest.requireActual('monitoring/analytics'),
  useAnalytics: jest.fn(),
}));

const setup = async (membershipType = 'OPEN', userRole = 'member') => {
  terrasoApi.requestGraphQL.mockResolvedValue(
    _.set(
      'groups.edges[0].node',
      {
        id: 'group-id',
        slug: 'slug-1',
        name: 'Group Name',
        membershipType,
        accountMembership: {
          userRole,
          membershipStatus: 'APPROVED',
        },
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
  useAnalytics.mockReturnValue({
    trackEvent: jest.fn(),
  });
});

const dropFiles = async files => {
  await setup();
  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted file formats: *.csv, *.doc, *.docx, *.geojson, *.gpx, *.jpeg, *.jpg, *.json, *.kml, *.kmz, *.pdf, *.png, *.ppt, *.pptx, *.xls, *.xlsx, *.zip Maximum file size: 50 MB',
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

Object.keys(GROUP_TYPES_WITH_REDIRECTS).forEach(currentGroup =>
  test(`GroupSharedDataUpload: Redirection: ${currentGroup}`, async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    await setup(
      GROUP_TYPES_WITH_REDIRECTS[currentGroup].membershipType,
      GROUP_TYPES_WITH_REDIRECTS[currentGroup].userRole
    );

    expect(navigate).toHaveBeenCalledTimes(
      GROUP_TYPES_WITH_REDIRECTS[currentGroup].uploadRedirectCount
    );
  })
);

test('GroupSharedDataUpload: Error - Invalid type', async () => {
  await dropFiles([new File(['content'], 'test.txt', { type: 'text/plain' })]);
  expect(
    await screen.findByText(
      'test.txt cannot be added because the file type(s) are not supported.'
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
  expect(await within(file).findByText('Enter a name.')).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Share Files and Links' })
    ).toHaveAttribute('disabled')
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
  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  const file = screen.getByRole('region', { name: 'test1' });
  expect(
    await within(file).findByText(
      'Oops, something went wrong. Try again in a few minutes. (Error: Test Error)'
    )
  ).toBeInTheDocument();
});

test('GroupSharedDataUpload: Partial Success', async () => {
  terrasoApi.request.mockRejectedValueOnce(
    _.set('[0].content[0]', 'invalid_extension', [])
  );
  terrasoApi.request.mockResolvedValueOnce({ name: 'test1' });
  await dropFiles(
    Array(2)
      .fill(0)
      .map(
        (item, index) =>
          new File(['content'], `test${index}.csv`, { type: 'text/csv' })
      )
  );
  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));

  expect(screen.getByRole('region', { name: 'test0' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'test1' })).toBeInTheDocument();

  await act(async () => fireEvent.click(uploadButton));
  const file0 = screen.getByRole('region', { name: 'test0' });
  expect(
    await within(file0).findByText(
      'The file extension (.csv) does not match the file’s contents'
    )
  ).toBeInTheDocument();
  const file1 = screen.getByRole('region', { name: 'test1' });
  expect(
    await within(file1).findByText('Uploaded successfully.')
  ).toBeInTheDocument();
});

test('GroupSharedDataUpload: Complete Success', async () => {
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });
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
  expect(navigate).toHaveBeenCalledTimes(0);
  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  expect(navigate.mock.calls[0]).toEqual(['/groups/slug-1']);

  const saveCall = terrasoApi.request.mock.calls[0];
  expect(saveCall[0].body.get('target_type')).toBe('group');
  expect(saveCall[0].body.get('target_slug')).toBe('slug-1');

  expect(trackEvent).toHaveBeenCalledWith('dataEntry.file.upload', {
    props: {
      'ILM Output': 'Results and analysis of impact',
      group: 'slug-1',
      size: 7,
      type: 'text/csv',
      success: true,
    },
  });
});

test('GroupSharedDataUpload: PDF Success', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  terrasoApi.request.mockResolvedValueOnce({});
  await dropFiles([
    new File(['content'], 'test.pdf', { type: 'application/pdf' }),
  ]);
  expect(navigate).toHaveBeenCalledTimes(0);
  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });
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
  expect(navigate).toHaveBeenCalledTimes(0);

  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  await act(async () => fireEvent.click(uploadButton));
  expect(navigate.mock.calls[0]).toEqual(['/groups/slug-1']);
});
test('GroupSharedDataUpload: Gis files', async () => {
  const fileTypes = [
    ['json', 'application/json'],
    ['geojson', 'application/json'],
    ['kml', 'application/xml'],
    ['gpx', 'application/xml'],
    ['kmz', 'application/zip'],
    ['zip', 'application/zip'],
  ];

  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  terrasoApi.request.mockResolvedValueOnce({});
  await dropFiles(
    fileTypes.map(
      ([extension, type], index) =>
        new File(['content'], `test-${index}.${extension}`, {
          type,
        })
    )
  );
  expect(navigate).toHaveBeenCalledTimes(0);

  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  await act(async () => fireEvent.click(uploadButton));
  expect(navigate.mock.calls[0]).toEqual(['/groups/slug-1']);
});
