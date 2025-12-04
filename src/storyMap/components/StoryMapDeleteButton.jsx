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

import React, { useCallback } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { daysSince } from 'timeUtils';

import ConfirmButton from 'common/components/ConfirmButton';
import { useAnalytics } from 'monitoring/analytics';
import { deleteStoryMap } from 'storyMap/storyMapSlice';

const DeleteButton = props => {
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { children, tooltip, buttonProps, storyMap, onSuccess } = props;
  const deleting = useSelector(
    _.get(`storyMap.delete.${storyMap.id}.deleting`)
  );

  const onDelete = useCallback(
    () =>
      dispatch(deleteStoryMap({ storyMap })).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          onSuccess?.(storyMap);
          trackEvent('storymap.delete', {
            props: {
              durationDays: daysSince(storyMap.createdAt),
              map: storyMap.id,
            },
          });
        }
      }),
    [dispatch, trackEvent, storyMap, onSuccess]
  );

  return (
    <ConfirmButton
      onConfirm={onDelete}
      loading={deleting}
      variant="text"
      buttonProps={{
        'aria-label': t('storyMap.delete_label', { name: storyMap.title }),
        ...buttonProps,
      }}
      confirmTitle={t('storyMap.delete_confirm_title', {
        title: storyMap.title,
      })}
      confirmMessage={t('storyMap.delete_confirm_message')}
      confirmButton={t('storyMap.delete_confirm_button')}
      tooltip={tooltip}
    >
      {children}
    </ConfirmButton>
  );
};

export default DeleteButton;
