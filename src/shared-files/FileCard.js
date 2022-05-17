import React from 'react';

import filesize from 'filesize';
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

const formatDate = (language, dateString) =>
  new Intl.DateTimeFormat(language).format(Date.parse(dateString));

const FileCard = ({ file, group }) => {
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

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={1} md={1} order={{ xs: 1, md: 1 }}>
            <Restricted permission="file.download" resource={group}>
              <Button
                onClick={handleDownload}
                startIcon={<InsertDriveFileOutlinedIcon />}
                sx={{ marginTop: '-5px' }}
              />
            </Restricted>
          </Grid>
          <Grid item xs={9} md={4} order={{ xs: 2, md: 2 }}>
            <Restricted
              permission="file.download"
              resource={group}
              FallbackComponent={() => <Typography>{file.name}</Typography>}
            >
              <Link
                href="#"
                sx={{ cursor: 'pointer' }}
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
            <Restricted permission="file.download" resource={group}>
              <Button
                onClick={handleDownload}
                startIcon={<FileDownloadIcon />}
              />
            </Restricted>
          </Grid>
          <Grid item xs={1} md={1} order={{ xs: 4, md: 6 }}>
            <Restricted
              permission="file.delete"
              resource={{ group: group, file: file }}
            >
              <ConfirmButton
                onConfirm={onConfirm}
                variant="text"
                confirmTitle={t('shared_files.delete_confirm_title', {
                  name: file.name,
                })}
                confirmMessage={t('shared_files.delete_confirm_message', {
                  name: file.name,
                })}
                confirmButton={t('shared_files.delete_confirm_button')}
              >
                <DeleteIcon sx={{ marginTop: '-5px', marginLeft: '-35px' }} />
              </ConfirmButton>
            </Restricted>
          </Grid>
          <Grid item xs={11} md={12} order={{ xs: 9, md: 7 }}>
            <Typography variant="body1">{file.description}</Typography>
          </Grid>
          <Grid item xs={1} order={{ xs: 5 }} display={{ md: 'none' }} />
          <Grid item xs={1} order={{ xs: 8 }} display={{ md: 'none' }} />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FileCard;
