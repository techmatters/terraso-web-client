import React from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingButton } from '@mui/lab';

const GroupMemberJoin = props => {
  const { t } = useTranslation();
  return (
    <LoadingButton
      variant="outlined"
      onClick={props.onJoin}
      loading={props.loading}
      sx={{ flexGrow: 1 }}
    >
      {t(props.label)}
    </LoadingButton>
  );
};

export default GroupMemberJoin;
