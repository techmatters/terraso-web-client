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
  Promise.all([getURL('google'), getURL('apple')]).then(([google, apple]) => ({
    google,
    apple,
  }));

export const fetchUser = () => {
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
    .request(query, { email: getUserEmail() })
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
      }
    }
    ${userFields}
  `;
  return terrasoApi
    .request(query, {
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
      }
    }
    ${userPreferencesFields}
  `;
  return terrasoApi
    .request(query, {
      input: {
        userEmail: currentUser.email,
        key,
        value,
      },
    })
    .then(_.get('updateUserPreference.preference'));
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
