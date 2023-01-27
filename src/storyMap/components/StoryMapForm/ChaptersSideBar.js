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
        id: 'header',
        active: currentStepId === 'header',
      },
      ...chapters.map((chapter, index) => ({
        label: chapter.title || t('storyMap.form_chapter_no_title_label'),
        id: chapter.id,
        active: currentStepId === chapter.id,
        deletable: true,
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
              container
              xs={4}
              alignItems="flex-end"
              justifyContent="space-between"
              direction="column"
            >
              <Typography
                variant="caption"
                sx={{ color: 'gray.dark1', fontWeight: 700, pr: 2 }}
              >
                {index}
              </Typography>
              {item.deletable && (
                <ConfirmButton
                  onConfirm={onDelete(item.id)}
                  variant="text"
                  buttonProps={{
                    'aria-label': t(
                      'storyMap.form_delete_chapter_confirm_button',
                      {
                        name: item.name,
                      }
                    ),
                    sx: {
                      color: 'transparent',
                      width: '100%',
                      '&:hover': { color: 'gray.dark1' },
                    },
                  }}
                  confirmTitle={t(
                    'storyMap.form_delete_chapter_confirm_title',
                    {
                      name: item.name,
                    }
                  )}
                  confirmMessage={t(
                    'storyMap.form_delete_chapter_confirm_message',
                    {
                      name: item.name,
                    }
                  )}
                  confirmButton={t(
                    'storyMap.form_delete_chapter_confirm_button',
                    {
                      name: item.name,
                    }
                  )}
                  tooltip={t(
                    'storyMap.form_delete_chapter_confirm_button_tooltip',
                    {
                      name: item.name,
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
