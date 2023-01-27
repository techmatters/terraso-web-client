import React, { useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';

import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { Box, ButtonGroup, IconButton, Stack } from '@mui/material';

import { withProps } from 'react-hoc';

import { ALIGNMENTS } from '../../storyMapConstants';
import EditableText from './EditableText';
import MapLocationDialog from './MapLocationDialog';
import { useConfigContext } from './configContext';

const ConfigButton = withProps(IconButton, {
  size: 'small',
  sx: { bgcolor: 'gray.lite1', '&:hover': { bgcolor: 'gray.mid' } },
});
const ChapterConfig = props => {
  const { onAlignmentChange, location, onLocationChange } = props;
  const [locationOpen, setLocationOpen] = useState(false);

  const options = [
    {
      label: 'TODO',
      Icon: AlignHorizontalLeftIcon,
      value: 'left',
    },
    {
      label: 'TODO',
      Icon: AlignHorizontalCenterIcon,
      value: 'center',
    },
    {
      label: 'TODO',
      Icon: AlignHorizontalRightIcon,
      value: 'right',
    },
  ];

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

  return (
    <>
      <MapLocationDialog
        open={locationOpen}
        location={location}
        onClose={onLocationClose}
        onConfirm={onLocationChangeWrapper}
      />
      <Stack spacing={1}>
        <ConfigButton
          aria-label="TODO"
          onClick={onLocationClick}
          sx={{
            bgcolor: 'blue.dark',
            color: 'white',
            '&:hover': { bgcolor: 'blue.mid' },
          }}
        >
          <GpsFixedIcon />
        </ConfigButton>
        <ButtonGroup orientation="vertical" aria-label="TODO">
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
      </Stack>
    </>
  );
};

const ChapterForm = ({ theme, record }) => {
  const { t } = useTranslation();
  const { setConfig } = useConfigContext();
  const classList = [
    'step',
    ALIGNMENTS[record.alignment] || 'centered',
    ...(record.hidden ? ['hidden'] : []),
  ].join(' ');

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
    <Box id={record.id} className={classList} direction="row">
      <Stack
        className={`${theme} step-content`}
        spacing={1}
        sx={{ minWidth: '200px' }}
      >
        <EditableText
          placeholder={t('storyMap.form_chapter_title_placeholder')}
          Component="h3"
          value={record.title}
          onChange={onFieldChange('title')}
        />
        {record.image && <img src={record.image} alt={record.title}></img>}
        <EditableText
          placeholder={t('storyMap.form_chapter_description_placeholder')}
          Component="p"
          value={record.description}
          onChange={onFieldChange('description')}
          inputProps={{
            multiline: true,
            rows: 4,
          }}
        />
      </Stack>
      <ChapterConfig
        location={record.location}
        onAlignmentChange={onFieldChange('alignment')}
        onLocationChange={onFieldChange('location')}
      />
    </Box>
  );
};

export default ChapterForm;
