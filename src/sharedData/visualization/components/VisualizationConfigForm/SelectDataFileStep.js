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
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Grid,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Radio,
  Stack,
  Typography,
} from '@mui/material';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import List from 'common/components/List';
import StepperStep from 'common/components/StepperStep';
import PageLoader from 'layout/PageLoader';
import { formatDate } from 'localization/utils';
import SharedFileIcon from 'sharedData/components/SharedFileIcon';
import {
  fetchAllDataEntries,
  fetchDataEntries,
} from 'sharedData/sharedDataSlice';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';
import UploadFileDialog from 'storyMap/components/StoryMapForm/UploadFileDialog';

import { MAP_LAYER_ACCEPTED_EXTENSIONS } from 'config';

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
  const { visualizationConfig, restrictSourceToOwner } =
    useVisualizationContext();
  const { onNext, onBack } = props;
  const { owner, entityType } = useCollaborationContext();
  const { data: sharedFiles, fetching } = useSelector(
    _.get('sharedData.dataEntries')
  );
  const [selected, setSelected] = useState();
  const [uploadFileOpen, setFileUploadOpen] = useState(false);

  useEffect(() => {
    if (visualizationConfig?.selectedFile) {
      setSelected(visualizationConfig?.selectedFile);
    }
  }, [visualizationConfig?.selectedFile]);

  useEffect(() => {
    if (!uploadFileOpen) {
      dispatch(
        restrictSourceToOwner
          ? fetchDataEntries({
              targetSlug: owner.slug,
              targetType: entityType,
              resourceTypes: MAP_LAYER_ACCEPTED_EXTENSIONS,
            })
          : fetchAllDataEntries({
              resourceTypes: MAP_LAYER_ACCEPTED_EXTENSIONS,
            })
      );
    }
  }, [dispatch, owner.slug, entityType, restrictSourceToOwner, uploadFileOpen]);

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
      <Button variant="contained" onClick={() => setFileUploadOpen(true)}>
        Add a new file
      </Button>
      <UploadFileDialog
        open={uploadFileOpen}
        onClose={() => setFileUploadOpen(false)}
        targetSlug={owner.slug}
        targetType={entityType}
      />
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
                  slotProps={{
                    input: {
                      'aria-labelledby': `selectable-file-${file.id}`,
                    },
                  }}
                />
              </ListItemIcon>
              <Grid
                container
                sx={{ fontSize: 14, color: 'gray.dark1', flexGrow: 1 }}
                spacing={1}
              >
                <Grid size={{ xs: 12, md: 6 }} component={StackRow}>
                  <SharedFileIcon resourceType={file.resourceType} />
                  <Typography id={`selectable-file-${file.id}`}>
                    {file.name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 3, md: 1 }}>
                  {TYPE_LABEL[file.resourceType]}
                </Grid>
                <Grid size={{ xs: 2, md: 1 }}>
                  {filesize(file.size, { round: 0 })}
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
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
    </StepperStep>
  );
};

export default SelectDataFileStep;
