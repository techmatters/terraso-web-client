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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';
import { useParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import { getPlaceInfoByName } from 'terraso-web-client/gis/gisService';
import LandscapeNew from 'terraso-web-client/landscape/components/LandscapeForm/New';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('terraso-web-client/gis/gisService');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

const setup = async () => {
  await render(<LandscapeNew />, {
    account: {
      currentUser: {
        data: {
          email: 'email@account.org',
        },
      },
    },
  });
  const name = screen.getByRole('textbox', {
    name: 'Name (required)',
  });
  const description = screen.getByRole('textbox', {
    name: 'Description (required)',
  });
  const email = screen.getByRole('textbox', { name: 'Email address' });
  const website = screen.getByRole('textbox', { name: 'Website' });
  const location = screen.getByRole('combobox', {
    name: 'Country or region (required)',
  });

  const changeLocation = async newLocation => {
    await act(async () => fireEvent.mouseDown(location));
    const listbox = within(screen.getByRole('listbox'));
    await act(async () =>
      fireEvent.click(listbox.getByRole('option', { name: newLocation }))
    );
  };

  return {
    inputs: {
      name,
      description,
      email,
      website,
      location,
      changeLocation,
    },
  };
};

const handleQueryRequests = query => {
  if (query.startsWith('query taxonomyTerms')) {
    return Promise.resolve({
      taxonomyTerms: {
        edges: [],
      },
    });
  }
  if (query.startsWith('query groups')) {
    return Promise.resolve({
      independentGroups: {
        edges: [],
      },
      landscapeGroups: {
        edges: [],
      },
    });
  }
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: null,
  });

  getPlaceInfoByName.mockResolvedValue({
    boundingbox: ['-0.489', '51.28', '0.236', '51.686'],
  });
});

test('LandscapeNew: Input change', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    const queryRequests = handleQueryRequests(trimmedQuery);
    if (queryRequests) {
      return queryRequests;
    }
  });
  const { inputs } = await setup();

  expect(inputs.name).toHaveValue('');
  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  expect(inputs.name).toHaveValue('New name');

  expect(inputs.description).toHaveValue('');
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  expect(inputs.description).toHaveValue('New description');

  expect(inputs.website).toHaveValue('');
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } });
  expect(inputs.website).toHaveValue('www.other.org');

  expect(inputs.location).toHaveTextContent('Landscape location');
  await inputs.changeLocation('Ecuador');
  expect(inputs.location).toHaveTextContent('Ecuador');
});
test('LandscapeNew: Input validation', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    const queryRequests = handleQueryRequests(trimmedQuery);
    if (queryRequests) {
      return queryRequests;
    }
  });
  const { inputs } = await setup();

  expect(inputs.name).toHaveValue('');
  fireEvent.change(inputs.name, { target: { value: '' } });
  expect(inputs.name).toHaveValue('');

  expect(inputs.description).toHaveValue('');
  fireEvent.change(inputs.description, { target: { value: '' } });
  expect(inputs.description).toHaveValue('');

  expect(inputs.website).toHaveValue('');
  fireEvent.change(inputs.website, { target: { value: 'wwwotherorg' } });
  expect(inputs.website).toHaveValue('wwwotherorg');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add Landscape' }))
  );
  expect(screen.getByText(/Enter a name/i)).toBeInTheDocument();
  expect(screen.getByText(/Enter a description/i)).toBeInTheDocument();
  expect(screen.getByText(/Enter a valid web address/i)).toBeInTheDocument();
});
test('LandscapeNew: Save form', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    const queryRequests = handleQueryRequests(trimmedQuery);
    if (queryRequests) {
      return queryRequests;
    }

    if (trimmedQuery.startsWith('mutation addLandscape')) {
      return Promise.resolve({
        addLandscape: {
          landscape: {
            id: '1',
            name: 'Landscape Name',
            description: 'Landscape Description',
            website: 'https://www.landscape.org',
            location: 'EC',
          },
        },
      });
    }
  });

  const { inputs } = await setup();

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.email, {
    target: { value: 'info@other.org' },
  });
  fireEvent.change(inputs.website, {
    target: { value: 'https://www.other.org' },
  });
  await inputs.changeLocation('Argentina');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add Landscape' }))
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(saveCall[1]).toStrictEqual({
    input: {
      description: 'New description',
      name: 'New name',
      email: 'info@other.org',
      website: 'https://www.other.org',
      location: 'AR',
    },
  });
});
test('LandscapeNew: Save form error', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    const queryRequests = handleQueryRequests(trimmedQuery);
    if (queryRequests) {
      return queryRequests;
    }

    if (trimmedQuery.startsWith('mutation addLandscape')) {
      return Promise.reject('Save Error');
    }
  });

  const { inputs } = await setup();

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.website, {
    target: { value: 'https://www.other.org' },
  });
  await inputs.changeLocation('Argentina');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add Landscape' }))
  );

  // Test error display
  expect(screen.getByText(/Save Error/i)).toBeInTheDocument();

  // Test update values still in the form
  expect(inputs.name).toHaveValue('New name');
  expect(inputs.description).toHaveValue('New description');
  expect(inputs.website).toHaveValue('https://www.other.org');
  expect(inputs.location).toHaveTextContent('Argentina');
});
test('LandscapeNew: Save form (add)', async () => {
  useParams.mockReturnValue({ slug: null });
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    const queryRequests = handleQueryRequests(trimmedQuery);
    if (queryRequests) {
      return queryRequests;
    }

    if (trimmedQuery.startsWith('mutation addLandscape')) {
      return Promise.resolve({
        addLandscape: {
          landscape: {
            name: 'New name',
            description: 'New description',
            email: 'info@other.org',
            website: 'http://www.other.org',
            location: 'AR',
          },
        },
      });
    }
    if (trimmedQuery.startsWith('mutation updateLandscape')) {
      return Promise.resolve({
        updateLandscape: {
          landscape: {
            name: 'New name',
            description: 'New description',
            website: 'http://www.other.org',
            location: 'AR',
          },
        },
      });
    }
  });

  const { inputs } = await setup();

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.email, {
    target: { value: 'other@other.org' },
  });
  fireEvent.change(inputs.website, {
    target: { value: 'http://www.other.org' },
  });
  await inputs.changeLocation('Ecuador');
  expect(inputs.location).toHaveTextContent('Ecuador');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add Landscape' }))
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Skip this step for now' })
    ).toBeInTheDocument();
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Skip this step for now' })
    )
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(4);
  const initialSaveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(initialSaveCall[1]).toStrictEqual({
    input: {
      description: 'New description',
      name: 'New name',
      email: 'other@other.org',
      website: 'http://www.other.org',
      location: 'EC',
    },
  });

  const lastSaveCall = terrasoApi.requestGraphQL.mock.calls[3];
  expect(lastSaveCall[1].input.areaPolygon).toBeNull();
});

test('LandscapeNew: OSM API error', async () => {
  getPlaceInfoByName.mockRejectedValue('gis.openstreetmap_api_error');
  useParams.mockReturnValue({ slug: null });
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    const queryRequests = handleQueryRequests(trimmedQuery);
    if (queryRequests) {
      return queryRequests;
    }

    if (trimmedQuery.startsWith('mutation addLandscape')) {
      return Promise.resolve({
        addLandscape: {
          landscape: {
            name: 'New name',
            description: 'New description',
            email: 'info@other.org',
            website: 'http://www.other.org',
            location: 'AR',
          },
        },
      });
    }
    if (trimmedQuery.startsWith('mutation updateLandscape')) {
      return Promise.resolve({
        updateLandscape: {
          landscape: {
            name: 'New name',
            description: 'New description',
            website: 'http://www.other.org',
            location: 'AR',
          },
        },
      });
    }
  });

  const { inputs } = await setup();

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.email, {
    target: { value: 'other@other.org' },
  });
  fireEvent.change(inputs.website, {
    target: { value: 'http://www.other.org' },
  });
  await inputs.changeLocation('Ecuador');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add Landscape' }))
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Skip this step for now' })
    ).toBeInTheDocument();
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Skip this step for now' })
    )
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  );
});
