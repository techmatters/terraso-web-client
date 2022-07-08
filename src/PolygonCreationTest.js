import React, { useState } from 'react';

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
  const onPolygonCreated = () => {
    setOpen(true);
  };
  return (
    <PageContainer>
      <PageHeader header={'Polygon Creation'} />
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
        <DialogContent sx={{ pr: 7 }}>
          Landscape boundary is complete. Proceed to update your landscape's map
          or edit the shape.
        </DialogContent>
      </Dialog>
      <LandscapeMap
        enableDraw
        enableSearch
        drawOptions={{ showPolygon: true, onPolygonCreated: onPolygonCreated }}
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
