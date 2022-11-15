import React from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';

const Item = props => {
  const { id, item } = props;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{ '&:before': { display: 'none' } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${id}-details`}
        id={`${id}-title`}
        sx={{ padding: 0 }}
      >
        <Typography variant="body2">{item.title}</Typography>
      </AccordionSummary>
      <Typography
        variant="body2"
        component={AccordionDetails}
        sx={{ padding: 0, paddingBottom: 2 }}
      >
        {item.details}
      </Typography>
    </Accordion>
  );
};

const InlineHelp = props => {
  const { items } = props;
  return (
    <>
      {items.map((item, index) => (
        <Item key={index} item={item} id={`help-item-${index}`} />
      ))}
    </>
  );
};

export default InlineHelp;
