import _ from 'lodash';

import { getUserEmail } from 'account/auth';
import { userFields } from 'account/accountFragments';
import * as terrasoApi from 'terrasoBackend/api';
import { TERRASO_API_URL } from 'config';

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
          }
        }
      }
    }
    ${userFields}
  `;
  return terrasoApi
    .request(query, { email: getUserEmail() })
    .then(response => _.get(response, 'users.edges[0].node'))
    .then(user => user || Promise.reject('account.not_found'));
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
    .request(query, { input: _.omit(user, ['profileImage', 'email']) })
    .then(response => response.updateUser.user);
};
