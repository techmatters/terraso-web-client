import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

import Tool from 'tool/components/Tool';
import PageTitle from 'common/components/PageTitle';
import PageContainer from 'common/components/PageContainer';
import theme from 'theme';

const ToolList = ({ tools }) => {
  const { t } = useTranslation();

  const toolList = ['kobo'];

  return (
    <PageContainer>
      <PageTitle title={t('tool.list_title')} />
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2),
        }}
      ></Typography>
      {toolList.map((tool, index) => (
        <Tool key={index} tool={tool} />
      ))}
    </PageContainer>
  );
};

export default ToolList;
