import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Grid, List, ListItemButton, Paper, Typography } from '@mui/material';

import ConfirmButton from 'common/components/ConfirmButton';

const ChaptersSidebar = props => {
  const { t } = useTranslation();
  const { config, currentStepId, onAdd, onDelete, height } = props;
  const { chapters } = config;

  const scrollTo = id => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const listItems = useMemo(
    () => [
      {
        label: `${t('storyMap.form_title_chapter_label')}`,
        id: 'story-map-title',
        active: currentStepId === 'story-map-title',
        index: 'T',
      },
      ...chapters.map((chapter, index) => ({
        label: chapter.title || t('storyMap.form_chapter_no_title_label'),
        id: chapter.id,
        active: currentStepId === chapter.id,
        deletable: true,
        index: index + 1,
      })),
    ],
    [chapters, currentStepId, t]
  );

  return (
    <Grid
      id="chapters-sidebar"
      item
      component={List}
      sx={{ height, overflow: 'auto', width: '200px' }}
    >
      {listItems.map(item => (
        <ListItemButton
          component="li"
          key={item.id}
          sx={{
            pl: 0,
            bgcolor: item.active ? 'blue.mid' : 'transparent',
            '&:hover': { bgcolor: item.active ? 'blue.mid' : 'gray.lite1' },
          }}
          onClick={() => scrollTo(item.id)}
        >
          <Grid container>
            <Grid
              item
              container
              xs={4}
              alignItems="flex-end"
              justifyContent="space-between"
              direction="column"
            >
              <Typography
                variant="caption"
                sx={{ color: 'gray.dark1', fontWeight: 700, pr: 1 }}
              >
                {item.index}
              </Typography>
              {item.deletable && (
                <ConfirmButton
                  onConfirm={onDelete(item.id)}
                  variant="text"
                  buttonProps={{
                    'aria-label': t(
                      'storyMap.form_delete_chapter_confirm_button',
                      {
                        name: item.label,
                      }
                    ),
                    sx: {
                      color: 'transparent',
                      width: '100%',
                      padding: 0,
                      minWidth: 'auto',
                      '&:hover': { color: 'gray.dark1' },
                    },
                  }}
                  confirmTitle={t(
                    'storyMap.form_delete_chapter_confirm_title',
                    {
                      name: item.label,
                    }
                  )}
                  confirmMessage={t(
                    'storyMap.form_delete_chapter_confirm_message',
                    {
                      name: item.label,
                    }
                  )}
                  confirmButton={t(
                    'storyMap.form_delete_chapter_confirm_button',
                    {
                      name: item.label,
                    }
                  )}
                  tooltip={t(
                    'storyMap.form_delete_chapter_confirm_button_tooltip',
                    {
                      name: item.label,
                    }
                  )}
                >
                  <DeleteIcon />
                </ConfirmButton>
              )}
            </Grid>
            <Grid item xs={8}>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 0,
                  bgcolor: 'gray.dark2',
                  color: 'white',
                  p: 1,
                  height: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {item.label}
              </Paper>
            </Grid>
          </Grid>
        </ListItemButton>
      ))}
      <ListItemButton
        component="li"
        onClick={onAdd}
        sx={{
          bgcolor: 'gray.lite1',
          m: 2,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography>{t('storyMap.form_chapter_add')}</Typography>
        <AddIcon />
      </ListItemButton>
    </Grid>
  );
};

export default ChaptersSidebar;
