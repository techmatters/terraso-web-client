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

import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';
import React from 'react';
import { useParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import { iso639en, iso639es } from 'localization/iso639';
import ProfileUpdate from 'landscape/components/LandscapeForm/ProfileUpdate';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('localization/iso639');

const setup = async () => {
  await render(<ProfileUpdate />);

  const population = screen.getByRole('spinbutton', {
    name: 'Approximate landscape population',
  });

  const changeLandscapeArea = async newValue => {
    const checkbox = screen.getByRole('checkbox', { name: newValue });
    await act(async () => fireEvent.click(checkbox));
  };

  const changeCombobox = async (name, newValue, isNew = true) => {
    const combobox = screen.getByRole('combobox', {
      name,
    });
    fireEvent.change(combobox, { target: { value: newValue } });

    await waitFor(() =>
      expect(screen.getByRole('listbox', { name })).toBeInTheDocument()
    );

    const optionsList = screen.getByRole('listbox', { name });

    if (isNew) {
      fireEvent.keyDown(combobox, { key: 'Enter' });
    } else {
      const option = within(optionsList).getByRole('option', {
        name: newValue,
      });
      fireEvent.click(option);
    }
  };

  return {
    inputs: {
      population,
      changeLandscapeArea,
      changeCombobox,
    },
  };
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  iso639en.mockReturnValue({
    spa: 'Spanish',
  });
  iso639es.mockReturnValue({
    spa: 'Español',
  });
});

test('ProfileUpdate: Display error', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith('query taxonomyTerms')) {
      return Promise.reject('Load terms error');
    }
    if (trimmedQuery.startsWith('query landscapes')) {
      return Promise.reject('Load landscapes error');
    }
  });
  await render(<ProfileUpdate />);
  expect(screen.getByText(/Load terms error/i)).toBeInTheDocument();
  expect(screen.getByText(/Load landscapes error/i)).toBeInTheDocument();
});
test('ProfileUpdate: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await render(<ProfileUpdate />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('ProfileUpdate: Save form', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('query taxonomyTerms')) {
      return Promise.resolve({
        taxonomyTerms: {
          edges: [
            {
              node: {
                slug: 'eco1',
                type: 'ECOSYSTEM_TYPE',
                valueOriginal: 'Eco1',
                valueEn: 'Eco1 En',
                valueEs: 'Eco1 Es',
              },
            },
          ],
        },
      });
    }
    if (trimmedQuery.startsWith('query landscapes')) {
      return Promise.resolve({
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
      });
    }
    if (trimmedQuery.startsWith('mutation updateLandscape')) {
      return Promise.resolve({
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
    }
  });

  const { inputs } = await setup();

  await inputs.changeLandscapeArea('Peri-urban');
  await inputs.changeLandscapeArea('Rural');

  fireEvent.change(inputs.population, { target: { value: '1000932' } });

  await inputs.changeCombobox('Ecosystem Types', 'Eco1 En', false);
  await inputs.changeCombobox('Ecosystem Types', 'Test New Eco 2');

  await inputs.changeCombobox('Languages', 'Spanish', false);

  await inputs.changeCombobox('Livelihoods', 'Livelihood 1');

  await inputs.changeCombobox(
    'Agricultural products and commodities',
    'Commodity 1'
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Update' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(5);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[4];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      areaTypes: '["peri-urban","rural"]',
      population: 1000932,
      taxonomyTypeTerms: JSON.stringify({
        ECOSYSTEM_TYPE: [
          {
            slug: 'eco1',
            type: 'ECOSYSTEM_TYPE',
            valueOriginal: 'Eco1',
            valueEn: 'Eco1 En',
            valueEs: 'Eco1 Es',
          },
          { valueOriginal: 'Test New Eco 2', type: 'ECOSYSTEM_TYPE' },
        ],
        LANGUAGE: [
          {
            type: 'LANGUAGE',
            valueOriginal: 'spa',
            valueEn: 'Spanish',
            valueEs: 'Español',
          },
        ],
        LIVELIHOOD: [{ valueOriginal: 'Livelihood 1', type: 'LIVELIHOOD' }],
        COMMODITY: [{ valueOriginal: 'Commodity 1', type: 'COMMODITY' }],
      }),
    },
  });
});
