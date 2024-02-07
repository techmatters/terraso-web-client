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
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import SharedResourceDownload from './SharedResourceDownload';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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

const setup = async (account = DEFAULT_ACCOUNT) => {
  await render(<SharedResourceDownload />, {
    account,
  });
};

beforeEach(() => {
  window.open = jest.fn();
  useParams.mockReturnValue({
    shareUuid: 'share-uuid-1',
  });
  useNavigate.mockReturnValue(jest.fn());
  useLocation.mockReturnValue({
    pathname:
      '/groups/private-1/shared-resource/download/72bd83f7-229e-4770-a686-42f5a922468b',
  });
});

test('SharedResourceDownload: Has access', async () => {
  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('query sharedResource'),
      expect.anything()
    )
    .mockResolvedValue({
      sharedResource: {
        downloadUrl: 'https://test-url',
        source: {
          name: 'map',
          resourceType: 'geojson',
        },
      },
    });
  await setup();

  expect(
    screen.getByRole('heading', { name: 'map.geojson' })
  ).toBeInTheDocument();
  const downloadButton = screen.getByRole('button', { name: 'Download File' });
  await act(async () => fireEvent.click(downloadButton));

  expect(window.open).toHaveBeenCalledWith('https://test-url', '_blank');
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
