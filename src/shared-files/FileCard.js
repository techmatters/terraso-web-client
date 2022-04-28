import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  Grid,
  Link,
  Typography,
} from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';

import ConfirmButton from 'common/components/ConfirmButton';

const FileCard = ({ file }) => {
  const { t } = useTranslation();

  const onConfirm = () => {
    console.log('deleting...');
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={1}>
            <Button
              startIcon={<InsertDriveFileOutlinedIcon />}
              sx={{ marginTop: '-5px' }}
            />
          </Grid>
          <Grid item xs={4}>
            <Link href={`/files/${file.id}/download`}>{file.name}</Link>
          </Grid>
          <Grid item xs={1}>
            {file.size}MB
          </Grid>
          <Grid item xs={4}>
            {file.date}
          </Grid>
          <Grid item xs={2}>
            <Button
              to={`/files/${file.id}/download`}
              startIcon={<FileDownloadIcon />}
              sx={{ marginTop: '-5px' }}
            />
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
              <DeleteIcon sx={{ marginTop: '-5px' }} />
            </ConfirmButton>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">{file.description}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FileCard;
