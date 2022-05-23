import React from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Link,
  List,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import Restricted from 'permissions/components/Restricted';

import { useGroupContext } from 'group/groupContext';

import { withProps } from 'react-hoc';

import SharedDataEntry from './SharedDataEntry';

import theme from 'theme';

const EntriesList = withProps(List, {
  component: withProps(Stack, {
    divider: <Divider component="li" />,
    component: withProps(Paper, {
      variant: 'outlined',
      component: 'ul',
    }),
  }),
});

const SharedFilesCard = props => {
  const { t } = useTranslation();
  const { onUploadClick } = props;
  const { group } = useGroupContext();
  const { dataEntries: sharedFiles } = group;
  const hasFiles = !_.isEmpty(sharedFiles);

  return (
    <Restricted permission="group.viewFiles" resource={group}>
      <Card
        component="section"
        aria-labelledby="shared-data-card-title"
        variant="outlined"
      >
        <CardHeader
          disableTypography
          title={
            <Typography variant="h2" id="shared-data-card-title">
              {t('shared_data.title')}
            </Typography>
          }
        />
        <CardContent>
          {hasFiles && (
            <>
              <EntriesList aria-describedby="shared-data-card-title">
                {sharedFiles.map(file => (
                  <SharedDataEntry key={file.id} file={file} group={group} />
                ))}
              </EntriesList>
              <Typography
                variant="body1"
                sx={{
                  marginTop: theme.spacing(2),
                  marginBottom: theme.spacing(2),
                }}
              >
                {' '}
                <Trans i18nKey="shared_data.description">
                  Prefix
                  <Link href={t('shared_data.learn_more_url')} target="_blank">
                    link
                  </Link>
                  .
                </Trans>
              </Typography>
            </>
          )}
          <Button variant="outlined" onClick={onUploadClick}>
            {t('shared_data.upload_button')}
          </Button>
        </CardContent>
      </Card>
    </Restricted>
  );
};

export default SharedFilesCard;
