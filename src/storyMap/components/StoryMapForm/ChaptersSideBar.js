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
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Button,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import ConfirmMenuItem from 'common/components/ConfirmMenuItem';
import StrictModeDroppable from 'common/components/StrictModeDroppable';

const SideBarItem = props => {
  const { t } = useTranslation();
  const { item, onDelete, onMoveChapter, chaptersLength } = props;
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const openMenu = useMemo(() => Boolean(menuAnchorEl), [menuAnchorEl]);

  const scrollTo = id => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const handleOpenMenuClick = useCallback(event => {
    setMenuAnchorEl(event.currentTarget);
    event.stopPropagation();
  }, []);
  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleMoveUp = useCallback(
    event => {
      onMoveChapter(item.id, item.index - 1);
      handleMenuClose();
      event.stopPropagation();
    },
    [handleMenuClose, item.id, item.index, onMoveChapter]
  );

  const handleMoveDown = useCallback(
    event => {
      onMoveChapter(item.id, item.index + 1);
      handleMenuClose();
      event.stopPropagation();
    },
    [handleMenuClose, item.id, item.index, onMoveChapter]
  );

  const sortActions = useMemo(() => {
    if (chaptersLength === 1) {
      return [];
    }
    if (item.index === 0) {
      return [
        {
          label: t('storyMap.form_chapter_move_down'),
          onClick: handleMoveDown,
        },
      ];
    }
    if (item.index > 0 && item.index < chaptersLength - 1) {
      return [
        {
          label: t('storyMap.form_chapter_move_up'),
          onClick: handleMoveUp,
        },
        {
          label: t('storyMap.form_chapter_move_down'),
          onClick: handleMoveDown,
        },
      ];
    }
    if (item.index === chaptersLength - 1) {
      return [
        {
          label: t('storyMap.form_chapter_move_up'),
          onClick: handleMoveUp,
        },
      ];
    }
  }, [handleMoveDown, handleMoveUp, item.index, chaptersLength, t]);

  return (
    <>
      <Button
        component="a"
        {...(item.active ? { 'aria-current': 'step' } : {})}
        sx={{
          width: '100%',
          borderRadius: 0,
          pl: 0,
          bgcolor: item.active ? 'blue.mid' : 'transparent',
          '&:hover': { bgcolor: item.active ? 'blue.mid' : 'gray.lite1' },
        }}
        onClick={() => scrollTo(item.id)}
        aria-label={item.label}
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
            <Stack
              direction="row"
              justifyContent="space-around"
              sx={{ width: '100%' }}
            >
              {(item.sortable || item.deletable) && (
                <>
                  <IconButton
                    size="small"
                    aria-label={t('storyMap.form_chapter_open_menu')}
                    onClick={handleOpenMenuClick}
                    sx={{
                      pt: '2px',
                      color: 'secondary.main',
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={openMenu}
                    onClose={handleMenuClose}
                    MenuListProps={{
                      'aria-label': t('storyMap.form_chapter_menu_label', {
                        chapterLabel: item.label,
                      }),
                    }}
                  >
                    {sortActions.map(action => (
                      <MenuItem key={action.label} onClick={action.onClick}>
                        {action.label}
                      </MenuItem>
                    ))}
                    {chaptersLength > 1 && <Divider />}
                    {item.deletable && (
                      <ConfirmMenuItem
                        onConfirm={onDelete(item.id)}
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
                        {t('storyMap.form_delete_chapter_confirm_button')}
                      </ConfirmMenuItem>
                    )}
                  </Menu>
                </>
              )}
              <Typography
                variant="caption"
                sx={{ color: 'gray.dark1', fontWeight: 700, pr: 1 }}
              >
                {item.indexLabel}
              </Typography>
            </Stack>
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
      </Button>
    </>
  );
};

const ChaptersSidebar = props => {
  const { t } = useTranslation();
  const { config, currentStepId, onAdd, onDelete, onMoveChapter, height } =
    props;
  const { chapters } = config;
  const sensorAPIRef = useRef(null);

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
        sortable: true,
        index: index,
        indexLabel: index + 1,
      })),
    ],
    [chapters, currentStepId, t]
  );

  return (
    <Grid
      id="chapters-sidebar"
      item
      component="nav"
      aria-label={t('storyMap.form_chapters_sidebar_section_label')}
      sx={{ height, overflow: 'auto', width: '200px' }}
    >
      <DragDropContext
        sensors={[
          api => {
            sensorAPIRef.current = api;
          },
        ]}
      >
        <StrictModeDroppable droppableId="droppable-list">
          {provided => (
            <List ref={provided.innerRef} {...provided.droppableProps}>
              {listItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <ListItem
                      key={item.id}
                      ref={provided.innerRef}
                      sx={{ p: 0 }}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <SideBarItem
                        item={item}
                        onDelete={onDelete}
                        onMoveChapter={onMoveChapter}
                        chaptersLength={chapters.length}
                      />
                    </ListItem>
                  )}
                </Draggable>
              ))}
              <ListItem component="li" sx={{ p: 0 }}>
                <Button
                  onClick={onAdd}
                  sx={{
                    width: '100%',
                    borderRadius: 0,
                    bgcolor: 'gray.lite1',
                    m: 1,
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <Typography>{t('storyMap.form_chapter_add')}</Typography>
                  <AddIcon />
                </Button>
              </ListItem>
            </List>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    </Grid>
  );
};

export default ChaptersSidebar;
