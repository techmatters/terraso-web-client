/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';

export const SIDEBAR_WIDTH = 300;

/**
 * Shared chrome for the editor's right sidebars (Configure Chapter and
 * Settings): a 300px persistent drawer with a title and an X close button.
 * The editor renders exactly one sidebar at a time (mutually exclusive), so
 * the drawer is open whenever it is mounted.
 */
const FormSidebar = ({
  open = true,
  onClose,
  title,
  sectionLabel,
  closeLabel,
  zIndex = 3,
  contentRef,
  children,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      ModalProps={{ keepMounted: true }}
      transitionDuration={{ enter: 150, exit: 150 }}
      // Both right sidebars STAY MOUNTED (toggling `open`): an in-flight
      // create-layer flow inside the Configure Chapter sidebar survives a
      // switch to Settings and back. A closed sidebar is hidden from the
      // accessibility tree (its content is off-screen, width 0).
      sx={theme => ({
        zIndex,
        width: open ? SIDEBAR_WIDTH : 0,
        flexShrink: 0,
        overflowX: 'hidden',
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          // reset position to static:
          //   MUI applies 'fixed', which isn't desired here because
          //   the sidebar will end up behind the top bar
          position: 'static',
          borderLeft: `1px solid ${theme.palette.gray.lite1}`,
          boxSizing: 'border-box',
          visibility: open ? 'visible' : 'hidden',
        },
      })}
    >
      <Box
        role="complementary"
        aria-label={sectionLabel}
        ref={contentRef}
        sx={{
          px: 3,
          pt: 0,
          pb: 1,
          height: '100%',
          overflowY: 'auto',
          bgcolor: 'white',
          // Closed sidebars stay mounted but are invisible — and thus out
          // of the accessibility tree (visibility is inherited).
          visibility: open ? 'visible' : 'hidden',
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 0,
            mb: 1,
          }}
        >
          {/* The theme's heading variants carry a top padding; the sidebar
              title sits flush at the top of the drawer instead. */}
          <Typography
            component="h2"
            variant="h3"
            sx={{ pt: 0, fontSize: '1.25rem' }}
          >
            {title}
          </Typography>
          <IconButton aria-label={closeLabel} onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
        {children}
      </Box>
    </Drawer>
  );
};

export default FormSidebar;
