import React, { useEffect, useState } from 'react';

import fileSize from 'filesize';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
  Grid,
  ListItem,
  ListItemButton,
  ListItemIcon,
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
import { fetchGroupSharedData } from 'sharedData/sharedDataSlice';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

const ACCEPTED_RESOURCE_TYPES = ['csv', 'xls', 'xlsx'];

const StackRow = props => (
  <Stack direction="row" alignItems="center" spacing={1} {...props} />
);

const SelectDataFileStep = props => {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const { visualizationConfig } = useVisualizationContext();
  const { onNext, onBack } = props;
  const { group } = useGroupContext();
  const { data: sharedFiles, fetching } = useSelector(_.get('sharedData.list'));
  const [selected, setSelected] = useState();

  useEffect(() => {
    if (visualizationConfig?.selectedFile) {
      setSelected(visualizationConfig?.selectedFile);
    }
  }, [visualizationConfig?.selectedFile]);

  useEffect(() => {
    dispatch(
      fetchGroupSharedData({
        slug: group.slug,
        resourceTypes: ACCEPTED_RESOURCE_TYPES,
      })
    );
  }, [dispatch, group.slug]);

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
            href={t('sharedData.form_step_data_file_step_description_help_url')}
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
              <Grid container sx={{ fontSize: 14, color: 'gray.dark1' }}>
                <Grid item component={StackRow} xs={8} md={4}>
                  <SharedFileIcon resourceType={file.resourceType} />
                  <Typography id={`selectable-file-${file.id}`}>
                    {file.name}
                  </Typography>
                </Grid>
                <Grid item xs={2} md={1}>
                  {fileSize(file.size, { round: 0 })}
                </Grid>
                <Grid item xs={9} md={5}>
                  {formatDate(i18n.resolvedLanguage, file.createdAt)}, by{' '}
                  {t('user.full_name', { user: file.createdBy })}
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
