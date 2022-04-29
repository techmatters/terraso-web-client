import React from 'react';

import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';

import Tool from 'tool/components/Tool';

import theme from 'theme';

const ToolList = ({ tools }) => {
  const { t } = useTranslation();

  const toolList = ['kobo'];

  useDocumentTitle(t('tool.list_document_title'));

  return (
    <PageContainer>
      <PageHeader
        header={t('tool.list_title')}
        documentTitle={t('tool.list_document_title')}
      />
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
