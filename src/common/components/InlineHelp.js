import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const InlineHelp = props => {
  const { items } = props;
  return (
    <>
      {items.map((item, index) => (
        <Accordion disableGutters elevation={0}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`help-item-${index}-details`}
            id={`help-item-${index}-title`}
            sx={{ padding: 0 }}
          >
            {item.title}
          </AccordionSummary>
          <Typography
            variant="body2"
            component={AccordionDetails}
            sx={{ padding: 0 }}
          >
            {item.details}
          </Typography>
        </Accordion>
      ))}
    </>
  );
};

export default InlineHelp;
