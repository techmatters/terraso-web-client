import React from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';

import AccountAvatar from 'account/components/AccountAvatar';

const MemberName = ({ member }) => {
  const { t } = useTranslation();
  return (
    <Stack
      direction="row"
      justifyContent="flex-start"
      alignItems="center"
      spacing={2}
    >
      <AccountAvatar
        component="div"
        sx={{ width: 34, height: 34 }}
        user={member}
      />
      <Typography>{t('user.full_name', { user: member })}</Typography>
    </Stack>
  );
};

export default MemberName;
