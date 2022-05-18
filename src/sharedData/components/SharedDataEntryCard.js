import React from 'react';

import filesize from 'filesize';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import {
  Button,
  Card,
  CardContent,
  Grid,
  Link,
  Typography,
} from '@mui/material';

import ConfirmButton from 'common/components/ConfirmButton';
import Restricted from 'permissions/components/Restricted';

import { deleteSharedDataFile } from 'group/groupSlice';

import theme from 'theme';

const ICON_SIZE = 32;

const formatDate = (language, dateString) =>
  new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(
    Date.parse(dateString)
  );

const SharedDataEntryCard = ({ file, group }) => {
  const { i18n, t } = useTranslation();
  const dispatch = useDispatch();

  // TODO: get presigned URL from backend and send user there
  const handleDownload = e => {
    e.preventDefault();
    window.open(file.url, '_blank');
  };

  const onConfirm = () => {
    dispatch(deleteSharedDataFile({ groupSlug: group.slug, file }));
  };

  const FileIcon = () => {
    switch (file.resourceType) {
      case 'csv':
      case 'xls':
      case 'xlsx':
        return (
          <img
            style={{ filter: 'opacity(50%)' }}
            width="24"
            height="24"
            src={`/files/${file.resourceType.substring(0, 3)}.png`}
            alt={file.resourceType.toUpperCase()}
          />
        );
      default:
        return (
          <InsertDriveFileOutlinedIcon
            sx={{ fontSize: ICON_SIZE, color: theme.palette.gray.mid2 }}
          />
        );
    }
  };

  const description = _.get('description', file);

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid
          container
          spacing={2}
          sx={{ fontSize: 14, color: theme.palette.gray.mid2 }}
        >
          <Grid item xs={1} md={1} order={{ xs: 1, md: 1 }}>
            <Restricted permission="sharedData.download" resource={group}>
              <Button
                onClick={handleDownload}
                startIcon={<FileIcon />}
                sx={{
                  marginTop: '-5px',
                  color: theme.palette.black,
                }}
              />
            </Restricted>
          </Grid>
          <Grid item xs={9} md={4} order={{ xs: 2, md: 2 }}>
            <Restricted
              permission="sharedData.download"
              resource={group}
              FallbackComponent={() => <Typography>{file.name}</Typography>}
            >
              <Link
                href="#"
                sx={{
                  cursor: 'pointer',
                  fontSize: 18,
                  color: theme.palette.black,
                }}
                onClick={handleDownload}
              >
                {file.name}
              </Link>
            </Restricted>
          </Grid>
          <Grid item xs={2} md={1} order={{ xs: 6, md: 3 }}>
            {filesize(file.size, { round: 0 })}
          </Grid>
          <Grid item xs={9} md={4} order={{ xs: 7, md: 4 }}>
            {formatDate(i18n.resolvedLanguage, file.createdAt)}, by{' '}
            {t('user.full_name', { user: file.createdBy })}
          </Grid>
          <Grid item xs={1} md={1} order={{ xs: 3, md: 5 }}>
            <Restricted
              permission="sharedData.delete"
              resource={{ group: group, file: file }}
            >
              <ConfirmButton
                onConfirm={onConfirm}
                variant="text"
                confirmTitle={t('shared_data.delete_confirm_title', {
                  name: file.name,
                })}
                confirmMessage={t('shared_data.delete_confirm_message', {
                  name: file.name,
                })}
                confirmButton={t('shared_data.delete_confirm_button')}
              >
                <DeleteIcon
                  sx={{
                    fontSize: ICON_SIZE,
                    color: theme.palette.gray.mid2,
                  }}
                />
              </ConfirmButton>
            </Restricted>
          </Grid>
          <Grid item xs={1} md={1} order={{ xs: 4, md: 6 }}>
            <Restricted permission="sharedData.download" resource={group}>
              <Button
                onClick={handleDownload}
                startIcon={
                  <FileDownloadIcon
                    sx={{
                      marginTop: '2px',
                      width: ICON_SIZE,
                      height: ICON_SIZE,
                      color: theme.palette.gray.mid2,
                    }}
                  />
                }
              />
            </Restricted>
          </Grid>
          {description && (
            <Grid item xs={11} md={12} order={{ xs: 9, md: 7 }}>
              <Typography variant="body1">{description}</Typography>
            </Grid>
          )}
          <Grid item xs={1} order={{ xs: 5 }} display={{ md: 'none' }} />
          <Grid item xs={1} order={{ xs: 8 }} display={{ md: 'none' }} />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SharedDataEntryCard;
