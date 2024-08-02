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
import { useNavigate, useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import GroupForm from 'group/components/GroupForm';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const setup = async () => {
  await render(<GroupForm />, {
    account: {
      currentUser: {
        data: {
          email: 'email@email.com',
          firstName: 'First',
          lastName: 'Last',
        },
      },
    },
  });

  const name = screen.getByRole('textbox', { name: 'Name (required)' });
  const description = screen.getByRole('textbox', {
    name: 'Description (required)',
  });
  const email = screen.getByRole('textbox', { name: 'Email address' });
  const website = screen.getByRole('textbox', { name: 'Website' });
  const membershipType = screen.getByRole('radiogroup', {
    name: 'Membership Type',
  });
  const membershipTypeOpen = within(membershipType).getByLabelText('Open');
  const membershipTypeClose = within(membershipType).getByLabelText('Closed');
  return {
    inputs: {
      name,
      description,
      email,
      website,
      membershipTypeOpen,
      membershipTypeClose,
    },
  };
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  useNavigate.mockReturnValue(() => {});
});

test('GroupForm: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue(['Load error']);
  await render(<GroupForm />);
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('GroupForm: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await render(<GroupForm />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('GroupForm: Fill form', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      groups: {
        edges: [
          {
            node: {
              name: 'Group name',
              description: 'Group description',
              email: 'group@group.org',
              website: 'https://www.group.org',
            },
          },
        ],
      },
    })
  );
  const { inputs } = await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(inputs.name).toHaveValue('Group name');
  expect(inputs.description).toHaveValue('Group description');
  expect(inputs.email).toHaveValue('group@group.org');
  expect(inputs.website).toHaveValue('https://www.group.org');
});
test('GroupForm: Show cancel', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      groups: {
        edges: [
          {
            node: {
              name: 'Group name',
              description: 'Group description',
              email: 'group@group.org',
              website: 'https://www.group.org',
            },
          },
        ],
      },
    })
  );
  const { inputs } = await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(inputs.name).toHaveValue('Group name');
  expect(inputs.description).toHaveValue('Group description');
  expect(inputs.email).toHaveValue('group@group.org');
  expect(inputs.website).toHaveValue('https://www.group.org');

  const cancelButton = screen.getByRole('button', { name: 'Cancel' });
  expect(cancelButton).toBeInTheDocument();
  await act(async () => fireEvent.click(cancelButton));
  expect(navigate.mock.calls[0]).toEqual([-1]);
});
test('GroupForm: Input change', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue({
    groups: {
      edges: [
        {
          node: {
            name: 'Group name',
            description: 'Group description',
            email: 'group@group.org',
            website: 'https://www.group.org',
          },
        },
      ],
    },
  });
  const { inputs } = await setup();

  expect(inputs.name).toHaveValue('Group name');
  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  expect(inputs.name).toHaveValue('New name');

  expect(inputs.description).toHaveValue('Group description');
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  expect(inputs.description).toHaveValue('New description');

  expect(inputs.email).toHaveValue('group@group.org');
  fireEvent.change(inputs.email, { target: { value: 'new.email@group.org' } });
  expect(inputs.email).toHaveValue('new.email@group.org');

  expect(inputs.website).toHaveValue('https://www.group.org');
  fireEvent.change(inputs.website, {
    target: { value: 'https://www.other.org' },
  });
  expect(inputs.website).toHaveValue('https://www.other.org');
});
test('GroupForm: Input validation', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      groups: {
        edges: [
          {
            node: {
              name: 'Group name',
              description: 'Group description',
              email: 'group@group.org',
              website: 'https://www.group.org',
            },
          },
        ],
      },
    })
  );
  const { inputs } = await setup();

  expect(inputs.name).toHaveValue('Group name');
  fireEvent.change(inputs.name, { target: { value: '' } });
  expect(inputs.name).toHaveValue('');

  expect(inputs.description).toHaveValue('Group description');
  fireEvent.change(inputs.description, { target: { value: '' } });
  expect(inputs.description).toHaveValue('');

  expect(inputs.email).toHaveValue('group@group.org');
  fireEvent.change(inputs.email, { target: { value: 'new.emailgrouporg' } });
  expect(inputs.email).toHaveValue('new.emailgrouporg');

  expect(inputs.website).toHaveValue('https://www.group.org');
  fireEvent.change(inputs.website, { target: { value: 'wwwotherorg' } });
  expect(inputs.website).toHaveValue('wwwotherorg');

  await act(async () => fireEvent.click(screen.getByText(/Save Changes/i)));
  expect(screen.getByText(/Enter a name/i)).toBeInTheDocument();
  expect(screen.getByText(/Enter a description/i)).toBeInTheDocument();
  expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument();
  expect(screen.getByText(/Enter a valid web address/i)).toBeInTheDocument();
});

test('GroupForm: website accepts address without protocol', async () => {
  terrasoApi.requestGraphQL
    .mockResolvedValueOnce({
      groups: {
        edges: [
          {
            node: {
              id: '1',
              name: 'Group name',
              description: 'Group description',
              email: 'group@group.org',
              website: 'https://www.group.org',
              membershipType: 'OPEN',
            },
          },
        ],
      },
    })
    .mockResolvedValueOnce({
      groups: {
        edges: [
          {
            node: {
              id: '1',
              name: 'Group name',
              description: 'Group description',
              email: 'group@group.org',
              website: 'https://www.group.org',
            },
          },
        ],
      },
    })
    .mockResolvedValueOnce({
      updateGroup: {
        group: {
          id: '1',
          name: 'Group name',
          description: 'Group description',
          email: 'group@group.org',
          website: 'https://www.group.org',
        },
      },
    });
  const { inputs } = await setup();

  fireEvent.change(inputs.website, { target: { value: 'example.org' } });

  await act(async () => fireEvent.click(screen.getByText(/Save Changes/i)));
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];

  expect(saveCall[1].input.website).toEqual('https://example.org');
});

test('GroupForm: Save form', async () => {
  terrasoApi.requestGraphQL
    .mockResolvedValueOnce({
      groups: {
        edges: [
          {
            node: {
              id: '1',
              name: 'Group name',
              description: 'Group description',
              email: 'group@group.org',
              website: 'https://www.group.org',
              membershipType: 'OPEN',
            },
          },
        ],
      },
    })
    .mockResolvedValueOnce({
      groups: {
        edges: [
          {
            node: {
              id: '1',
              name: 'Group name',
              description: 'Group description',
              email: 'group@group.org',
              website: 'https://www.group.org',
            },
          },
        ],
      },
    })
    .mockResolvedValueOnce({
      updateGroup: {
        group: {
          id: '1',
          name: 'Group name',
          description: 'Group description',
          email: 'group@group.org',
          website: 'https://www.group.org',
        },
      },
    });

  const { inputs } = await setup();

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.email, { target: { value: 'new.email@group.org' } });
  fireEvent.change(inputs.website, {
    target: { value: 'https://www.other.org' },
  });

  fireEvent.click(inputs.membershipTypeClose);

  await act(async () => fireEvent.click(screen.getByText(/Save Changes/i)));
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      description: 'New description',
      name: 'New name',
      website: 'https://www.other.org',
      email: 'new.email@group.org',
      membershipType: 'CLOSED',
    },
  });
});
test('GroupForm: Save form error', async () => {
  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve({
        groups: {
          edges: [
            {
              node: {
                slug: 'group-1',
                name: 'Group name',
                description: 'Group description',
                email: 'group@group.org',
                website: 'https://www.group.org',
                membershipType: 'OPEN',
              },
            },
          ],
        },
      })
    )
    .mockReturnValueOnce(
      Promise.resolve({
        groups: {
          edges: [
            {
              node: {
                slug: 'group-1',
                name: 'Group name',
                description: 'Group description',
                email: 'group@group.org',
                website: 'https://www.group.org',
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
  fireEvent.change(inputs.email, { target: { value: 'new.email@group.org' } });
  fireEvent.change(inputs.website, {
    target: { value: 'https://www.other.org' },
  });

  await act(async () => fireEvent.click(screen.getByText(/Save Changes/i)));
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);

  // Test error display
  expect(screen.getByText(/Save Error/i)).toBeInTheDocument();

  // Test update values still in the form
  expect(inputs.name).toHaveValue('New name');
  expect(inputs.description).toHaveValue('New description');
  expect(inputs.email).toHaveValue('new.email@group.org');
  expect(inputs.website).toHaveValue('https://www.other.org');

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
});
test('GroupForm: Avoid fetch', async () => {
  useParams.mockReturnValue({ id: 'new' });
  const { inputs } = await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(0);

  expect(inputs.name).toHaveValue('');
  expect(inputs.description).toHaveValue('');
  expect(inputs.email).toHaveValue('');
  expect(inputs.website).toHaveValue('');

  expect(() =>
    screen.getByRole('progressbar', { name: 'Loading', hidden: true })
  ).toThrow('Unable to find an element');
});
test('GroupForm: Save form (add) (Default open)', async () => {
  useParams.mockReturnValue({});
  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    addGroup: {
      group: {
        name: 'New name',
        description: 'New description',
        website: 'https://www.other.org',
        email: 'group@group.org',
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
  fireEvent.change(inputs.email, { target: { value: 'other@group.org' } });

  await act(async () => fireEvent.click(screen.getByText(/Create Group/i)));
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[0];
  expect(saveCall[1]).toStrictEqual({
    input: {
      description: 'New description',
      name: 'New name',
      website: 'https://www.other.org',
      email: 'other@group.org',
      membershipType: 'OPEN',
    },
  });
});
test('GroupForm: Save form (add)', async () => {
  useParams.mockReturnValue({});
  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    addGroup: {
      group: {
        name: 'New name',
        description: 'New description',
        website: 'https://www.other.org',
        email: 'group@group.org',
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
  fireEvent.change(inputs.email, { target: { value: 'other@group.org' } });
  fireEvent.click(inputs.membershipTypeClose);

  await act(async () => fireEvent.click(screen.getByText(/Create Group/i)));
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('mutation addGroup'),
    expect.objectContaining({
      input: {
        description: 'New description',
        name: 'New name',
        website: 'https://www.other.org',
        email: 'other@group.org',
        membershipType: 'CLOSED',
      },
    })
  );
});
