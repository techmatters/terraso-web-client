import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

import TableResponsive from 'common/components/TableResponsive';
import AccountAvatar from 'account/components/AccountAvatar';

import MemberName from './MemberName';

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
          sm: 3,
        },
        valueGetter: ({ row: member }) =>
          member.pendingEmail
            ? member.pendingEmail
            : t('user.full_name', { user: member }),
        cardRender: ({ row: member }) => (
          <Typography>
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
          sm: 6,
        },
        valueGetter: ({ row: member }) =>
          t(`group.role_${member.userRole.toLowerCase()}`),
        renderCell: ({ row: member, tabIndex }) => (
          <RoleComponent member={member} tabIndex={tabIndex} />
        ),
      },
      {
        field: 'actions',
        headerName: t('memberships.members_list_column_actions_description'),
        type: 'actions',
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
