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
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

import TableResponsive from 'common/components/TableResponsive.js';
import AccountAvatar from 'account/components/AccountAvatar.js';

import MemberName from './MemberName.js';

const MembershipsList = props => {
  const { t } = useTranslation();
  const {
    label,
    memberships,
    searchParams,
    setSearchParams,
    RoleComponent,
    RemoveComponent,
    cardsBreakpoint,
    showCards,
    tableProps = {},
  } = props;

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('memberships.members_list_column_name'),
        flex: 1.5,
        minWidth: 200,
        cardFieldSizes: {
          xs: 12,
          sm: 5,
        },
        valueGetter: ({ row: member }) =>
          member.pendingEmail
            ? member.pendingEmail
            : t('user.full_name', { user: member }),
        cardRender: ({ row: member }) => (
          <Typography noWrap>
            {member.pendingEmail
              ? member.pendingEmail
              : t('user.full_name', { user: member })}
          </Typography>
        ),
        renderCell: ({ row: member }) => <MemberName member={member} />,
      },
      {
        field: 'role',
        headerName: t('memberships.members_list_column_role'),
        flex: 1.5,
        minWidth: 200,
        cardFieldSizes: {
          xs: 6,
          sm: 4,
        },
        valueGetter: ({ row: member }) =>
          t(`group.role_${member.userRole.toLowerCase()}`),
        renderCell: ({ row: member, tabIndex }) => (
          <RoleComponent member={member} tabIndex={tabIndex} />
        ),
      },
      {
        field: 'Actions.js',
        headerName: t('memberships.members_list_column_actions_description'),
        type: 'Actions.js',
        sortable: false,
        flex: 1.5,
        minWidth: 200,
        align: 'center',
        cardFieldSizes: {
          xs: 6,
          sm: 3,
        },
        getActions: ({ row: member, tabIndex }) => [
          <RemoveComponent member={member} tabIndex={tabIndex} />,
        ],
      },
    ],
    [t, RoleComponent, RemoveComponent]
  );

  return (
    <TableResponsive
      label={label}
      getItemLabel={member =>
        member.pendingEmail || t('user.full_name', { user: member })
      }
      showCards={showCards}
      cardsBreakpoint={cardsBreakpoint}
      columns={columns}
      rows={memberships}
      emptyMessage={t('memberships.members_list_empty')}
      {...(setSearchParams && {
        searchParams: Object.fromEntries(searchParams.entries()),
        onSearchParamsChange: setSearchParams,
      })}
      cardsProps={{
        avatarRender: ({ row: member }) =>
          member.pendingEmail ? (
            <Box sx={{ width: 40, height: 40 }} />
          ) : (
            <AccountAvatar
              component="div"
              sx={{ width: 40, height: 40 }}
              user={member}
            />
          ),
      }}
      tableProps={{
        initialSort: [
          {
            field: 'name',
            sort: 'asc',
          },
        ],
        ...tableProps,
      }}
    />
  );
};

export default MembershipsList;
