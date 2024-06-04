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
import { List, Stack, Typography } from '@mui/material';

import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import ToolCard from 'tool/components/ToolCard';

const ToolList = () => {
  const { t } = useTranslation();

  const toolList = ['storyMap', 'kobo', 'landscale', 'learning_landscapes'];

  useDocumentTitle(t('tool.list_document_title'));
  useDocumentDescription(t('tool.list_document_description'));

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
          mb: 3,
          mt: 2,
        }}
      ></Typography>
      <Stack spacing={2} component={List} aria-labelledby="main-heading">
        {toolList.map((tool, index) => (
          <ToolCard key={index} tool={tool} />
        ))}
      </Stack>
    </PageContainer>
  );
};

export default ToolList;
