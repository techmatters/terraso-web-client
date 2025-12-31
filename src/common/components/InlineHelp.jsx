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
