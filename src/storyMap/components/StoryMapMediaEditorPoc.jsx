import { useCallback, useState } from 'react';
import { Box, Stack } from '@mui/material';

import ChapterForm from 'terraso-web-client/storyMap/components/StoryMapForm/ChapterForm';
import { StoryMapConfigContextProvider } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { getStoryMapThemeCssVariables } from 'terraso-web-client/storyMap/storyMapThemeUtils';

const POC_THEME_STYLES = getStoryMapThemeCssVariables({ themeId: 'theme-7' });

export const INITIAL_CHAPTER = {
  alignment: 'left',
  description: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'This chapter uses the same media editor controls as Story Maps, extended to manage an ordered carousel.',
        },
      ],
    },
  ],
  id: 'media-editor-poc',
  mediaPresentation: 'carousel',
  mediaItems: [
    {
      id: 'image-1',
      type: 'image/jpeg',
      signedUrl: '/storyMap/terraso-story-maps-img.jpg',
      crop: { position: { x: 0.5, y: 0.5 }, scale: 1 },
    },
    {
      id: 'image-2',
      type: 'image/png',
      signedUrl: '/storyMap/set-map-step-1.png',
      crop: { position: { x: 0.5, y: 0.5 }, scale: 1 },
    },
    {
      id: 'image-portrait',
      type: 'image/jpeg',
      signedUrl:
        'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&h=1200&q=85',
      crop: { position: { x: 0.5, y: 0.5 }, scale: 1 },
    },
    {
      id: 'audio-1',
      type: 'audio/mpeg',
      signedUrl: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
    },
    {
      id: 'video-1',
      type: 'video/mp4',
      signedUrl: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    },
    {
      id: 'embedded-1',
      type: 'embedded',
      source: 'youtube',
      url: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
    },
  ],
  onChapterEnter: [],
  themeId: 'theme-7',
  title: 'Multiple media chapter',
};

const StoryMapMediaEditorPocContent = ({ initialChapter }) => {
  const [chapter, setChapter] = useState(initialChapter);
  const onFieldChange = useCallback(
    field => value =>
      setChapter(currentChapter => ({ ...currentChapter, [field]: value })),
    []
  );

  return (
    <Box
      sx={{
        ...POC_THEME_STYLES,
        bgcolor: '#1A3A2A',
        minHeight: '100vh',
        p: { xs: 2, md: 4 },
      }}
    >
      <Stack spacing={2} sx={{ margin: 'auto', maxWidth: 900 }}>
        <ChapterForm
          mediaField="mediaItems"
          multipleMedia
          onFieldBlur={() => {}}
          onFieldChange={onFieldChange}
          record={chapter}
        />
      </Stack>
    </Box>
  );
};

const StoryMapMediaEditorPoc = ({ initialChapter = INITIAL_CHAPTER }) => (
  <StoryMapConfigContextProvider
    baseConfig={{
      chapters: [initialChapter],
      dataLayers: {},
      themeId: 'theme-7',
    }}
  >
    <StoryMapMediaEditorPocContent initialChapter={initialChapter} />
  </StoryMapConfigContextProvider>
);

export default StoryMapMediaEditorPoc;
