import React, { useEffect, useState } from 'react';

import filesize from 'filesize';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';

import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MapIcon from '@mui/icons-material/Map';
import {
  Button,
  Divider,
  Grid,
  Link,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';

import ConfirmButton from 'common/components/ConfirmButton';
import EditableText from 'common/components/EditableText';
import { formatDate } from 'localization/utils';
import { useAnalytics } from 'monitoring/analytics';
import Restricted from 'permissions/components/Restricted';

import { useGroupContext } from 'group/groupContext';
import { useSharedData } from 'sharedData/sharedDataHooks';
import {
  deleteSharedData,
  resetProcessing,
  updateSharedData,
} from 'sharedData/sharedDataSlice';

import SharedFileIcon from './SharedFileIcon';

import theme from 'theme';

const ICON_SIZE = 24;

const StackRow = props => (
  <Stack direction="row" alignItems="center" {...props} />
);

const Visualizations = props => {
  const { baseOwnerUrl } = useGroupContext();
  const { i18n, t } = useTranslation();
  const { file } = props;
  if (_.isEmpty(file.visualizations)) {
    return null;
  }

  return (
    <Stack
      component="ul"
      sx={{ width: '100%', listStyle: 'none', p: 0 }}
      divider={<Divider component="li" />}
    >
      {file.visualizations.map(visualization => (
        <Grid
          container
          component={ListItem}
          key={visualization.id}
          sx={{ bgcolor: 'gray.lite2', fontSize: 14, color: 'gray.dark1' }}
        >
          <Grid item xs={1}>
            <MapIcon />
          </Grid>
          <Grid item xs={4}>
            <Link
              component={RouterLink}
              to={`${baseOwnerUrl}/visualization/${visualization.id}`}
            >
              {_.get('configuration.annotateConfig.mapTitle', visualization)}
            </Link>
          </Grid>
          <Grid item xs={6}>
            {formatDate(i18n.resolvedLanguage, visualization.createdAt)}, by{' '}
            {t('user.full_name', { user: visualization.createdBy })}
          </Grid>
        </Grid>
      ))}
    </Stack>
  );
};

const SharedDataEntry = ({ file }) => {
  const { i18n, t } = useTranslation();
  const { group, owner, updateOwner } = useGroupContext();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const processing = useSelector(_.get(`sharedData.processing.${file.id}`));
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { downloadFile } = useSharedData();

  useEffect(() => {
    dispatch(resetProcessing(file.id));
  }, [dispatch, file]);

  const handleDownload = e => {
    e.preventDefault();
    downloadFile(file);
  };

  const onConfirm = () => {
    dispatch(deleteSharedData({ groupSlug: group.slug, file })).then(() => {
      updateOwner();
      trackEvent('deleteFile', { props: { owner: owner.slug } });
    });
  };

  const onUpdate = field => value => {
    dispatch(
      updateSharedData({
        file: {
          ..._.pick(['id', 'name', 'description'], file),
          [field]: value,
        },
      })
    ).then(() => {
      updateOwner();
      trackEvent('editFile', { props: { owner: owner.slug } });
    });
  };

  const description = _.get('description', file);

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
          <SharedFileIcon resourceType={file.resourceType} />
          <Restricted
            permission="sharedData.edit"
            resource={{ group, file }}
            FallbackComponent={() => <Typography>{file.name}</Typography>}
          >
            <EditableText
              id={`name-${file.id}`}
              label={t('sharedData.name_update')}
              value={file.name}
              onSave={onUpdate('name')}
              processing={processing}
              isEditing={isEditingName}
              setIsEditing={setIsEditingName}
              viewProps={{ color: 'black', sx: { flexGrow: 1 } }}
            />
          </Restricted>
        </Grid>
        <Grid item xs={2} md={1} order={{ xs: 6, md: 3 }}>
          {filesize(file.size, { round: 0 })}
        </Grid>
        <Grid item xs={9} md={5} order={{ xs: 7, md: 4 }}>
          {formatDate(i18n.resolvedLanguage, file.createdAt)}, by{' '}
          {t('user.full_name', { user: file.createdBy })}
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
          <Restricted permission="sharedData.delete" resource={{ group, file }}>
            <ConfirmButton
              onConfirm={onConfirm}
              loading={processing}
              variant="text"
              buttonProps={{
                'aria-label': t('sharedData.delete_label', {
                  name: file.name,
                }),
              }}
              confirmTitle={t('sharedData.delete_confirm_title', {
                name: file.name,
              })}
              confirmMessage={t('sharedData.delete_confirm_message', {
                name: file.name,
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
            <Button
              onClick={handleDownload}
              aria-label={t('sharedData.download_label', {
                name: file.name,
              })}
              startIcon={
                <FileDownloadIcon
                  sx={{
                    marginTop: '2px',
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    color: theme.palette.gray.dark1,
                  }}
                />
              }
            />
          </Restricted>
        </Grid>
        <Grid
          item
          xs={isEditingDescription ? 12 : 9}
          md={10}
          order={{ xs: 9, md: 7 }}
        >
          <Restricted
            permission="sharedData.edit"
            resource={{ group, file }}
            FallbackComponent={() => (
              <Typography variant="body1">{file.description}</Typography>
            )}
          >
            <EditableText
              id={`description-${file.id}`}
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
        <Grid item xs={1} order={{ xs: 5 }} display={{ md: 'none' }} />
        <Grid item xs={1} order={{ xs: 8 }} display={{ md: 'none' }} />
      </Grid>
      <Visualizations file={file} />
    </ListItem>
  );
};

export default SharedDataEntry;
