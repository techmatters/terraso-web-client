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
import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';
import * as terrasoApi from 'terrasoApi/terrasoBackend/api';
import AccountProfile from 'account/components/AccountProfile';

jest.mock('terrasoApi/terrasoBackend/api');

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
    fireEvent.mouseDown(screen.getByRole('button', { name: /English/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /Español/i }))
  );
  expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();

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

test('AccountProfile: Save notifications', async () => {
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
                { node: { key: 'notifications', value: 'false' } },
              ],
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
          { key: 'notifications', value: 'true' },
          {}
        )
      );
    }
  });

  await setup();

  const checkbox = screen.getByRole('checkbox');

  expect(checkbox.checked).toEqual(false);
  await act(async () => fireEvent.click(checkbox));
  expect(checkbox.checked).toEqual(true);

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(4);
  expect(terrasoApi.requestGraphQL.mock.calls[3][1]).toStrictEqual({
    input: {
      key: 'notifications',
      userEmail: 'group@group.org',
      value: 'true',
    },
  });
});

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
