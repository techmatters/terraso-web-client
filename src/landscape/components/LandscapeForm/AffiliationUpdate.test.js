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
import React, { act } from 'react';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import AffiliationUpdate from 'landscape/components/LandscapeForm/AffiliationUpdate';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const setup = async () => {
  await render(<AffiliationUpdate />);

  const changePartnershipStatus = async newValue => {
    const radio = screen.getByRole('radio', { name: newValue });
    await act(async () => fireEvent.click(radio));
  };

  const changeCombobox = async (name, newValue, isNew = true) => {
    const combobox = screen.getByRole('combobox', {
      name,
    });
    fireEvent.change(combobox, { target: { value: newValue } });

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

  const changeYear = async newYear => {
    const yearSelect = screen.getByRole('combobox', {
      name: 'Year of landscape partnership inception',
    });
    await act(async () => fireEvent.mouseDown(yearSelect));
    const listbox = within(screen.getByRole('listbox'));
    await act(async () =>
      fireEvent.click(listbox.getByRole('option', { name: newYear }))
    );
  };

  return {
    inputs: {
      changePartnershipStatus,
      changeCombobox,
      changeYear,
    },
  };
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
});

test('AffiliationUpdate: Display error', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith('query taxonomyTerms')) {
      return Promise.reject('Load terms error');
    }
    if (trimmedQuery.startsWith('query groups')) {
      return Promise.reject('Load groups error');
    }
    if (trimmedQuery.startsWith('query landscapes')) {
      return Promise.reject('Load landscapes error');
    }
  });
  await render(<AffiliationUpdate />);
  expect(screen.getByText(/Load terms error/i)).toBeInTheDocument();
  expect(screen.getByText(/Load groups error/i)).toBeInTheDocument();
  expect(screen.getByText(/Load landscapes error/i)).toBeInTheDocument();
});
test('AffiliationUpdate: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await render(<AffiliationUpdate />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('AffiliationUpdate: Save form', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('query taxonomyTerms')) {
      return Promise.resolve({
        taxonomyTerms: {
          edges: [],
        },
      });
    }
    if (trimmedQuery.startsWith('query groups')) {
      return Promise.resolve({
        independentGroups: {
          edges: [
            { node: { slug: 'group-ind-1', name: 'Group Ind 1' } },
            { node: { slug: 'group-ind-2', name: 'Group Ind 2' } },
          ],
        },
        landscapeGroups: {
          edges: [
            { node: { slug: 'group-land-1', name: 'Group Land 1' } },
            { node: { slug: 'group-land-2', name: 'Group Land 2' } },
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

  expect(
    screen.queryByRole('button', { name: 'Select a year' })
  ).not.toBeInTheDocument();

  await inputs.changePartnershipStatus('In progress');

  await inputs.changeYear('1999');

  await inputs.changeCombobox('Landscape partnership', 'Group Ind 2', false);

  await inputs.changeCombobox(
    'Affiliated Terraso Groups',
    'Group Land 1',
    false
  );

  await inputs.changeCombobox(
    'Other active organizations in the landscape',
    'Org 1'
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Update' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(7);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[6];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      partnershipStatus: 'in-progress',
      groupAssociations: JSON.stringify([
        { slug: 'group-ind-2', partnershipYear: 1999, isPartnership: true },
        { slug: 'group-land-1', name: 'Group Land 1' },
      ]),
      taxonomyTypeTerms: JSON.stringify({
        ORGANIZATION: [{ valueOriginal: 'Org 1', type: 'ORGANIZATION' }],
      }),
    },
  });
});
