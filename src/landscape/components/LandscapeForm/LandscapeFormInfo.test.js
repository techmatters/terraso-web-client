import React from 'react';
import { act } from 'react-dom/test-utils';
import { useParams } from 'react-router-dom';

import { render, screen, fireEvent, within, waitFor } from 'tests/utils';
import LandscapeForm from 'landscape/components/LandscapeForm';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const setup = async () => {
  await render(<LandscapeForm />);
  const name = screen.getByRole('textbox', {
    name: 'Name (Required)',
  });
  const description = screen.getByRole('textbox', {
    name: 'Description (Required)',
  });
  const website = screen.getByRole('textbox', { name: 'Website' });
  const location = screen.getByRole('button', { name: 'Location' });

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

test('LandscapeForm: Display error', async () => {
  terrasoApi.request.mockRejectedValue(['Load error']);
  await render(<LandscapeForm />);
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeForm: Display loader', async () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}));
  await render(<LandscapeForm />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
    hidden: true,
  });
  expect(loader).toBeInTheDocument();
});
test('LandscapeForm: Fill form', async () => {
  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'www.landscape.org',
              location: 'Ecuador',
            },
          },
        ],
      },
    })
  );
  const { inputs } = await setup();

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
  expect(inputs.name).toHaveValue('Landscape Name');
  expect(inputs.description).toHaveValue('Landscape Description');
  expect(inputs.website).toHaveValue('www.landscape.org');
  expect(inputs.location).toHaveTextContent('Ecuador');
});
test('LandscapeForm: Input change', async () => {
  terrasoApi.request.mockReturnValueOnce(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'www.landscape.org',
              location: 'Argentina',
            },
          },
        ],
      },
    })
  );
  const { inputs } = await setup();

  expect(inputs.name).toHaveValue('Landscape Name');
  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  expect(inputs.name).toHaveValue('New name');

  expect(inputs.description).toHaveValue('Landscape Description');
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  expect(inputs.description).toHaveValue('New description');

  expect(inputs.website).toHaveValue('www.landscape.org');
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } });
  expect(inputs.website).toHaveValue('www.other.org');

  expect(inputs.location).toHaveTextContent('Argentina');
  await inputs.changeLocation('Ecuador');
  expect(inputs.location).toHaveTextContent('Ecuador');
});
test('LandscapeForm: Input validation', async () => {
  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'www.landscape.org',
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

  expect(inputs.website).toHaveValue('www.landscape.org');
  fireEvent.change(inputs.website, { target: { value: 'wwwotherorg' } });
  expect(inputs.website).toHaveValue('wwwotherorg');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  expect(screen.getByText(/name is a required field/i)).toBeInTheDocument();
  expect(
    screen.getByText(/description is a required field/i)
  ).toBeInTheDocument();
  expect(screen.getByText(/website must be a valid URL/i)).toBeInTheDocument();
});
test('LandscapeForm: Save form', async () => {
  terrasoApi.request
    .mockResolvedValueOnce({
      landscapes: {
        edges: [
          {
            node: {
              id: '1',
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'www.landscape.org',
              location: 'Ecuador',
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
          website: 'www.landscape.org',
          location: 'Ecuador',
        },
      },
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
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Not now. Just add my Landscape' })
    ).toBeInTheDocument();
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Not now. Just add my Landscape' })
    )
  );
  expect(terrasoApi.request).toHaveBeenCalledTimes(2);
  const saveCall = terrasoApi.request.mock.calls[1];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      description: 'New description',
      name: 'New name',
      website: 'https://www.other.org',
      location: 'Argentina',
      areaPolygon: null,
    },
  });
});
test('LandscapeForm: Save form error', async () => {
  terrasoApi.request
    .mockReturnValueOnce(
      Promise.resolve({
        landscapes: {
          edges: [
            {
              node: {
                name: 'Landscape Name',
                description: 'Landscape Description',
                website: 'www.landscape.org',
                location: 'Ecuador',
              },
            },
          ],
        },
      })
    )
    .mockRejectedValueOnce('Save Error');

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
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Not now. Just add my Landscape' })
    ).toBeInTheDocument();
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Not now. Just add my Landscape' })
    )
  );

  // Test error display
  expect(screen.getByText(/Save Error/i)).toBeInTheDocument();

  // Test update values still in the form
  expect(inputs.name).toHaveValue('New name');
  expect(inputs.description).toHaveValue('New description');
  expect(inputs.website).toHaveValue('https://www.other.org');
  expect(inputs.location).toHaveTextContent('Argentina');

  expect(terrasoApi.request).toHaveBeenCalledTimes(2);
});
test('LandscapeForm: Avoid fetch', async () => {
  useParams.mockReturnValue({ slug: null });
  const { inputs } = await setup();

  expect(terrasoApi.request).toHaveBeenCalledTimes(0);

  expect(inputs.name).toHaveValue('');
  expect(inputs.description).toHaveValue('');
  expect(inputs.website).toHaveValue('');

  expect(() =>
    screen.getByRole('progressbar', { name: 'Loading', hidden: true })
  ).toThrow('Unable to find an element');
});
test('LandscapeForm: Save form (add)', async () => {
  useParams.mockReturnValue({ slug: null });
  terrasoApi.request.mockResolvedValueOnce({
    addLandscape: {
      landscape: {
        name: 'New name',
        description: 'New description',
        website: 'http://www.other.org',
        location: 'Argentina',
      },
    },
  });

  const { inputs } = await setup();

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.website, {
    target: { value: 'http://www.other.org' },
  });
  await inputs.changeLocation('Ecuador');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Not now. Just add my Landscape' })
    ).toBeInTheDocument();
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Not now. Just add my Landscape' })
    )
  );

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
  const saveCall = terrasoApi.request.mock.calls[0];
  expect(saveCall[1]).toStrictEqual({
    input: {
      description: 'New description',
      name: 'New name',
      website: 'http://www.other.org',
      location: 'Ecuador',
    },
  });
});
