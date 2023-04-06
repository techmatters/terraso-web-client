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

import { getUserEmail } from 'account/auth';
import * as terrasoApi from 'terrasoBackend/api';
import {
  userFields,
  userPreferences,
  userPreferencesFields,
} from 'user/userFragments';

import { TERRASO_API_URL } from 'config';

const parsePreferences = user =>
  _.flow(
    _.getOr([], 'preferences.edges'),
    _.map(({ node }) => [node.key, node.value]),
    _.fromPairs
  )(user);

const getURL = provider =>
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

export const fetchUser = (params, currentUser ) => {
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
  return terrasoApi
    .requestGraphQL(query, { email: currentUser.email })
    .then(_.get('users.edges[0].node'))
    .then(user => user || Promise.reject('not_found'))
    .then(user => ({
      ..._.omit('preferences', user),
      preferences: parsePreferences(user),
    }));
};

export const saveUser = user => {
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
    .requestGraphQL(query, {
      input: _.omit(['profileImage', 'email', 'preferences'], user),
    })
    .then(response => ({
      ..._.omit('preferences', response.updateUser.user),
      preferences: parsePreferences(response.updateUser.user),
    }));
};

export const savePreference = ({ key, value }, currentUser) => {
  const query = `
    mutation updateUserPreference($input: UserPreferenceUpdateInput!) {
      updateUserPreference(input: $input) {
        preference { ...userPreferencesFields }
        errors
      }
    }
    ${userPreferencesFields}
  `;
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        userEmail: currentUser.email,
        key,
        value,
      },
    })
    .then(_.get('updateUserPreference.preference'));
};

export const unsubscribeFromNotifications = token => {
  const query = `
    mutation unsubscribeUser($input: UserUnsubscribeUpdateInput!) {
      unsubscribeUser(input: $input) {
        errors
      }
    }
  `;
  return terrasoApi.requestGraphQL(query, {
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
