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
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
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

import { withProps } from 'react-hoc';

import ConfirmMenuItem from 'common/components/ConfirmMenuItem';
import StrictModeDroppable from 'common/components/StrictModeDroppable';

import dragIcon from 'assets/drag-icon.svg';

const DRAG_ANIMATION_DELAY = 300;

const DragIcon = withProps(Box, {
  component: 'img',
  alt: '',
  src: dragIcon,
  width: 24,
  height: 24,
});

const SideBarItem = props => {
  const { t } = useTranslation();
  const {
    item,
    onDelete,
    onMoveDown,
    onMoveUp,
    chaptersLength,
    draggableProps,
    isDragging,
  } = props;
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
      onMoveUp(item.id);
      handleMenuClose();
      event.stopPropagation();
    },
    [handleMenuClose, item.id, onMoveUp]
  );

  const handleMoveDown = useCallback(
    event => {
      onMoveDown(item.id);
      handleMenuClose();
      event.stopPropagation();
    },
    [handleMenuClose, item.id, onMoveDown]
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
    <ListItem
      key={item.id}
      ref={draggableProps?.innerRef}
      sx={{
        p: 0,
        boxShadow: isDragging ? '0px 2px 4px 0px rgba(0, 0, 0, 0.25)' : 'none',
      }}
      {...draggableProps?.draggableProps}
    >
      <Button
        component="a"
        {...(item.active ? { 'aria-current': 'step' } : {})}
        sx={{
          width: '100%',
          borderRadius: 0,
          pl: 0,
          bgcolor: item.active || isDragging ? 'blue.mid' : 'transparent',
          '&:hover': { bgcolor: item.active ? 'blue.mid' : 'gray.lite1' },
        }}
        onClick={() => scrollTo(item.id)}
        aria-label={
          isDragging
            ? t('storyMap.form_chapter_dragging_label', {
                chapterLabel: item.label,
              })
            : item.label
        }
        {...draggableProps?.dragHandleProps}
        style={{
          cursor: 'pointer',
        }}
      >
        <Grid container sx={{ flexGrow: 1 }}>
          <Grid
            container
            size={4}
            alignItems="flex-start"
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
                    title={t('common.vertical_menu')}
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
                    slotProps={{
                      list: {
                        'aria-label': t('storyMap.form_chapter_menu_label', {
                          chapterLabel: item.label,
                        }),
                      },
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
            {isDragging && <DragIcon sx={{ ml: 1 }} />}
          </Grid>
          <Grid size={8}>
            <Paper
              variant="outlined"
              sx={theme => ({
                borderRadius: '4px',
                bgcolor: 'gray.dark2',
                color: 'white',
                p: 1,
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
              })}
            >
              {item.label}
            </Paper>
          </Grid>
        </Grid>
      </Button>
    </ListItem>
  );
};

const ChaptersSidebar = props => {
  const { t } = useTranslation();
  const { config, currentStepId, onAdd, onDelete, onMoveChapter, height } =
    props;
  const { chapters } = config;
  const sensorAPIRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const titleItem = useMemo(
    () => ({
      label: `${t('storyMap.form_title_chapter_label')}`,
      id: 'story-map-title',
      active: currentStepId === 'story-map-title',
      index: 'T',
    }),
    [currentStepId, t]
  );

  const chapterItems = useMemo(
    () =>
      chapters.map((chapter, index) => ({
        label: chapter.title || t('storyMap.form_chapter_no_title_label'),
        id: chapter.id,
        active: currentStepId === chapter.id,
        deletable: true,
        sortable: true,
        index: index,
        indexLabel: index + 1,
      })),
    [chapters, currentStepId, t]
  );

  const onDragStart = useCallback(() => setDragging(true), []);

  const onDragEnd = useCallback(
    ({ destination, source }) => {
      setDragging(null);
      const draggingElement = chapterItems[source.index];
      const destinationIndex = destination?.index;

      if (destinationIndex === undefined) {
        return;
      }

      onMoveChapter(draggingElement.id, destinationIndex);
    },
    [chapterItems, onMoveChapter]
  );

  const moveChapter = useCallback(
    (chapterId, action) => {
      const api = sensorAPIRef.current;
      const preDrag = api.tryGetLock(chapterId, () => {});
      const drag = preDrag.snapLift();
      drag[action]();
      setTimeout(() => drag.drop(), DRAG_ANIMATION_DELAY);
    },
    [sensorAPIRef]
  );

  const onMoveChapterDown = useCallback(
    chapterId => moveChapter(chapterId, 'moveDown'),
    [moveChapter]
  );

  const onMoveChapterUp = useCallback(
    chapterId => moveChapter(chapterId, 'moveUp'),
    [moveChapter]
  );

  return (
    <Grid
      id="chapters-sidebar"
      component="nav"
      aria-label={t('storyMap.form_chapters_sidebar_section_label')}
      sx={{
        height,
        overflow: 'auto',
        width: '200px',
        display: 'flex',
        alignItems: 'stretch',
        flexDirection: 'column',
      }}
    >
      <SideBarItem item={titleItem} />
      <DragDropContext
        onDragEnd={onDragEnd}
        onBeforeCapture={onDragStart}
        sensors={[
          api => {
            sensorAPIRef.current = api;
          },
        ]}
      >
        <StrictModeDroppable droppableId="droppable-list">
          {provided => (
            <List ref={provided.innerRef} {...provided.droppableProps}>
              {chapterItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <SideBarItem
                      item={item}
                      onDelete={onDelete}
                      onMoveDown={onMoveChapterDown}
                      onMoveUp={onMoveChapterUp}
                      chaptersLength={chapters.length}
                      isDragging={snapshot.isDragging}
                      draggableProps={provided}
                    />
                  )}
                </Draggable>
              ))}
              {dragging && provided.placeholder}
            </List>
          )}
        </StrictModeDroppable>
      </DragDropContext>
      <Button
        onClick={onAdd}
        sx={{
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
    </Grid>
  );
};

export default ChaptersSidebar;
