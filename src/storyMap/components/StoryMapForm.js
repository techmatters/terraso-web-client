import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import AddIcon from '@mui/icons-material/Add';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  OutlinedInput,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import RouterLink from 'common/components/RouterLink';

import { MAPBOX_STYLE_DEFAULT } from 'config';
import { withProps } from 'react-hoc';

import { ALIGNMENTS } from '../storyMapConstants';
import MapLocationDialog from './MapLocationDialog';
import StoryMap from './StoryMap';

import theme from 'theme';

const BASE_CHAPTER = {
  alignment: 'left',
  title: '',
  description: '',
  mapAnimation: 'flyTo',
  rotateAnimation: false,
  callback: '',
  onChapterEnter: [],
  onChapterExit: [],
};

const BASE_CONFIG = {
  style: MAPBOX_STYLE_DEFAULT,
  theme: 'dark',
  title: 'The Title Text of this Story',
  subtitle: 'A descriptive and interesting subtitle to draw in the reader',
  byline: 'By a Digital Storyteller',
  showMarkers: false,
  chapters: [
    {
      id: 'third-identifier',
      alignment: 'left',
      title: 'Chapter 1',
      description: 'Copy these sections to add to your story.',
      location: {
        center: [6.15116, 46.20595],
        zoom: 12.52,
        pitch: 8.01,
        bearing: 0.0,
      },
      mapAnimation: 'flyTo',
      rotateAnimation: false,
      callback: '',
      onChapterEnter: [],
      onChapterExit: [],
    },
    {
      id: 'fourth-chapter',
      alignment: 'right',
      title: 'Chapter 2',
      description: 'Copy these sections to add to your story.',
      mapAnimation: 'flyTo',
      location: {
        center: [-58.54195, -34.716],
        zoom: 4,
        pitch: 0,
        bearing: 0,
      },
      rotateAnimation: false,
      callback: '',
      onChapterEnter: [],
      onChapterExit: [],
    },
  ],
};

const ConfigContext = React.createContext();

const TopBar = () => {
  const { t } = useTranslation();
  const { config, setPreview, preview } = useContext(ConfigContext);

  const baseItemSx = useMemo(
    () => ({
      borderBottom: `1px solid ${theme.palette.gray.lite1}`,
      display: 'flex',
      alignItems: 'center',
      pt: 3,
      pb: 1,
      zIndex: 2,
      bgcolor: 'white',
      minHeight: 70,
    }),
    []
  );

  return (
    <>
      <Grid
        className="form-header"
        item
        xs={2}
        sx={{
          ...baseItemSx,
          width: '100%',
          zIndex: 2,
          pl: 2,
        }}
      >
        <RouterLink
          to="/story-map"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon />
          <Typography sx={{ ml: 1 }}>
            {t('storyMap.form_back_button')}
          </Typography>
        </RouterLink>
      </Grid>
      <Grid item xs={6} sx={baseItemSx}>
        <Typography variant="h3" sx={{ pt: 0 }}>
          {config.title}
        </Typography>
      </Grid>
      <Grid
        item
        xs={4}
        sx={{ ...baseItemSx, justifyContent: 'flex-end', pr: 2 }}
      >
        {preview ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPreview(false)}
          >
            Back
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPreview(true)}
          >
            Preview
          </Button>
        )}
      </Grid>
    </>
  );
};

const ChaptersSidebar = props => {
  const { t } = useTranslation();
  const { config, currentStepId, onAdd, height } = props;
  const { chapters } = config;

  const scrollTo = id => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: 'start' });
  };

  const listItems = useMemo(
    () => [
      {
        label: `${t('storyMap.form_title_chapter_label')}`,
        id: 'header',
        active: currentStepId === 'header',
      },
      ...chapters.map((chapter, index) => ({
        label: chapter.title || t('storyMap.form_chapter_no_title_label'),
        id: chapter.id,
        active: currentStepId === chapter.id,
      })),
    ],
    [chapters, currentStepId, t]
  );

  return (
    <Grid
      className="chapters-sidebar"
      item
      component={List}
      sx={{ height, overflow: 'auto' }}
      xs={2}
    >
      {listItems.map((item, index) => (
        <ListItemButton
          component="li"
          key={item.id}
          sx={{
            bgcolor: item.active ? 'blue.mid' : 'transparent',
            '&:hover': { bgcolor: item.active ? 'blue.mid' : 'gray.lite1' },
          }}
          onClick={() => scrollTo(item.id)}
        >
          <Grid container>
            <Grid
              item
              xs={3}
              component={Typography}
              variant="caption"
              sx={{ color: 'gray.dark1', fontWeight: 500 }}
            >
              {index}
            </Grid>
            <Grid item xs={9}>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 0,
                  bgcolor: 'gray.dark2',
                  color: 'white',
                  p: 1,
                  height: '70px',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {item.label}
              </Paper>
            </Grid>
          </Grid>
        </ListItemButton>
      ))}
      <ListItemButton component="li" onClick={onAdd}>
        <ListItemText primary={t('storyMap.form_chapter_add')} />
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
      </ListItemButton>
    </Grid>
  );
};

const EditableText = props => {
  const { Component, value, onChange, placeholder, inputProps = {} } = props;
  const [isEditing, setIsEditing] = useState(!value);
  const inputRef = useRef(null);

  const onExit = useCallback(() => {
    if (!value) {
      return;
    }
    setIsEditing(false);
  }, [value]);
  const onClick = useCallback(() => setIsEditing(true), []);
  const onChangeWrapper = useCallback(
    event => onChange(event.target.value),
    [onChange]
  );

  useEffect(() => {
    if (isEditing) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <OutlinedInput
        inputRef={inputRef}
        fullWidth
        value={value}
        onBlur={onExit}
        onChange={onChangeWrapper}
        placeholder={placeholder}
        {...inputProps}
        sx={{
          '& .MuiInputBase-input': { bgcolor: 'transparent', color: 'white' },
        }}
      />
    );
  }

  return <Component onClick={onClick}>{value}</Component>;
};

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
  const { setConfig } = useContext(ConfigContext);
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
      <Stack className={`${theme} step-content`} spacing={1}>
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

const TitleForm = props => {
  const { t } = useTranslation();
  const { setConfig } = useContext(ConfigContext);
  const { config } = props;

  const onFieldChange = useCallback(
    field => value => {
      setConfig(config => ({
        ...config,
        [field]: value,
      }));
    },
    [setConfig]
  );

  return (
    <Box id="header" className="step fully title">
      <Box className={`${config.theme} step-content`}>
        <EditableText
          placeholder={t('storyMap.form_title_placeholder')}
          Component="h1"
          value={config.title}
          onChange={onFieldChange('title')}
        />
        <EditableText
          placeholder={t('storyMap.form_subtitle_placeholder')}
          Component="h2"
          value={config.subtitle}
          onChange={onFieldChange('subtitle')}
        />
        <EditableText
          placeholder={t('storyMap.form_byline_placeholder')}
          Component="p"
          value={config.byline}
          onChange={onFieldChange('byline')}
        />
      </Box>
    </Box>
  );
};

const StoryMapForm = () => {
  const [height, setHeight] = useState('100vh');
  const [mapHeight, setMapHeight] = useState();
  const [mapWidth, setMapWidth] = useState();
  const [config, setConfig] = useState(BASE_CONFIG);
  const [currentStepId, setCurrentStepId] = useState();
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const headerHeight =
      document.getElementsByClassName('header-container')[0].clientHeight;
    const footerHeight =
      document.getElementsByClassName('footer')[0].clientHeight;
    const formHeaderHeight =
      document.getElementsByClassName('form-header')[0].clientHeight;

    setHeight(`calc(100vh - (${headerHeight}px + ${footerHeight}px))`);
    setMapHeight(
      `calc(100vh - (${headerHeight}px + ${footerHeight}px + ${formHeaderHeight}px))`
    );
  }, []);

  useEffect(() => {
    if (!mapHeight) {
      return;
    }
    const chaptersWidth =
      document.getElementsByClassName('chapters-sidebar')[0].clientWidth;

    setMapWidth(`calc(100vw - ${chaptersWidth}px)`);
  }, [mapHeight]);

  const onAdd = useCallback(() => {
    setConfig(config => ({
      ...config,
      chapters: [
        ...config.chapters,
        {
          ...BASE_CHAPTER,
          id: `chapter-${config.chapters.length + 1}`,
        },
      ],
    }));
  }, []);

  if (preview) {
    return (
      <ConfigContext.Provider
        value={{ config, setConfig, preview, setPreview }}
      >
        <Grid container>
          <TopBar />
          <Grid item xs={12}>
            <StoryMap config={config} />
          </Grid>
        </Grid>
      </ConfigContext.Provider>
    );
  }

  return (
    <ConfigContext.Provider value={{ config, setConfig, preview, setPreview }}>
      <Grid
        container
        justifyContent="flex-start"
        alignItems="flex-start"
        sx={{ height }}
      >
        <TopBar />
        <ChaptersSidebar
          config={config}
          currentStepId={currentStepId}
          onAdd={onAdd}
          height={mapHeight}
        />
        <Grid item xs={10} sx={{ height: mapHeight, overflow: 'hidden' }}>
          {mapHeight && mapWidth && (
            <StoryMap
              config={config}
              mapCss={{ height: mapHeight, width: mapWidth }}
              animation="jumpTo"
              onStepChange={setCurrentStepId}
              ChapterComponent={ChapterForm}
              TitleComponent={TitleForm}
            />
          )}
        </Grid>
      </Grid>
    </ConfigContext.Provider>
  );
};

export default StoryMapForm;
