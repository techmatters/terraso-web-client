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
import { LANDSCAPE_TYPES_WITH_REDIRECTS } from 'tests/constants';

import LandscapeSharedDataUpload from './LandscapeSharedDataUpload';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const setup = async (userRole = 'member') => {
  const landscape = _.set(
    'landscapes.edges[0].node',
    {
      id: 'landscape-id',
      name: 'Landscape Name',
      slug: 'slug-1',
      membershipList: {
        accountMembership: {
          userRole,
          membershipStatus: 'APPROVED',
        },
      },
    },
    {}
  );
  terrasoApi.requestGraphQL.mockResolvedValueOnce(landscape);
  terrasoApi.requestGraphQL.mockResolvedValueOnce(landscape);
  await render(<LandscapeSharedDataUpload />, {
    account: {
      currentUser: {
        data: {
          email: 'email@example.com',
          firstName: 'First',
          lastName: 'Last',
        },
      },
    },
  });

  const linksTab = screen.getByRole('tab', { name: 'Share Links' });
  await act(async () => fireEvent.click(linksTab));
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  useNavigate.mockReturnValue(() => {});
});

Object.keys(LANDSCAPE_TYPES_WITH_REDIRECTS).forEach(currentLandscape =>
  test(`LandscapeSharedDataUpload: Redirection: ${currentLandscape}`, async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    await setup(LANDSCAPE_TYPES_WITH_REDIRECTS[currentLandscape].userRole);

    expect(navigate).toHaveBeenCalledTimes(
      LANDSCAPE_TYPES_WITH_REDIRECTS[currentLandscape].uploadRedirectCount
    );
  })
);

test('LandscapeSharedDataUpload: Error - Empty name', async () => {
  await setup();
  const linkSection = screen.getByRole('region', { name: 'Link 1' });
  const name = within(linkSection).getByRole('textbox', {
    name: 'Title (required)',
  });
  fireEvent.change(name, { target: { value: 'value' } });
  fireEvent.change(name, { target: { value: '' } });
  fireEvent.blur(name);

  expect(
    await within(linkSection).findByText('Enter a title.')
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Share Files and Links' })
    ).toHaveAttribute('disabled')
  );
});

test('LandscapeSharedDataUpload: Error - API', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue('Test Error');
  await setup();
  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });
  const linkSection = screen.getByRole('region', { name: 'Link 1' });
  fireEvent.change(
    within(linkSection).getByRole('textbox', {
      name: 'Title (required)',
    }),
    { target: { value: 'name' } }
  );
  fireEvent.change(
    within(linkSection).getByRole('textbox', {
      name: 'Web Address (required)',
    }),
    { target: { value: 'test.com' } }
  );
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  const linkSectionWithName = screen.getByRole('region', { name: 'name' });
  expect(
    await within(linkSectionWithName).findByText(
      'Oops, something went wrong. Try again in a few minutes. (Error: Test Error)'
    )
  ).toBeInTheDocument();
});

test('LandscapeSharedDataUpload: Error - Invalid TLD', async () => {
  await setup();
  const linkSection = screen.getByRole('region', { name: 'Link 1' });
  const name = within(linkSection).getByRole('textbox', {
    name: 'Web Address (required)',
  });
  fireEvent.change(name, { target: { value: 'test.c' } });
  fireEvent.blur(name);

  expect(
    await within(linkSection).findByText('Enter a valid web address.')
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Share Files and Links' })
    ).toHaveAttribute('disabled')
  );
});

test('LandscapeSharedDataUpload: Partial Success', async () => {
  await setup();
  terrasoApi.requestGraphQL.mockRejectedValueOnce('Test Error');
  terrasoApi.requestGraphQL.mockResolvedValueOnce(
    _.set(
      'addDataEntry.dataEntry',
      { name: 'name 2', url: 'https://test.com' },
      {}
    )
  );
  const addLinkButton = screen.getByRole('button', {
    name: 'Add Another Link',
  });
  await act(async () => fireEvent.click(addLinkButton));
  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });

  const linkSection1 = screen.getByRole('region', { name: 'Link 1' });
  fireEvent.change(
    within(linkSection1).getByRole('textbox', {
      name: 'Title (required)',
    }),
    { target: { value: 'name 1' } }
  );
  fireEvent.change(
    within(linkSection1).getByRole('textbox', {
      name: 'Web Address (required)',
    }),
    { target: { value: 'test1.com' } }
  );

  const linkSection2 = screen.getByRole('region', { name: 'Link 2' });
  fireEvent.change(
    within(linkSection2).getByRole('textbox', {
      name: 'Title (required)',
    }),
    { target: { value: 'name 2' } }
  );
  fireEvent.change(
    within(linkSection2).getByRole('textbox', {
      name: 'Web Address (required)',
    }),
    { target: { value: 'test1.com' } }
  );

  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));

  expect(screen.getByRole('region', { name: 'name 1' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'name 2' })).toBeInTheDocument();

  await act(async () => fireEvent.click(uploadButton));
  const link1 = screen.getByRole('region', { name: 'name 1' });
  expect(
    await within(link1).findByText(
      'Oops, something went wrong. Try again in a few minutes. (Error: Test Error)'
    )
  ).toBeInTheDocument();
  const link2 = screen.getByRole('region', { name: 'name 2' });
  expect(
    await within(link2).findByText('This link has been shared successfully.')
  ).toBeInTheDocument();
});

test('LandscapeSharedDataUpload: Complete Success', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  await setup();

  expect(navigate).toHaveBeenCalledTimes(0);
  terrasoApi.requestGraphQL.mockResolvedValueOnce(
    _.set(
      'addDataEntry.dataEntry',
      { name: 'name 1', url: 'https://test.com' },
      {}
    )
  );
  const linkSection1 = screen.getByRole('region', { name: 'Link 1' });
  fireEvent.change(
    within(linkSection1).getByRole('textbox', {
      name: 'Title (required)',
    }),
    { target: { value: 'name 1' } }
  );
  fireEvent.change(
    within(linkSection1).getByRole('textbox', {
      name: 'Web Address (required)',
    }),
    { target: { value: 'test1.com' } }
  );
  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });
  await waitFor(() => expect(uploadButton).not.toHaveAttribute('disabled'));
  await act(async () => fireEvent.click(uploadButton));
  expect(navigate.mock.calls[0]).toEqual([
    {
      pathname: '/landscapes/slug-1',
      search: 'scrollTo=shared-data-card-title',
    },
  ]);
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(saveCall[1]).toStrictEqual({
    input: {
      description: '',
      entryType: 'link',
      targetType: 'landscape',
      targetSlug: 'slug-1',
      name: 'name 1',
      resourceType: 'link',
      url: 'https://test1.com',
    },
  });
});
