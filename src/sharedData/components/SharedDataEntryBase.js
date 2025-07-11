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

export const GRID_BREAKPOINTS = {
  NAME_FULL: { xs: 12, md: 5 },
  NAME_PARTIAL: { xs: 7, md: 5 },
  INFO: { xs: 9, md: 2 },
  DATE: { xs: 11, md: 3 },
  ACTIONS: { xs: 5, md: 2 },
  DESCRIPTION_FULL: { xs: 12, md: 10 },
  DESCRIPTION_PARTIAL: { xs: 9, md: 10 },
};

export const isLinkEntry = dataEntry => dataEntry.entryType === 'LINK';

export const getEntryTypeTooltipKey = dataEntry =>
  isLinkEntry(dataEntry)
    ? 'sharedData.link_delete_tooltip'
    : 'sharedData.file_delete_tooltip';

export const getEntryTypeConfirmMessageKey = dataEntry =>
  isLinkEntry(dataEntry)
    ? 'sharedData.delete_link_confirm_message'
    : 'sharedData.delete_file_confirm_message';

export const getEntryTypeConfirmButtonKey = dataEntry =>
  isLinkEntry(dataEntry)
    ? 'sharedData.delete_link_confirm_button'
    : 'sharedData.delete_file_confirm_button';

export const getEntryTypeDescriptionMessageKey = dataEntry =>
  isLinkEntry(dataEntry)
    ? 'sharedData.add_link_description_message'
    : 'sharedData.add_file_description_message';

const StackRow = props => (
  <Stack direction="row" alignItems="center" {...props} />
);

const NameSection = ({
  dataEntry,
  isEditingName,
  setIsEditingName,
  onUpdateName,
  processing,
  permissionsResource,
  EntryTypeIcon,
}) => {
  const { t } = useTranslation();

  return (
    <Grid
      size={
        isEditingName
          ? GRID_BREAKPOINTS.NAME_FULL
          : GRID_BREAKPOINTS.NAME_PARTIAL
      }
      order={{ xs: 2, md: 2 }}
      component={StackRow}
      sx={{ alignItems: 'flex-start' }}
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
  );
};

const ActionsSection = ({
  isEditingName,
  ShareComponent,
  sharedResource,
  onUpdateSharedResource,
  onConfirm,
  processing,
  permissionsResource,
  DownloadComponent,
  owner,
  dataEntry,
}) => {
  const { t } = useTranslation();

  return (
    <Grid
      size={GRID_BREAKPOINTS.ACTIONS}
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
      <Restricted permission="sharedData.delete" resource={permissionsResource}>
        <ConfirmButton
          onConfirm={onConfirm}
          loading={processing}
          variant="text"
          buttonProps={{
            title: t(getEntryTypeTooltipKey(dataEntry), {
              name: dataEntry.name,
            }),
          }}
          confirmTitle={t('sharedData.delete_confirm_title', {
            name: dataEntry.name,
          })}
          confirmMessage={t(getEntryTypeConfirmMessageKey(dataEntry), {
            name: dataEntry.name,
          })}
          confirmButton={t(getEntryTypeConfirmButtonKey(dataEntry))}
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
  );
};

const DescriptionSection = ({
  isEditingDescription,
  setIsEditingDescription,
  description,
  processing,
  onUpdateDescription,
  permissionsResource,
  dataEntry,
}) => {
  const { t } = useTranslation();

  return (
    <Grid
      size={
        isEditingDescription
          ? GRID_BREAKPOINTS.DESCRIPTION_FULL
          : GRID_BREAKPOINTS.DESCRIPTION_PARTIAL
      }
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
          addMessage={t(getEntryTypeDescriptionMessageKey(dataEntry))}
          onSave={onUpdateDescription}
          viewProps={{ variant: 'body1' }}
        />
      </Restricted>
    </Grid>
  );
};

const SharedDataEntryBase = props => {
  const { i18n, t } = useTranslation();
  const { owner, entityType, updateOwner } = useCollaborationContext();
  const {
    sharedResource,
    children,
    EntryTypeIcon,
    DownloadComponent,
    ShareComponent,
    InfoComponent,
  } = props;
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const dataEntry = useMemo(
    () => sharedResource.dataEntry,
    [sharedResource.dataEntry]
  );
  const processing = useSelector(
    state => state.sharedData.processing[sharedResource.id]
  );
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();

  const permissionsResource = useMemo(
    () => ({ owner, dataEntry }),
    [dataEntry, owner]
  );

  const description = useMemo(
    () => dataEntry.description || '',
    [dataEntry.description]
  );

  const handleDeleteSuccess = useCallback(() => {
    updateOwner();
    trackEvent('dataEntry.delete', {
      props: {
        [entityType]: owner.slug,
        durationDays: daysSince(dataEntry.createdAt),
      },
    });
  }, [updateOwner, trackEvent, entityType, owner.slug, dataEntry.createdAt]);

  const onConfirm = useCallback(() => {
    dispatch(deleteSharedData({ dataEntry, sharedResource })).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        handleDeleteSuccess();
      }
      dispatch(resetProcessing(sharedResource.id));
    });
  }, [dataEntry, dispatch, sharedResource, handleDeleteSuccess]);

  const handleUpdateSuccess = useCallback(() => {
    updateOwner();
    trackEvent('dataEntry.edit', {
      props: { [entityType]: owner.slug },
    });
  }, [updateOwner, trackEvent, entityType, owner.slug]);

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
          handleUpdateSuccess();
        }
        dispatch(resetProcessing(sharedResource.id));
      });
    },
    [dataEntry, dispatch, sharedResource, handleUpdateSuccess]
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
          handleUpdateSuccess();
        }
        dispatch(resetProcessing(sharedResource.id));
        return data;
      });
    },
    [dispatch, handleUpdateSuccess]
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
          width: '100%',
        }}
      >
        <NameSection
          dataEntry={dataEntry}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          onUpdateName={onUpdateName}
          processing={processing}
          permissionsResource={permissionsResource}
          EntryTypeIcon={EntryTypeIcon}
        />

        <Grid size={{ xs: 1 }} order={{ xs: 4 }} display={{ md: 'none' }} />
        <Grid
          size={GRID_BREAKPOINTS.INFO}
          order={{ xs: 5, md: 4 }}
          component={StackRow}
          justifyContent="space-between"
        >
          {InfoComponent && <InfoComponent sharedResource={sharedResource} />}
        </Grid>
        <Grid size={{ xs: 2 }} order={{ xs: 6 }} display={{ md: 'none' }} />

        <Grid size={{ xs: 1 }} order={{ xs: 7 }} display={{ md: 'none' }} />
        <Grid size={GRID_BREAKPOINTS.DATE} order={{ xs: 8, md: 6 }}>
          {t('sharedData.file_date_and_author', {
            date: formatDate(i18n.resolvedLanguage, dataEntry.createdAt),
            user: dataEntry.createdBy,
          })}
        </Grid>

        <ActionsSection
          isEditingName={isEditingName}
          ShareComponent={ShareComponent}
          sharedResource={sharedResource}
          onUpdateSharedResource={onUpdateSharedResource}
          onConfirm={onConfirm}
          processing={processing}
          permissionsResource={permissionsResource}
          DownloadComponent={DownloadComponent}
          owner={owner}
          dataEntry={dataEntry}
        />

        <Grid size={{ xs: 1 }} order={{ xs: 9 }} display={{ md: 'none' }} />

        <DescriptionSection
          isEditingDescription={isEditingDescription}
          setIsEditingDescription={setIsEditingDescription}
          description={description}
          processing={processing}
          onUpdateDescription={onUpdateDescription}
          permissionsResource={permissionsResource}
          dataEntry={dataEntry}
        />
      </Grid>
      {children}
    </ListItem>
  );
};

export default SharedDataEntryBase;
