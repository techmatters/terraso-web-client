import _ from 'lodash/fp';

import * as terrasoApi from 'terrasoBackend/api';

export const uploadSharedData = async ({ groupSlug, file }) => {
  const path = '/shared-data/upload/';

  const body = new FormData();
  const filename = `${file.name}${file.resourceType}`;
  body.append('groups', groupSlug);
  body.append('name', file.name);
  if (file.description) {
    body.append('description', file.description);
  }
  body.append('data_file', file.file, filename);

  const jsonResponse = await terrasoApi.request({ path, body });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return jsonResponse;
};

export const deleteSharedData = ({ file }) => {
  const query = `
    mutation deleteSharedData($id: ID!) {
      deleteDataEntry(input: { id: $id }) {
        dataEntry {
          id
        }
      }
    }
  `;
  return terrasoApi.requestGraphQL(query, {
    id: file.id,
  });
};

export const updateSharedData = ({ file }) => {
  const query = `
    mutation updateSharedData($input: DataEntryUpdateMutationInput!) {
      updateDataEntry(input: $input) {
        dataEntry {
          id
        }
      }
    }
  `;
  return terrasoApi.requestGraphQL(query, {
    input: file,
  });
};
