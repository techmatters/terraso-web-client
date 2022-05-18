import React from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Link,
  Typography,
} from '@mui/material';

import Restricted from 'permissions/components/Restricted';

import FileCard from './FileCard';

import theme from 'theme';

const SharedFilesCard = ({ group }) => {
  const { t } = useTranslation();
  const { dataEntries: sharedFiles } = group;
  const hasFiles = !_.isEmpty(sharedFiles);

  return (
    <Restricted permission="group.viewFiles" resource={group}>
      <Card variant="outlined">
        <CardHeader
          disableTypography
          title={
            <Typography variant="h2" id="group-view-card-title">
              {t('shared_files.title')}
            </Typography>
          }
        />
        <CardContent>
          {hasFiles && (
            <>
              {sharedFiles.map((item, index) => (
                <FileCard key={index} file={item} group={group} />
              ))}
              <Typography
                variant="body1"
                sx={{
                  marginTop: theme.spacing(2),
                  marginBottom: theme.spacing(2),
                }}
              >
                {' '}
                <Trans i18nKey="shared_files.description">
                  Prefix
                  <Link href={t('shared_files.learn_more_url')} target="_blank">
                    link
                  </Link>
                  .
                </Trans>
              </Typography>
            </>
          )}
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/groups/${group.slug}/upload`}
          >
            {t('shared_files.upload_button')}
          </Button>
        </CardContent>
      </Card>
    </Restricted>
  );
};

export default SharedFilesCard;
