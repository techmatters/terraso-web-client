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

import { render, screen, waitFor } from 'terraso-web-client/tests/utils';

import { usePermission } from 'terraso-web-client/permissions/index';

const PermissionStatus = ({ resource }) => {
  const { loading, allowed } = usePermission('resource.action', resource);

  if (loading) {
    return <div>loading</div>;
  }

  return <div>{`allowed:${String(allowed)}`}</div>;
};

test('usePermission: does not stay loading when resource is unavailable', async () => {
  await render(<PermissionStatus resource={null} />);

  await waitFor(() => {
    expect(screen.getByText('allowed:false')).toBeInTheDocument();
  });
});

test('usePermission: evaluates permission when resource is available', async () => {
  const rules = {
    'resource.action': () => true,
  };

  await render(<PermissionStatus resource={{}} />, undefined, rules);

  await waitFor(() => {
    expect(screen.getByText('allowed:true')).toBeInTheDocument();
  });
});
