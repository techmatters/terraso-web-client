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
import { act, fireEvent, render, screen, within } from 'tests/utils';
import React from 'react';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import KeyInfoUpdate from 'landscape/components/LandscapeForm/KeyInfoUpdate';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const setup = async (countryName = 'Landscape location') => {
  await render(<KeyInfoUpdate />, {
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
    name: `Country or region (required)`,
  });
  expect(within(location).getByText(countryName)).toBeInTheDocument();

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

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
});

test('KeyInfoUpdate: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue(['Load error']);
  await render(<KeyInfoUpdate />, {
    account: {
      currentUser: {
        data: {
          email: 'email@account.org',
        },
      },
    },
  });
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('KeyInfoUpdate: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await render(<KeyInfoUpdate />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('KeyInfoUpdate: Fill form', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'https://www.landscape.org',
              location: 'EC',
            },
          },
        ],
      },
    })
  );
  const { inputs } = await setup('Ecuador');

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(inputs.name).toHaveValue('Landscape Name');
  expect(inputs.description).toHaveValue('Landscape Description');
  expect(inputs.website).toHaveValue('https://www.landscape.org');
  expect(inputs.location).toHaveTextContent('Ecuador');
});
test('KeyInfoUpdate: Helper Text', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'https://www.landscape.org',
              location: 'EC',
            },
          },
        ],
      },
    })
  );
  await setup('Ecuador');

  const helpButton = screen.getByRole('button', {
    name: 'Information about Name',
  });
  await act(async () => fireEvent.click(helpButton));

  expect(
    screen.getByText(/Your landscape’s formal or common name/i)
  ).toBeInTheDocument();
});
test('KeyInfoUpdate: Input change', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'https://www.landscape.org',
              location: 'AR',
            },
          },
        ],
      },
    })
  );
  const { inputs } = await setup('Argentina');

  expect(inputs.name).toHaveValue('Landscape Name');
  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  expect(inputs.name).toHaveValue('New name');

  expect(inputs.description).toHaveValue('Landscape Description');
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  expect(inputs.description).toHaveValue('New description');

  expect(inputs.website).toHaveValue('https://www.landscape.org');
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } });
  expect(inputs.website).toHaveValue('www.other.org');

  expect(inputs.location).toHaveTextContent('Argentina');
  await inputs.changeLocation('Ecuador');
  expect(inputs.location).toHaveTextContent('Ecuador');
});
test('KeyInfoUpdate: Input validation', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'https://www.landscape.org',
              email: 'info@landscape.org',
            },
          },
        ],
      },
    })
  );
  const { inputs } = await setup();

  expect(inputs.name).toHaveValue('Landscape Name');
  fireEvent.change(inputs.name, { target: { value: '' } });
  expect(inputs.name).toHaveValue('');

  expect(inputs.description).toHaveValue('Landscape Description');
  fireEvent.change(inputs.description, { target: { value: '' } });
  expect(inputs.description).toHaveValue('');

  expect(inputs.email).toHaveValue('info@landscape.org');
  fireEvent.change(inputs.email, { target: { value: 'wwwotherorg' } });
  expect(inputs.email).toHaveValue('wwwotherorg');

  expect(inputs.website).toHaveValue('https://www.landscape.org');
  fireEvent.change(inputs.website, { target: { value: 'wwwotherorg' } });
  expect(inputs.website).toHaveValue('wwwotherorg');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  );
  expect(screen.getByText(/Enter a name/i)).toBeInTheDocument();
  expect(screen.getByText(/Enter a description/i)).toBeInTheDocument();
  expect(screen.getByText(/Enter a valid web address/i)).toBeInTheDocument();
  expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument();
});
test('KeyInfoUpdate: Save form', async () => {
  terrasoApi.requestGraphQL
    .mockResolvedValueOnce({
      landscapes: {
        edges: [
          {
            node: {
              id: '1',
              name: 'Landscape Name',
              description: 'Landscape Description',
              email: 'info@landscape.org',
              website: 'https://www.landscape.org',
              location: 'EC',
            },
          },
        ],
      },
    })
    .mockResolvedValueOnce({
      landscapes: {
        edges: [
          {
            node: {
              id: '1',
              name: 'Landscape Name',
              description: 'Landscape Description',
              email: 'info@landscape.org',
              website: 'https://www.landscape.org',
              location: 'EC',
            },
          },
        ],
      },
    })
    .mockResolvedValueOnce({
      updateLandscape: {
        landscape: {
          id: '1',
          name: 'Landscape Name',
          description: 'Landscape Description',
          website: 'https://www.landscape.org',
          location: 'EC',
        },
      },
    });

  const { inputs } = await setup('Ecuador');

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.email, {
    target: { value: 'new@other.org' },
  });
  fireEvent.change(inputs.website, {
    target: { value: 'www.other.org' },
  });
  await inputs.changeLocation('Argentina');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      description: 'New description',
      name: 'New name',
      email: 'new@other.org',
      website: 'https://www.other.org',
      location: 'AR',
    },
  });
});
test('KeyInfoUpdate: Save form error', async () => {
  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve({
        landscapes: {
          edges: [
            {
              node: {
                name: 'Landscape Name',
                description: 'Landscape Description',
                website: 'https://www.landscape.org',
                location: 'EC',
              },
            },
          ],
        },
      })
    )
    .mockReturnValueOnce(
      Promise.resolve({
        landscapes: {
          edges: [
            {
              node: {
                name: 'Landscape Name',
                description: 'Landscape Description',
                website: 'https://www.landscape.org',
                location: 'EC',
              },
            },
          ],
        },
      })
    )
    .mockRejectedValueOnce('Save Error');

  const { inputs } = await setup('Ecuador');

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.website, {
    target: { value: 'https://www.other.org' },
  });
  await inputs.changeLocation('Argentina');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  );

  // Test error display
  expect(screen.getByText(/Save Error/i)).toBeInTheDocument();

  // Test update values still in the form
  expect(inputs.name).toHaveValue('New name');
  expect(inputs.description).toHaveValue('New description');
  expect(inputs.website).toHaveValue('https://www.other.org');
  expect(inputs.location).toHaveTextContent('Argentina');

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
});
