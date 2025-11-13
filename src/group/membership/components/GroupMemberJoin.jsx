/*
 * Copyright © 2021-2023 Technology Matters
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

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';

import { useCollaborationContext } from 'terraso-web-client/collaboration/collaborationContext';

const GroupMemberJoin = props => {
  const { t } = useTranslation();
  const { owner } = useCollaborationContext();
  const { ariaLabel, onJoin, buttonProps, loading } = props;

  return (
    <Button
      variant="outlined"
      aria-label={t(ariaLabel, {
        name: _.get('name', owner),
      })}
      onClick={onJoin}
      loading={loading}
      sx={{ flexGrow: 1 }}
      {...buttonProps}
    >
      {t(props.label)}
    </Button>
  );
};

export default GroupMemberJoin;
