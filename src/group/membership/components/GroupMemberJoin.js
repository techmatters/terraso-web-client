import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { LoadingButton } from '@mui/lab';

import { useGroupContext } from 'group/groupContext';

const GroupMemberJoin = props => {
  const { t } = useTranslation();

  const { owner } = useGroupContext();

  return (
    <LoadingButton
      variant="outlined"
      aria-label={t(props.ariaLabel, {
        name: _.get('name', owner),
      })}
      onClick={props.onJoin}
      loading={props.loading}
      sx={{ flexGrow: 1 }}
    >
      {t(props.label)}
    </LoadingButton>
  );
};

export default GroupMemberJoin;
