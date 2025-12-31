/*
 * Copyright © 2023 Technology Matters
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

import { useCallback } from 'react';
import { MenuItem, Select, Typography } from '@mui/material';

const RoleSelect = props => {
  const {
    roles,
    membership,
    tabIndex,
    onMemberRoleChange,
    label,
    allowedToManageMembers,
  } = props;

  const onChange = useCallback(
    event => {
      const newRole = event.target.value;
      onMemberRoleChange(membership, newRole);
    },
    [onMemberRoleChange, membership]
  );

  if (!allowedToManageMembers) {
    return (
      <Typography>
        {roles.find(role => role.value === membership.userRole).label}
      </Typography>
    );
  }

  return (
    <Select
      variant="standard"
      value={membership.userRole}
      onChange={onChange}
      disabled={membership.fetching}
      inputProps={{
        tabIndex,
        'aria-label': label,
      }}
      disableUnderline
    >
      {roles.map(role => (
        <MenuItem key={role.key} value={role.value}>
          {role.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default RoleSelect;
