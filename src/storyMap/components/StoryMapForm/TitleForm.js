import React, { useCallback, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { Box, Button, Link, Stack } from '@mui/material';

import EditableText from './EditableText';
import MapLocationDialog from './MapLocationDialog';
import { useConfigContext } from './configContext';

const TitleForm = props => {
  const { t } = useTranslation();
  const { setConfig } = useConfigContext();
  const [locationOpen, setLocationOpen] = useState(false);
  const { config } = props;

  const inputProps = useMemo(
    () => ({
      inputProps: {
        style: {
          textAlign: 'center',
        },
      },
    }),
    []
  );

  const chapters = useMemo(
    () =>
      config.chapters.map((chapter, index) => ({
        chapter,
        index,
      })),
    [config.chapters]
  );

  const outline = useMemo(
    () => (
      <p>
        {t('storyMap.view_title_outline')}:{' '}
        {_.flow(
          _.map(({ chapter, index }) => ({
            index,
            component: (
              <Link key={chapter.id} href={`#${chapter.id}`}>
                {chapter.title}
              </Link>
            ),
          })),
          _.flatMap(({ component, index }) => [
            component,
            index !== chapters.length - 1 ? (
              <span key={`divider-${index}`}> | </span>
            ) : undefined,
          ])
        )(chapters)}
      </p>
    ),
    [chapters, t]
  );

  const onFieldChange = useCallback(
    field => value => {
      setConfig(_.set(field, value));
    },
    [setConfig]
  );

  const onLocationClick = useCallback(() => {
    setLocationOpen(true);
  }, []);

  const onLocationClose = useCallback(() => {
    setLocationOpen(false);
  }, []);

  const onLocationChangeWrapper = useCallback(
    location => {
      onFieldChange('titleTransition.location')(location);
      onLocationClose();
    },
    [onFieldChange, onLocationClose]
  );

  return (
    <Box
      id="story-map-title"
      className="step active title"
      sx={{ opacity: 0.99, pb: '35vh' }}
    >
      <MapLocationDialog
        open={locationOpen}
        location={config.titleLocation}
        title={t('storyMap.form_title_location_dialog_title')}
        onClose={onLocationClose}
        onConfirm={onLocationChangeWrapper}
      />
      <Button
        variant="contained"
        startIcon={<GpsFixedIcon />}
        onClick={onLocationClick}
        sx={{ borderRadius: '0px', mb: 1, width: '100%' }}
      >
        {t('storyMap.form_title_location_button')}
      </Button>
      <Stack
        className={`${config.theme} step-content`}
        spacing={1}
        sx={{ p: 2, pr: 3 }}
      >
        <EditableText
          placeholder={t('storyMap.form_title_placeholder')}
          Component="h1"
          value={config.title}
          onChange={onFieldChange('title')}
          inputProps={inputProps}
        />
        <EditableText
          placeholder={t('storyMap.form_subtitle_placeholder')}
          Component="h2"
          value={config.subtitle}
          onChange={onFieldChange('subtitle')}
          inputProps={inputProps}
        />
        <EditableText
          placeholder={t('storyMap.form_byline_placeholder')}
          Component="p"
          value={config.byline}
          onChange={onFieldChange('byline')}
          inputProps={inputProps}
        />
        {outline}
      </Stack>
    </Box>
  );
};

export default TitleForm;
