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

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

import MemberName from 'terraso-web-client/collaboration/components/MemberName';
import TableResponsive from 'terraso-web-client/common/components/TableResponsive';
import AccountAvatar from 'terraso-web-client/account/components/AccountAvatar';

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
        headerName: t('collaboration.members_list_column_name'),
        flex: 1.5,
        minWidth: 200,
        cardFieldSizes: {
          xs: 12,
          sm: 5,
        },
        valueGetter: (value, row, column, apiRef) =>
          row.pendingEmail
            ? row.pendingEmail
            : t('user.full_name', { user: row.user }),
        cardRender: ({ row: membership }) => (
          <Typography noWrap>
            {membership.pendingEmail
              ? membership.pendingEmail
              : t('user.full_name', { user: membership.user })}
          </Typography>
        ),
        renderCell: ({ row: membership }) => (
          <MemberName membership={membership} />
        ),
      },
      {
        field: 'role',
        headerName: t('collaboration.members_list_column_role'),
        flex: 1.5,
        minWidth: 200,
        cardFieldSizes: {
          xs: 6,
          sm: 4,
        },
        valueGetter: (value, row, column, apiRef) =>
          t(`group.role_${row.userRole.toLowerCase()}`),
        renderCell: ({ row: membership, tabIndex }) => (
          <RoleComponent membership={membership} tabIndex={tabIndex} />
        ),
      },
      {
        field: 'actions',
        headerName: t('collaboration.members_list_column_actions_description'),
        type: 'actions',
        sortable: false,
        flex: 1.5,
        minWidth: 200,
        align: 'center',
        cardFieldSizes: {
          xs: 6,
          sm: 3,
        },
        getActions: ({ row: membership, tabIndex }) => [
          <RemoveComponent membership={membership} tabIndex={tabIndex} />,
        ],
      },
    ],
    [t, RoleComponent, RemoveComponent]
  );

  return (
    <TableResponsive
      label={label}
      getItemLabel={membership =>
        membership.pendingEmail ||
        t('user.full_name', { user: membership.user })
      }
      showCards={showCards}
      cardsBreakpoint={cardsBreakpoint}
      columns={columns}
      rows={memberships}
      emptyMessage={t('collaboration.members_list_empty')}
      {...(setSearchParams && {
        searchParams: Object.fromEntries(searchParams.entries()),
        onSearchParamsChange: setSearchParams,
      })}
      cardsProps={{
        avatarRender: ({ row: membership }) =>
          membership.pendingEmail ? (
            <Box sx={{ width: 40, height: 40 }} />
          ) : (
            <AccountAvatar
              component="div"
              sx={{ width: 40, height: 40 }}
              user={membership.user}
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
