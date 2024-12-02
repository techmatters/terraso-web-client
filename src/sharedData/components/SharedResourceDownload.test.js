/*
 * Copyright © 2024 Technology Matters
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

import { act, fireEvent, render, screen } from 'tests/utils';
import { when } from 'jest-when';
import { useLocation, useNavigate, useParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import { useDownloadEvent } from 'monitoring/events';

import SharedResourceDownload from './SharedResourceDownload';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('monitoring/events', () => ({
  useDownloadEvent: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const DEFAULT_ACCOUNT = {
  currentUser: {},
  account: {
    hasToken: 'token',
  },
};

const setupData = () => {
  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('query sharedResource'),
      expect.anything()
    )
    .mockResolvedValue({
      sharedResource: {
        downloadUrl: 'https://example.com',
        source: {
          name: 'map',
          resourceType: 'geojson',
        },
      },
    });
};

const setup = async (account = DEFAULT_ACCOUNT, entityType = 'group') => {
  await render(<SharedResourceDownload entityType={entityType} />, {
    account,
  });
};

beforeEach(() => {
  window.open = jest.fn();
  useParams.mockReturnValue({
    shareUuid: 'share-uuid-1',
    groupSlug: 'private-1',
    landscapeSlug: 'private-2',
  });
  useNavigate.mockReturnValue(jest.fn());
  useLocation.mockReturnValue({
    pathname:
      '/groups/private-1/shared-resource/download/72bd83f7-229e-4770-a686-42f5a922468b',
  });

  useDownloadEvent.mockReturnValue({
    onDownload: jest.fn(),
  });
});

test('SharedResourceDownload: Has access', async () => {
  setupData();
  await setup();

  expect(
    screen.getByRole('heading', { name: 'map.geojson' })
  ).toBeInTheDocument();
  const downloadButton = screen.getByRole('button', { name: 'Download File' });
  await act(async () => fireEvent.click(downloadButton));

  expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
});

test('SharedResourceDownload: No access', async () => {
  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('query sharedResource'),
      expect.anything()
    )
    .mockResolvedValue({
      sharedResource: null,
    });
  await setup();

  expect(
    screen.getByRole('heading', { name: 'Page not found' })
  ).toBeInTheDocument();
});

test('SharedResourceDownload: Login redirect', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('query sharedResource'),
      expect.anything()
    )
    .mockResolvedValue({
      sharedResource: null,
    });
  await setup({ currentUser: {} });

  expect(navigate).toHaveBeenCalledWith(
    '/account?referrer=%2Fgroups%2Fprivate-1%2Fshared-resource%2Fdownload%2F72bd83f7-229e-4770-a686-42f5a922468b'
  );
});

test('SharedResourceDownload: Group download event', async () => {
  const { onDownload } = useDownloadEvent();
  setupData();
  await setup(DEFAULT_ACCOUNT, 'group');

  const downloadButton = screen.getByRole('button', { name: 'Download File' });
  await act(async () => fireEvent.click(downloadButton));

  expect(onDownload).toHaveBeenCalledWith(
    'group',
    'private-1',
    'download page'
  );
});

test('SharedResourceDownload: Landscape download event', async () => {
  const { onDownload } = useDownloadEvent();
  setupData();
  await setup(DEFAULT_ACCOUNT, 'landscape');

  const downloadButton = screen.getByRole('button', { name: 'Download File' });
  await act(async () => fireEvent.click(downloadButton));

  expect(onDownload).toHaveBeenCalledWith(
    'landscape',
    'private-2',
    'download page'
  );
});
