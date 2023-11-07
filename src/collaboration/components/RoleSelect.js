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
import React, { useCallback } from 'react';
import { MenuItem, Select, Typography } from '@mui/material';

import Restricted from 'permissions/components/Restricted';

const RoleSelect = props => {
  const { roles, member, tabIndex, onMemberRoleChange, permission, resource } =
    props;

  const onChange = useCallback(
    event => {
      const newRole = event.target.value;
      onMemberRoleChange(member, newRole);
    },
    [onMemberRoleChange, member]
  );

  return (
    <Restricted
      permission={permission}
      resource={resource}
      FallbackComponent={() => (
        <Typography>
          {roles.find(role => role.value === member.userRole).label}
        </Typography>
      )}
    >
      <Select
        variant="standard"
        value={member.userRole}
        onChange={onChange}
        disabled={member.fetching}
        inputProps={{
          tabIndex,
        }}
        disableUnderline
      >
        {roles.map(role => (
          <MenuItem key={role.key} value={role.value}>
            {role.label}
          </MenuItem>
        ))}
      </Select>
    </Restricted>
  );
};

export default RoleSelect;
