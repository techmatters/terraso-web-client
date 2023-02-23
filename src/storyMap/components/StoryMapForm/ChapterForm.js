import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  IconButton,
  Stack,
} from '@mui/material';

import { chapterHasVisualMedia } from 'storyMap/storyMapUtils';

import { withProps } from 'react-hoc';

import { ALIGNMENTS } from '../../storyMapConstants';
import EditableMedia from './EditableMedia';
import EditableRichText from './EditableRichText';
import EditableText from './EditableText';
import MapLocationDialog from './MapLocationDialog';
import { useConfigContext } from './configContext';

const ConfigButton = withProps(IconButton, {
  size: 'small',
  sx: {
    bgcolor: 'gray.lite1',
    borderRadius: 0,
    '&:hover': { bgcolor: 'gray.mid', borderRadius: 0 },
  },
});
const ChapterConfig = props => {
  const { t } = useTranslation();
  const { onAlignmentChange, chapter, onLocationChange, children } = props;
  const [locationOpen, setLocationOpen] = useState(false);

  const options = useMemo(
    () => [
      {
        label: t('storyMap.form_chapter_alignment_left'),
        Icon: AlignHorizontalLeftIcon,
        value: 'left',
      },
      {
        label: t('storyMap.form_chapter_alignment_center'),
        Icon: AlignHorizontalCenterIcon,
        value: 'center',
      },
      {
        label: t('storyMap.form_chapter_alignment_right'),
        Icon: AlignHorizontalRightIcon,
        value: 'right',
      },
    ],
    [t]
  );

  const onLocationClick = useCallback(() => {
    setLocationOpen(true);
  }, []);

  const onLocationClose = useCallback(() => {
    setLocationOpen(false);
  }, []);

  const onLocationChangeWrapper = useCallback(
    location => {
      onLocationChange(location);
      onLocationClose();
    },
    [onLocationChange, onLocationClose]
  );

  const hasVisualMedia = chapterHasVisualMedia(chapter);

  return (
    <>
      <MapLocationDialog
        open={locationOpen}
        location={chapter.location}
        title={chapter.title}
        chapterId={chapter.id}
        onClose={onLocationClose}
        onConfirm={onLocationChangeWrapper}
      />
      <Grid container sx={{ width: hasVisualMedia ? '50vw' : '35vw' }}>
        <Grid item xs={11}>
          <Button
            variant="contained"
            onClick={onLocationClick}
            startIcon={<GpsFixedIcon />}
            sx={{ borderRadius: '0px', mb: 1, width: '100%' }}
          >
            {t('storyMap.form_chapter_location_button')}
          </Button>
        </Grid>
        <Grid item xs={11}>
          {children}
        </Grid>
        <Grid item xs={1}>
          <ButtonGroup
            orientation="vertical"
            aria-label={t('storyMap.form_chapter_alignment_buttons')}
          >
            {options.map(option => (
              <ConfigButton
                key={option.value}
                aria-label={option.label}
                onClick={() => onAlignmentChange(option.value)}
              >
                <option.Icon />
              </ConfigButton>
            ))}
          </ButtonGroup>
        </Grid>
      </Grid>
    </>
  );
};

const ChapterForm = ({ theme, record }) => {
  const { t } = useTranslation();
  const { setConfig, init } = useConfigContext();
  const [isNew, setIsNew] = useState(false);

  const classList = useMemo(
    () =>
      [
        'step-container',
        'active',
        ALIGNMENTS[record.alignment] || 'centered',
        ...(record.hidden ? ['hidden'] : []),
      ].join(' '),
    [record.alignment, record.hidden]
  );

  useEffect(() => {
    if (init.current) {
      setIsNew(true);
    }
  }, [init, record.id]);

  const onFieldChange = useCallback(
    field => value => {
      setConfig(config => ({
        ...config,
        chapters: config.chapters.map(chapter =>
          chapter.id === record.id ? { ...chapter, [field]: value } : chapter
        ),
      }));
    },
    [record.id, setConfig]
  );

  return (
    <Box
      className={classList}
      direction="row"
      component="section"
      aria-label={t('storyMap.view_chapter_label', {
        title: record.title || t('storyMap.form_chapter_no_title_label'),
      })}
    >
      {/* div with ID added because of an Intersection Observer issue with overflow */}
      <div className="step" id={record.id}></div>
      <ChapterConfig
        chapter={record}
        onAlignmentChange={onFieldChange('alignment')}
        onLocationChange={onFieldChange('location')}
      >
        <Stack
          className={`${theme} step-content`}
          spacing={1}
          style={{ maxWidth: 'none' }}
        >
          <EditableText
            placeholder={t('storyMap.form_chapter_title_placeholder')}
            Component="h2"
            value={record.title}
            onChange={onFieldChange('title')}
            focus={isNew}
            inputProps={{
              inputProps: {
                'aria-label': t('storyMap.form_chapter_title_label'),
              },
            }}
          />
          <EditableMedia
            label={t('storyMap.form_chapter_media_label')}
            value={record.media}
            onChange={onFieldChange('media')}
          />
          <EditableRichText
            label={t('storyMap.form_chapter_description_label')}
            placeholder={t('storyMap.form_chapter_description_placeholder')}
            value={record.description}
            onChange={onFieldChange('description')}
          />
        </Stack>
      </ChapterConfig>
    </Box>
  );
};

export default ChapterForm;
