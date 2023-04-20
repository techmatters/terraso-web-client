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
import _ from 'lodash/fp';

import * as terrasoApi from 'state/terrasoBackend/api';
import {
  UserFragment,
  UserPreferenceNode,
  UserPreferencesFragment,
  userFields,
  userPreferences,
  userPreferencesFields,
} from 'state/user/userFragments';

import { TERRASO_API_URL } from 'config';

import { User } from './accountSlice';
import { getUserEmail } from './auth';

const parsePreferences = (
  user: UserFragment & Partial<UserPreferencesFragment>
): User => ({
  ...user,
  preferences: _.fromPairs(
    user.preferences?.edges.map(({ node: { key, value } }) => [key, value])
  ),
});

const getURL = (provider: string) =>
  fetch(new URL(`/auth/${provider}/authorize`, TERRASO_API_URL).href, {
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.json())
    .then(response => response.request_url);

export const getAuthURLs = () =>
  Promise.all([getURL('google'), getURL('apple'), getURL('microsoft')]).then(
    ([google, apple, microsoft]) => ({
      google,
      apple,
      microsoft,
    })
  );

type UserQuery = {
  users: {
    edges: {
      node: UserFragment & UserPreferencesFragment;
    }[];
  };
};

export const fetchProfile = async (
  params: any,
  currentUser: { email: string } | null
) => {
  const query = `
    query user($email: String!){
      users(email: $email) {
        edges {
          node {
            ...userFields
            ...userPreferences
          }
        }
      }
    }
    ${userFields}
    ${userPreferences}
  `;
  const result = await terrasoApi.requestGraphQL<UserQuery>(query, {
    email: currentUser?.email,
  });

  const user = result.users.edges.at(0);
  if (user === undefined) {
    return Promise.reject('not_found');
  }
  return parsePreferences(user.node);
};

// TODO: this is a temporary solution to get the user's email address,
// the API should have a account query to get the logged in user data
export const fetchUser = async () => {
  const email = getUserEmail();
  return fetchProfile(null, email === undefined ? null : { email });
};

type UpdateUserMutation = {
  updateUser: {
    user: UserFragment;
  };
};
export const saveUser = (user: User) => {
  const query = `
    mutation updateUser($input: UserUpdateMutationInput!) {
      updateUser(input: $input) {
        user { ...userFields }
        errors
      }
    }
    ${userFields}
  `;
  return terrasoApi
    .requestGraphQL<UpdateUserMutation>(query, {
      input: _.omit(['profileImage', 'email', 'preferences'], user),
    })
    .then(resp => parsePreferences(resp.updateUser.user));
};

type UpdateUserPreferenceMutation = {
  updateUserPreference: {
    preference: UserPreferenceNode['node'];
  };
};
export const savePreference = async (
  { key, value }: { key: string; value: string },
  currentUser: UserFragment | null
) => {
  const query = `
    mutation updateUserPreference($input: UserPreferenceUpdateInput!) {
      updateUserPreference(input: $input) {
        preference { ...userPreferencesFields }
        errors
      }
    }
    ${userPreferencesFields}
  `;
  const result = await terrasoApi.requestGraphQL<UpdateUserPreferenceMutation>(
    query,
    {
      input: {
        userEmail: currentUser?.email,
        key,
        value,
      },
    }
  );
  return result.updateUserPreference.preference;
};

type UnsubscribeUserMutation = {
  unsubscribeUser: {
    errors: any;
  };
};
export const unsubscribeFromNotifications = (token: string) => {
  const query = `
    mutation unsubscribeUser($input: UserUnsubscribeUpdateInput!) {
      unsubscribeUser(input: $input) {
        errors
      }
    }
  `;
  return terrasoApi.requestGraphQL<UnsubscribeUserMutation>(query, {
    input: {
      token,
    },
  });
};

export const signOut = async () => {
  const response = await fetch(new URL(`/auth/logout`, TERRASO_API_URL).href, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    await Promise.reject(response);
  }
};
