import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

import TableResponsive from 'common/components/TableResponsive';
import AccountAvatar from 'account/components/AccountAvatar';

import MemberName from './MemberName';

const RoleComponentDefault = ({ member }) => {
  const { t } = useTranslation();
  return (
    <Typography>{t(`group.role_${member.userRole.toLowerCase()}`)}</Typography>
  );
};

const MembershipsList = props => {
  const { t } = useTranslation();
  const {
    memberships,
    searchParams,
    setSearchParams,
    RoleComponent = RoleComponentDefault,
    RemoveComponent = () => null,
    cardsBreakpoint,
    tableProps = {},
  } = props;

  const columns = [
    {
      field: 'name',
      headerName: t('group.members_list_column_name'),
      flex: 1.5,
      minWidth: 200,
      valueGetter: ({ row: member }) => t('user.full_name', { user: member }),
      cardRender: ({ row: member }) => (
        <Typography>{t('user.full_name', { user: member })}</Typography>
      ),
      renderCell: ({ row: member }) => <MemberName member={member} />,
    },
    {
      field: 'role',
      headerName: t('group.members_list_column_role'),
      flex: 1.5,
      minWidth: 200,
      cardSize: 6,
      valueGetter: ({ row: member }) =>
        t(`group.role_${member.userRole.toLowerCase()}`),
      renderCell: ({ row: member, tabIndex }) => (
        <RoleComponent member={member} tabIndex={tabIndex} />
      ),
    },
    {
      field: 'actions',
      headerName: t('group.members_list_column_actions_description'),
      type: 'actions',
      sortable: false,
      flex: 1.5,
      minWidth: 200,
      align: 'center',
      cardSize: 6,
      getActions: ({ row: member, tabIndex }) => [
        <RemoveComponent member={member} tabIndex={tabIndex} />,
      ],
    },
  ];

  return (
    <TableResponsive
      cardsBreakpoint={cardsBreakpoint}
      columns={columns}
      rows={memberships}
      emptyMessage={t('group.members_list_empty')}
      {...(setSearchParams && {
        searchParams: Object.fromEntries(searchParams.entries()),
        onSearchParamsChange: setSearchParams,
      })}
      cardsProps={{
        avatarRender: ({ row: member }) => (
          <AccountAvatar
            component="div"
            sx={{ width: 80, height: 80 }}
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
