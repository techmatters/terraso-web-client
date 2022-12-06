import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';

import React from 'react';

import _ from 'lodash/fp';
import { useNavigate, useParams } from 'react-router-dom';

import * as terrasoApi from 'terrasoBackend/api';

import LandscapeSharedDataUpload from './LandscapeSharedDataUpload';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const setup = async () => {
  const landscape = _.set(
    'landscapes.edges[0].node',
    {
      id: 'landscape-id',
      name: 'Landscape Name',
      defaultGroup: _.set(
        'edges[0].node',
        {
          id: 'group-id',
          slug: 'group-slug',
        },
        {}
      ),
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

  const linksTab = screen.getByRole('tab', { name: 'Share links' });
  await act(async () => fireEvent.click(linksTab));
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  useNavigate.mockReturnValue(() => {});
});

test('LandscapeSharedDataUpload: Error - Empty name', async () => {
  await setup();
  const linkSection = screen.getByRole('region', { name: 'Link 1' });
  const name = within(linkSection).getByRole('textbox', {
    name: 'Name (required)',
  });
  fireEvent.change(name, { target: { value: 'value' } });
  fireEvent.change(name, { target: { value: '' } });
  expect(
    await within(linkSection).findByText('name is required')
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
      name: 'Name (required)',
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
      'Oops, something went wrong. Please try it again in a few minutes. (Error: Test Error)'
    )
  ).toBeInTheDocument();
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
    name: 'Add link',
  });
  await act(async () => fireEvent.click(addLinkButton));
  const uploadButton = screen.getByRole('button', {
    name: 'Share Files and Links',
  });

  const linkSection1 = screen.getByRole('region', { name: 'Link 1' });
  fireEvent.change(
    within(linkSection1).getByRole('textbox', {
      name: 'Name (required)',
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
      name: 'Name (required)',
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
      'Oops, something went wrong. Please try it again in a few minutes. (Error: Test Error)'
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
      name: 'Name (required)',
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
});
