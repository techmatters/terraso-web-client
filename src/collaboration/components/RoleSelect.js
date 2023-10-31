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
