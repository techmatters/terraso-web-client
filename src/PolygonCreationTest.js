import React, { useCallback, useMemo, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import {
  Dialog as BaseDialog,
  Button,
  DialogContent,
  IconButton,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';

import LandscapeMap from 'landscape/components/LandscapeMap';

const Dialog = styled(BaseDialog)`
  .MuiBackdrop-root {
    background-color: transparent;
  }
  .MuiPaper-root {
    background-color: #055989;
  }
  .MuiDialogContent-root {
    color: #ffffff;
  }
`;

const PolygonCreationTest = () => {
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState();
  const onPolygonCreated = useCallback(() => {
    setDialogContent(
      "Landscape boundary is complete. Proceed to update your landscape's map or edit the shape."
    );
    setOpen(true);
  }, [setDialogContent, setOpen]);
  const onEditStart = useCallback(() => {
    setDialogContent(
      'Drag a translucent point to add more points. Click the point to remove it. When you’re done adjusting the boundary save to exit the edit mode.'
    );
    setOpen(true);
  }, [setDialogContent, setOpen]);

  const drawOptions = useMemo(
    () => ({ showPolygon: true, onPolygonCreated, onEditStart }),
    [onPolygonCreated, onEditStart]
  );
  return (
    <PageContainer>
      <PageHeader header={'Draw Landscape Boundary'} />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <IconButton
          aria-label="close"
          onClick={() => setOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ pr: 7 }}>{dialogContent}</DialogContent>
      </Dialog>
      <LandscapeMap
        enableDraw
        enableSearch
        drawOptions={drawOptions}
        onPinLocationChange={() => {}}
      />
      <Stack direction="row" sx={{ mt: 2 }} spacing={2}>
        <Button variant="contained">Update Map</Button>
        <Button>Cancel</Button>
      </Stack>
    </PageContainer>
  );
};

export default PolygonCreationTest;
