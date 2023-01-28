/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
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
