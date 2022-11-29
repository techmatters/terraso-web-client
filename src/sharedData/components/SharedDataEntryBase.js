import React, { useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import DeleteIcon from '@mui/icons-material/Delete';
import { Grid, ListItem, Stack, Typography } from '@mui/material';

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
  const { group, owner, updateOwner } = useGroupContext();
  const { dataEntry, children, EntryTypeIcon, DownloadComponent, info } = props;
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const processing = useSelector(
    _.get(`sharedData.processing.${dataEntry.id}`)
  );
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();

  const onConfirm = () => {
    dispatch(deleteSharedData({ groupSlug: group.slug, dataEntry })).then(
      data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          updateOwner();
          trackEvent('deletedataEntry', { props: { owner: owner.slug } });
          dispatch(resetProcessing(dataEntry.id));
        }
      }
    );
  };

  const onUpdate = field => value => {
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
        trackEvent('editdataEntry', { props: { owner: owner.slug } });
      }
    });
  };

  const description = _.get('description', dataEntry);

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
            resource={{ group, dataEntry }}
            FallbackComponent={() => <Typography>{dataEntry.name}</Typography>}
          >
            <EditableText
              id={`name-${dataEntry.id}`}
              label={t('sharedData.name_update')}
              value={dataEntry.name}
              onSave={onUpdate('name')}
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
            resource={{ group, dataEntry }}
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
              confirmMessage={t('sharedData.delete_confirm_message', {
                name: dataEntry.name,
              })}
              confirmButton={t('sharedData.delete_confirm_button')}
            >
              <DeleteIcon
                sx={{
                  fontSize: ICON_SIZE,
                  color: theme.palette.gray.dark1,
                }}
              />
            </ConfirmButton>
          </Restricted>
          <Restricted permission="sharedData.download" resource={group}>
            <DownloadComponent dataEntry={dataEntry} />
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
            resource={{ group, dataEntry }}
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
              addMessage={t('sharedData.add_description_message')}
              onSave={onUpdate('description')}
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
