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
import React, { useEffect, useState } from 'react';
import { filesize } from 'filesize';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Paper,
  Radio,
  Stack,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import List from 'common/components/List';
import StepperStep from 'common/components/StepperStep';
import PageLoader from 'layout/PageLoader';
import { formatDate } from 'localization/utils';
import { useGroupContext } from 'group/groupContext';
import SharedFileIcon from 'sharedData/components/SharedFileIcon';
import { fetchSharedData } from 'sharedData/sharedDataSlice';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

import {
  DATA_SET_ACCPETED_EXTENSIONS,
  MAP_DATA_ACCEPTED_EXTENSIONS,
} from 'config';

const ACCEPTED_RESOURCE_TYPES = [
  ...MAP_DATA_ACCEPTED_EXTENSIONS,
  ...DATA_SET_ACCPETED_EXTENSIONS,
];

const TYPE_LABEL = {
  csv: 'CSV',
  doc: 'DOC',
  docx: 'DOCX',
  pdf: 'PDF',
  ppt: 'PPT',
  pptx: 'PPTX',
  xls: 'XLS',
  xlsx: 'XLSX',
  kmz: 'KMZ',
  kml: 'KML',
  gpx: 'GPX',
  geojson: 'GeoJSON',
  json: 'JSON',
  zip: 'ESRI',
};

const StackRow = props => (
  <Stack direction="row" alignItems="center" spacing={1} {...props} />
);

const SelectDataFileStep = props => {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const { visualizationConfig } = useVisualizationContext();
  const { onNext, onBack } = props;
  const { owner, entityType } = useGroupContext();
  const { data: sharedFiles, fetching } = useSelector(_.get('sharedData.list'));
  const [selected, setSelected] = useState();

  useEffect(() => {
    if (visualizationConfig?.selectedFile) {
      setSelected(visualizationConfig?.selectedFile);
    }
  }, [visualizationConfig?.selectedFile]);

  useEffect(() => {
    dispatch(
      fetchSharedData({
        targetSlug: owner.slug,
        targetType: entityType,
        resourceTypes: ACCEPTED_RESOURCE_TYPES,
      })
    );
  }, [dispatch, owner.slug, entityType]);

  // If there are no files to map, go back to the landscape/group index page.
  useEffect(() => {
    if (!fetching && _.isEmpty(sharedFiles)) {
      onBack();
    }
  }, [fetching, sharedFiles, onBack]);

  const onNextWrapper = () => {
    onNext(selected);
  };

  return (
    <StepperStep
      title={t('sharedData.form_step_data_file_step_title')}
      backLabel={t('sharedData.form_back')}
      onBack={onBack}
      nextLabel={t('sharedData.form_next')}
      nextDisabled={!selected}
      onNext={onNextWrapper}
    >
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Trans i18nKey="sharedData.form_step_data_file_step_description">
          <Typography sx={{ mb: 2 }} id="visualization-file-requirements">
            first
          </Typography>
          <Stack
            component="ul"
            spacing={1}
            sx={{ mb: 2 }}
            aria-labelledby="visualization-file-requirements"
          >
            <li>Requirement 1</li>
            <li>Requirement 2</li>
          </Stack>
          <Typography sx={{ mb: 2 }}>
            Recommendation
            <ExternalLink
              href={t(
                'sharedData.form_step_data_file_step_description_help_url'
              )}
            >
              help link
            </ExternalLink>
          </Typography>
        </Trans>
        <List aria-labelledby="main-heading">
          {fetching && <PageLoader />}
          {sharedFiles?.map(file => (
            <ListItem
              key={file.id}
              aria-labelledby={`selectable-file-${file.id}`}
            >
              <ListItemButton
                role={undefined}
                onClick={() => setSelected(file)}
                dense
              >
                <ListItemIcon>
                  <Radio
                    edge="start"
                    checked={file?.id === selected?.id}
                    tabIndex={-1}
                    inputProps={{
                      'aria-labelledby': `selectable-file-${file.id}`,
                    }}
                  />
                </ListItemIcon>
                <Grid
                  container
                  sx={{ fontSize: 14, color: 'gray.dark1' }}
                  spacing={1}
                >
                  <Grid item component={StackRow} xs={12} md={6}>
                    <SharedFileIcon resourceType={file.resourceType} />
                    <Typography id={`selectable-file-${file.id}`}>
                      {file.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={3} md={1}>
                    {TYPE_LABEL[file.resourceType]}
                  </Grid>
                  <Grid item xs={2} md={1}>
                    {filesize(file.size, { round: 0 })}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {t('sharedData.form_step_data_file_step_created_at', {
                      date: formatDate(i18n.resolvedLanguage, file.createdAt),
                      user: file.createdBy,
                    })}
                  </Grid>
                </Grid>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    </StepperStep>
  );
};

export default SelectDataFileStep;
