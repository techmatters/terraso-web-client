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
          <Grid item xs={1} md={1} order={{ xs: 1, md: 1 }}>
            <Button
              startIcon={<InsertDriveFileOutlinedIcon />}
              sx={{ marginTop: '-5px' }}
            />
          </Grid>
          <Grid item xs={9} md={4} order={{ xs: 2, md: 2 }}>
            <Link href={`/files/${file.id}/download`}>{file.name}</Link>
          </Grid>
          <Grid item xs={2} md={1} order={{ xs: 6, md: 3 }}>
            {file.size}MB
          </Grid>
          <Grid item xs={9} md={4} order={{ xs: 7, md: 4 }}>
            {file.date}, by {file.owner}
          </Grid>
          <Grid item xs={1} md={1} order={{ xs: 3, md: 5 }}>
            <Button
              to={`/files/${file.id}/download`}
              startIcon={<FileDownloadIcon />}
            />
          </Grid>
          <Grid item xs={1} md={1} order={{ xs: 4, md: 6 }}>
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
