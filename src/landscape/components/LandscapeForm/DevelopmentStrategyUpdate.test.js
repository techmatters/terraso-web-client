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

import { act, fireEvent, render, screen } from 'tests/utils';
import React from 'react';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import DevelopmentStrategyUpdate from 'landscape/components/LandscapeForm/DevelopmentStrategyUpdate';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const setup = async () => {
  await render(<DevelopmentStrategyUpdate />);

  const objectives = screen.getByRole('textbox', {
    name: 'Sustainable development goals',
  });
  const problemSitutation = screen.getByRole('textbox', {
    name: 'Main challenges',
  });
  const interventionStrategy = screen.getByRole('textbox', {
    name: 'Landscape intervention strategy',
  });

  return {
    inputs: {
      objectives,
      problemSitutation,
      interventionStrategy,
    },
  };
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
});

test('DevelopmentStrategyUpdate: Display error', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith('query landscapes')) {
      return Promise.reject('Load landscapes error');
    }
  });
  await render(<DevelopmentStrategyUpdate />);
  expect(screen.getByText(/Load landscapes error/i)).toBeInTheDocument();
});
test('DevelopmentStrategyUpdate: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await render(<DevelopmentStrategyUpdate />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('DevelopmentStrategyUpdate: Save form', async () => {
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

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

  fireEvent.change(inputs.objectives, { target: { value: 'Test Objectives' } });
  fireEvent.change(inputs.problemSitutation, {
    target: { value: 'Test Problem Situation' },
  });
  fireEvent.change(inputs.interventionStrategy, {
    target: { value: 'Test Intervention Strategy' },
  });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Update' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      developmentStrategy: JSON.stringify({
        objectives: 'Test Objectives',
        opportunities: '',
        problemSitutation: 'Test Problem Situation',
        interventionStrategy: 'Test Intervention Strategy',
      }),
    },
  });
});
