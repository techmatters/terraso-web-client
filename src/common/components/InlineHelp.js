import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Item = props => {
  const { id, item } = props;

  return (
    <Accordion disableGutters elevation={0}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${id}-details`}
        id={`${id}-title`}
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
