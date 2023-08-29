import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

jest.mock('terraso-client-shared/terrasoApi/api');

export const mockTerrasoAPIrequestGraphQL = mockedResponses => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    const foundQuery = Object.keys(mockedResponses).find(mockedResponseQuery =>
      trimmedQuery.startsWith(mockedResponseQuery)
    );
    return mockedResponses[foundQuery];
  });
};
