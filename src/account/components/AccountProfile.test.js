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
import { fireEvent, render, screen, within } from 'tests/utils';
import React from 'react';
import { when } from 'jest-when';
import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import AccountProfile from 'account/components/AccountProfile';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

const setup = async (
  initialState = {
    account: {
      profile: {
        fetching: true,
        data: null,
      },
      currentUser: {
        data: {
          email: 'group@group.org',
        },
      },
    },
  }
) => {
  await render(<AccountProfile />, initialState);
  const firstName = screen.getByRole('textbox', {
    name: 'Given names (required)',
  });
  const lastName = screen.getByRole('textbox', { name: 'Family names' });
  return {
    inputs: {
      firstName,
      lastName,
    },
  };
};

beforeEach(() => {
  useNavigate.mockReturnValue(jest.fn());
  useParams.mockReturnValue({});
  useSearchParams.mockReturnValue([new URLSearchParams(), () => {}]);
});

test('AccountProfile: Display Avatar', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve(
      _.set(
        'users.edges[0].node',
        {
          firstName: 'John',
          lastName: 'Doe',
          profileImage: 'test.com',
          preferences: { edges: [] },
        },
        {}
      )
    )
  );
  await setup();
  expect(screen.getByRole('img', { name: 'John Doe' })).toBeInTheDocument();
});

test('AccountProfile: Avatar with missing image', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve(
      _.set(
        'users.edges[0].node',
        {
          firstName: 'John',
          lastName: 'Doe',
          profileImage: '',
          preferences: { edges: [] },
        },
        {}
      )
    )
  );
  await setup();
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(
    screen.queryByRole('img', { name: 'John Doe' })
  ).not.toBeInTheDocument();
});

test('AccountProfile: Save', async () => {
  terrasoApi.requestGraphQL.mockReturnValueOnce(
    Promise.resolve(
      _.set(
        'users.edges[0].node',
        {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'group@group.org',
          profileImage: '',
          preferences: { edges: [] },
        },
        {}
      )
    )
  );
  terrasoApi.requestGraphQL.mockReturnValueOnce(
    Promise.resolve(
      _.set(
        'users.edges[0].node',
        {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'group@group.org',
          profileImage: '',
          preferences: { edges: [] },
        },
        {}
      )
    )
  );
  terrasoApi.requestGraphQL.mockResolvedValueOnce(
    _.set(
      'updateUser.user',
      {
        id: '1',
        firstName: 'Pablo',
        lastName: 'Perez',
        email: 'group@group.org',
        profileImage: 'https://www.group.org/image.jpg',
        preferences: {
          edges: [{ node: { key: 'language', value: 'es-ES' } }],
        },
      },
      {}
    )
  );

  const { inputs } = await setup();

  fireEvent.change(inputs.firstName, { target: { value: 'Pablo' } });
  fireEvent.change(inputs.lastName, { target: { value: 'Perez' } });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
  expect(terrasoApi.requestGraphQL.mock.calls[2][1]).toStrictEqual({
    input: {
      id: 'user-id',
      firstName: 'Pablo',
      lastName: 'Perez',
    },
  });
});

test('AccountProfile: Save language', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('query userProfile(')) {
      return Promise.resolve(
        _.set(
          'users.edges[0].node',
          {
            id: 'user-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'group@group.org',
            profileImage: '',
            preferences: { edges: [] },
          },
          {}
        )
      );
    }
    if (trimmedQuery.startsWith('mutation updateUser(')) {
      return Promise.resolve(
        _.set(
          'updateUser.user',
          {
            id: '1',
            firstName: 'Pablo',
            lastName: 'Perez',
            email: 'group@group.org',
            profileImage: 'https://www.group.org/image.jpg',
            preferences: {
              edges: [{ node: { key: 'language', value: 'es-ES' } }],
            },
          },
          {}
        )
      );
    }
    if (trimmedQuery.startsWith('mutation updateUserPreference(')) {
      return Promise.resolve(
        _.set(
          'updateUserPreference.preference',
          { key: 'language', value: 'es-ES' },
          {}
        )
      );
    }
  });

  const { inputs } = await setup();

  fireEvent.change(inputs.firstName, { target: { value: 'Pablo' } });
  fireEvent.change(inputs.lastName, { target: { value: 'Perez' } });

  expect(screen.getByText('English')).toBeInTheDocument();
  await act(async () =>
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /English/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /Español/i }))
  );
  expect(
    screen.getByRole('combobox', { name: /Español/i })
  ).toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(4);
  expect(terrasoApi.requestGraphQL.mock.calls[2][1]).toStrictEqual({
    input: {
      id: 'user-id',
      firstName: 'Pablo',
      lastName: 'Perez',
    },
  });
  expect(terrasoApi.requestGraphQL.mock.calls[3][1]).toStrictEqual({
    input: {
      key: 'language',
      userEmail: 'group@group.org',
      value: 'es-ES',
    },
  });
});

const testNotificationsSetting = async (key, checkboxLabel) => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('query userProfile(')) {
      return Promise.resolve(
        _.set(
          'users.edges[0].node',
          {
            id: 'user-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'group@group.org',
            profileImage: '',
            preferences: { edges: [] },
          },
          {}
        )
      );
    }
    if (trimmedQuery.startsWith('mutation updateUser(')) {
      return Promise.resolve(
        _.set(
          'updateUser.user',
          {
            id: '1',
            firstName: 'Pablo',
            lastName: 'Perez',
            email: 'group@group.org',
            profileImage: 'https://www.group.org/image.jpg',
            preferences: {
              edges: [
                { node: { key: 'language', value: 'es-ES' } },
                { node: { key: 'group_notifications', value: 'false' } },
              ],
            },
          },
          {}
        )
      );
    }
    if (trimmedQuery.startsWith('mutation updateUserPreference(')) {
      return Promise.resolve(
        _.set('updateUserPreference.preference', { key, value: 'true' }, {})
      );
    }
  });

  await setup();

  const checkbox = screen.getByRole('checkbox', {
    name: checkboxLabel,
  });

  expect(checkbox.checked).toEqual(false);
  await act(async () => fireEvent.click(checkbox));
  expect(checkbox.checked).toEqual(true);

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(4);
  expect(terrasoApi.requestGraphQL.mock.calls[3][1]).toStrictEqual({
    input: {
      key,
      userEmail: 'group@group.org',
      value: 'true',
    },
  });
};

test('AccountProfile: Save group notifications', async () =>
  testNotificationsSetting(
    'group_notifications',
    'A group I manage has pending requests or my request to join a closed group is approved'
  ));

test('AccountProfile: Save story map notifications', async () =>
  testNotificationsSetting(
    'story_map_notifications',
    'I am invited to edit a story map'
  ));

test('AccountProfile: Save error', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('query userProfile(')) {
      return Promise.resolve(
        _.set(
          'users.edges[0].node',
          {
            id: 'user-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'group@group.org',
            profileImage: '',
            preferences: { edges: [] },
          },
          {}
        )
      );
    }
    if (trimmedQuery.startsWith('mutation updateUser(')) {
      return Promise.reject('Save Error');
    }
  });

  const { inputs } = await setup();

  fireEvent.change(inputs.firstName, { target: { value: 'Pablo' } });
  fireEvent.change(inputs.lastName, { target: { value: 'Perez' } });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);

  // Test error display
  expect(screen.getByText(/Save Error/i)).toBeInTheDocument();
});

test('AccountProfile: Complete profile', async () => {
  useParams.mockReturnValue({
    completeProfile: 'completeProfile',
  });
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  when(terrasoApi.requestGraphQL)
    .calledWith(expect.stringContaining('query userProfile'), expect.anything())
    .mockReturnValue(
      Promise.resolve(
        _.set(
          'users.edges[0].node',
          {
            id: 'user-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'group@group.org',
            profileImage: '',
            preferences: { edges: [] },
          },
          {}
        )
      )
    );

  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('mutation updateUser'),
      expect.anything()
    )
    .mockResolvedValue(
      _.set(
        'updateUser.user',
        {
          id: '1',
          firstName: 'Pablo',
          lastName: 'Perez',
          email: 'group@group.org',
          profileImage: 'https://www.group.org/image.jpg',
          preferences: {
            edges: [{ node: { key: 'language', value: 'es-ES' } }],
          },
        },
        {}
      )
    );

  await setup();

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Tell us what to call you and review your profile settings.'
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
  );
  expect(navigate).toHaveBeenCalledWith('/', { replace: true });
});

test('AccountProfile: Navigate to referrer after complete profile', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  const searchParams = new URLSearchParams();
  const referrer = encodeURIComponent('groups?sort=-name&other=1');
  searchParams.set('referrer', referrer);
  useSearchParams.mockReturnValue([searchParams]);
  useParams.mockReturnValue({
    completeProfile: 'completeProfile',
  });

  when(terrasoApi.requestGraphQL)
    .calledWith(expect.stringContaining('query userProfile'), expect.anything())
    .mockReturnValue(
      Promise.resolve(
        _.set(
          'users.edges[0].node',
          {
            id: 'user-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'group@group.org',
            profileImage: '',
            preferences: { edges: [] },
          },
          {}
        )
      )
    );

  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('mutation updateUser'),
      expect.anything()
    )
    .mockResolvedValue(
      _.set(
        'updateUser.user',
        {
          id: '1',
          firstName: 'Pablo',
          lastName: 'Perez',
          email: 'group@group.org',
          profileImage: 'https://www.group.org/image.jpg',
          preferences: {
            edges: [{ node: { key: 'language', value: 'es-ES' } }],
          },
        },
        {}
      )
    );

  await setup();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
  );
  expect(navigate).toHaveBeenCalledWith('groups?sort=-name&other=1', {
    replace: true,
  });
});
