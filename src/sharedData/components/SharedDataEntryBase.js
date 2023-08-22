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
import React, { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import { Grid, ListItem, Stack, Typography } from '@mui/material';

import { daysSince } from 'timeUtils';

import ConfirmButton from 'common/components/ConfirmButton';
import EditableText from 'common/components/EditableText';
import { formatDate } from 'localization/utils';
import { useAnalytics } from 'monitoring/analytics';
import Restricted from 'permissions/components/Restricted';
import { useGroupContext } from 'group/groupContext';
import {
  deleteSharedData,
  resetProcessing,
  updateSharedData,
} from 'sharedData/sharedDataSlice';

import theme from 'theme';

export const ICON_SIZE = 24;

const StackRow = props => (
  <Stack direction="row" alignItems="center" spacing={1} {...props} />
);

const SharedDataEntryBase = props => {
  const { i18n, t } = useTranslation();
  const { group, owner, updateOwner, entityType } = useGroupContext();
  const {
    dataEntry,
    children,
    EntryTypeIcon,
    DownloadComponent,
    info,
    deleteTooltip,
  } = props;
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const processing = useSelector(
    _.get(`sharedData.processing.${dataEntry.id}`)
  );
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();

  const onConfirm = useCallback(() => {
    dispatch(deleteSharedData({ groupSlug: group.slug, dataEntry })).then(
      data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          updateOwner();
          trackEvent('dataEntry.delete', {
            props: {
              [entityType]: owner.slug,
              durationDays: daysSince(dataEntry.createdAt),
            },
          });
        }
        dispatch(resetProcessing(dataEntry.id));
      }
    );
  }, [
    dataEntry,
    dispatch,
    group.slug,
    owner.slug,
    trackEvent,
    updateOwner,
    entityType,
  ]);

  const onUpdate = useCallback(
    field => value => {
      dispatch(
        updateSharedData({
          dataEntry: {
            ..._.pick(['id', 'name', 'description'], dataEntry),
            [field]: value,
          },
        })
      ).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          updateOwner();
          trackEvent('dataEntry.edit', {
            props: { [entityType]: owner.slug },
          });
        }
        dispatch(resetProcessing(dataEntry.id));
      });
    },
    [dataEntry, dispatch, owner.slug, trackEvent, updateOwner, entityType]
  );

  const onUpdateName = useMemo(() => onUpdate('name'), [onUpdate]);
  const onUpdateDescription = useMemo(
    () => onUpdate('description'),
    [onUpdate]
  );

  const description = useMemo(
    () => _.get('description', dataEntry),
    [dataEntry]
  );

  const permissionsResource = useMemo(
    () => ({ group, dataEntry }),
    [dataEntry, group]
  );

  return (
    <ListItem sx={{ p: 0, flexDirection: 'column' }}>
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ fontSize: 14, color: 'gray.dark1', p: 1 }}
      >
        <Grid
          item
          xs={isEditingName ? 12 : 8}
          md={4}
          order={{ xs: 2, md: 2 }}
          component={StackRow}
        >
          <EntryTypeIcon resourceType={dataEntry.resourceType} />
          <Restricted
            permission="sharedData.edit"
            resource={permissionsResource}
            FallbackComponent={() => <Typography>{dataEntry.name}</Typography>}
          >
            <EditableText
              id={`name-${dataEntry.id}`}
              label={t('sharedData.name_update')}
              value={dataEntry.name}
              onSave={onUpdateName}
              processing={processing}
              isEditing={isEditingName}
              setIsEditing={setIsEditingName}
              viewProps={{ color: 'black', sx: { flexGrow: 1 } }}
            />
          </Restricted>
        </Grid>
        <Grid item xs={1} order={{ xs: 5 }} display={{ md: 'none' }} />
        <Grid
          item
          xs={11}
          md={3}
          order={{ xs: 6, md: 3 }}
          sx={{ wordWrap: 'break-word' }}
        >
          {info}
        </Grid>
        <Grid item xs={1} order={{ xs: 7 }} display={{ md: 'none' }} />
        <Grid item xs={11} md={3} order={{ xs: 8, md: 4 }}>
          {formatDate(i18n.resolvedLanguage, dataEntry.createdAt)}, by{' '}
          {t('user.full_name', { user: dataEntry.createdBy })}
        </Grid>
        <Grid
          item
          xs={4}
          md={2}
          order={{ xs: 3, md: 4 }}
          component={StackRow}
          justifyContent="flex-end"
          display={isEditingName ? 'none' : 'inherit'}
        >
          <Restricted
            permission="sharedData.delete"
            resource={permissionsResource}
          >
            <ConfirmButton
              onConfirm={onConfirm}
              loading={processing}
              variant="text"
              buttonProps={{
                'aria-label': t('sharedData.delete_label', {
                  name: dataEntry.name,
                }),
              }}
              confirmTitle={t('sharedData.delete_confirm_title', {
                name: dataEntry.name,
              })}
              confirmMessage={t(
                dataEntry.entryType === 'LINK'
                  ? 'sharedData.delete_link_confirm_message'
                  : 'sharedData.delete_file_confirm_message',
                {
                  name: dataEntry.name,
                }
              )}
              confirmButton={t(
                dataEntry.entryType === 'LINK'
                  ? 'sharedData.delete_link_confirm_button'
                  : 'sharedData.delete_file_confirm_button'
              )}
              tooltip={deleteTooltip}
            >
              <DeleteIcon
                sx={{
                  fontSize: ICON_SIZE,
                  color: theme.palette.secondary.main,
                }}
              />
            </ConfirmButton>
          </Restricted>
          <Restricted permission="sharedData.download" resource={group}>
            <DownloadComponent group={group} dataEntry={dataEntry} />
          </Restricted>
        </Grid>
        <Grid item xs={1} order={{ xs: 9 }} display={{ md: 'none' }} />
        <Grid
          item
          xs={isEditingDescription ? 12 : 9}
          md={10}
          order={{ xs: 10, md: 7 }}
        >
          <Restricted
            permission="sharedData.edit"
            resource={permissionsResource}
            FallbackComponent={() => (
              <Typography variant="body1">{dataEntry.description}</Typography>
            )}
          >
            <EditableText
              id={`description-${dataEntry.id}`}
              label={t('sharedData.description_update')}
              value={description}
              processing={processing}
              isEditing={isEditingDescription}
              setIsEditing={setIsEditingDescription}
              addMessage={t(
                dataEntry.entryType === 'LINK'
                  ? 'sharedData.add_link_description_message'
                  : 'sharedData.add_file_description_message'
              )}
              onSave={onUpdateDescription}
              viewProps={{ variant: 'body1' }}
            />
          </Restricted>
        </Grid>
      </Grid>
      {children}
    </ListItem>
  );
};

export default SharedDataEntryBase;
