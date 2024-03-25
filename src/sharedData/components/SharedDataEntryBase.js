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

import { useCollaborationContext } from 'collaboration/collaborationContext';
import ConfirmButton from 'common/components/ConfirmButton';
import EditableText from 'common/components/EditableText';
import MiddleEllipsis from 'common/components/MiddleEllipsis';
import { formatDate } from 'localization/utils';
import { useAnalytics } from 'monitoring/analytics';
import Restricted from 'permissions/components/Restricted';
import {
  deleteSharedData,
  resetProcessing,
  updateSharedData,
  updateSharedResource,
} from 'sharedData/sharedDataSlice';

import theme from 'theme';

export const ICON_SIZE = 24;

const StackRow = props => (
  <Stack direction="row" alignItems="center" {...props} />
);

const SharedDataEntryBase = props => {
  const { i18n, t } = useTranslation();
  const { owner, entityType, updateOwner } = useCollaborationContext();
  const {
    sharedResource,
    children,
    EntryTypeIcon,
    DownloadComponent,
    ShareComponent,
    fileSize,
    resourceType,
    deleteTooltip,
  } = props;
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const dataEntry = useMemo(
    () => sharedResource.dataEntry,
    [sharedResource.dataEntry]
  );
  const processing = useSelector(
    _.get(`sharedData.processing.${sharedResource.id}`)
  );
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();

  const onConfirm = useCallback(() => {
    dispatch(deleteSharedData({ dataEntry, sharedResource })).then(data => {
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
    });
  }, [
    dataEntry,
    dispatch,
    owner.slug,
    trackEvent,
    updateOwner,
    entityType,
    sharedResource,
  ]);

  const onUpdate = useCallback(
    field => value => {
      dispatch(
        updateSharedData({
          sharedResource,
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
    [
      dataEntry,
      dispatch,
      owner.slug,
      trackEvent,
      updateOwner,
      entityType,
      sharedResource,
    ]
  );

  const onUpdateName = useMemo(() => onUpdate('name'), [onUpdate]);
  const onUpdateDescription = useMemo(
    () => onUpdate('description'),
    [onUpdate]
  );

  const onUpdateSharedResource = useCallback(
    sharedResource => {
      return dispatch(
        updateSharedResource({
          sharedResource,
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
        return data;
      });
    },
    [dataEntry, dispatch, owner.slug, trackEvent, updateOwner, entityType]
  );

  const description = useMemo(
    () => _.get('description', dataEntry),
    [dataEntry]
  );

  const permissionsResource = useMemo(
    () => ({ owner, dataEntry }),
    [dataEntry, owner]
  );

  return (
    <ListItem sx={{ p: 0, flexDirection: 'column' }}>
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{
          fontSize: 14,
          color: 'gray.dark1',
          p: 1,
        }}
      >
        <Grid
          item
          xs={isEditingName ? 12 : 7}
          md={5}
          order={{ xs: 2, md: 2 }}
          component={StackRow}
        >
          <EntryTypeIcon resourceType={dataEntry.resourceType} />
          <Restricted
            permission="sharedData.edit"
            resource={permissionsResource}
            FallbackComponent={() => (
              <MiddleEllipsis>
                <Typography component="span">{dataEntry.name}</Typography>
              </MiddleEllipsis>
            )}
          >
            <EditableText
              id={`name-${dataEntry.id}`}
              label={t('sharedData.name_update')}
              value={dataEntry.name}
              truncateLongNames
              onSave={onUpdateName}
              processing={processing}
              isEditing={isEditingName}
              setIsEditing={setIsEditingName}
              viewProps={{
                color: 'black',
                sx: { flexGrow: 1, overflow: 'hidden' },
              }}
            />
          </Restricted>
        </Grid>

        <Grid item xs={1} order={{ xs: 4 }} display={{ md: 'none' }} />
        <Grid
          item
          xs={2}
          md={1}
          order={{ xs: 5, md: 4 }}
          sx={{ wordWrap: 'break-word', textTransform: 'uppercase' }}
        >
          {resourceType}
        </Grid>
        <Grid
          item
          xs={2}
          md={1}
          order={{ xs: 6, md: 5 }}
          sx={{ wordWrap: 'break-word' }}
        >
          {fileSize}
        </Grid>
        <Grid item xs={7} order={{ xs: 7 }} display={{ md: 'none' }} />
        <Grid item xs={1} order={{ xs: 7 }} display={{ md: 'none' }} />
        <Grid item xs={11} md={3} order={{ xs: 8, md: 6 }}>
          {formatDate(i18n.resolvedLanguage, dataEntry.createdAt)}, by{' '}
          {t('user.full_name', { user: dataEntry.createdBy })}
        </Grid>

        <Grid
          item
          xs={5}
          md={2}
          order={{ xs: 3, md: 6 }}
          component={StackRow}
          justifyContent="flex-end"
          display={isEditingName ? 'none' : 'inherit'}
        >
          {ShareComponent && (
            <ShareComponent
              sharedResource={sharedResource}
              onUpdateSharedResource={onUpdateSharedResource}
            />
          )}
          <Restricted
            permission="sharedData.delete"
            resource={permissionsResource}
          >
            <ConfirmButton
              onConfirm={onConfirm}
              loading={processing}
              variant="text"
              buttonProps={{
                title: t('sharedData.delete_label', {
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
          <Restricted permission="sharedData.download" resource={owner}>
            <DownloadComponent sharedResource={sharedResource} />
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
