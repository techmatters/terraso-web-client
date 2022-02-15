import React from 'react';
import _ from 'lodash/fp';
import { Card, Grid, List, ListItem, Stack, Typography } from '@mui/material';

import ResponsiveSwitch from 'layout/ResponsiveSwitch';
import BaseTable from 'common/components/Table';

const Table = props => {
  const { columns, rows, tableProps } = props;

  return <BaseTable rows={rows} columns={columns} {...tableProps} />;
};

const CardField = props => {
  const { column, row } = props;
  const isActions = column.field === 'actions';

  const value = column.valueGetter
    ? column.valueGetter({ row })
    : _.get(column.field, row);

  const showValue = isActions || _.isInteger(value) || !_.isEmpty(value);

  if (!showValue && !isActions) {
    return null;
  }

  return (
    <Grid direction="column" container item xs={column.cardSize || 12}>
      {!isActions && (
        <Typography variant="caption">{column.headerName}</Typography>
      )}
      <CardValue column={column} row={row} value={value} />
    </Grid>
  );
};

const CardValue = props => {
  const { column, row, value } = props;

  if (column.cardRender) {
    return column.cardRender({ row });
  }

  if (column.renderCell) {
    return column.renderCell({ row });
  }

  if (column.getActions) {
    return (
      <>
        {column.getActions({ row }).map((action, index) => (
          <React.Fragment key={index}>{action}</React.Fragment>
        ))}
      </>
    );
  }

  if (!value) {
    return null;
  }

  return <Typography>{value}</Typography>;
};

const Cards = props => {
  const { columns, rows, cardsProps = {} } = props;

  return (
    <List>
      {rows.map((row, index) => (
        <ListItem
          key={row.id}
          sx={theme => ({ padding: 0, marginBottom: theme.spacing(2) })}
        >
          <Card
            component={Stack}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={theme => ({ width: '100%', padding: theme.spacing(2) })}
          >
            {cardsProps.avatarRender && cardsProps.avatarRender({ row })}
            <Grid container spacing={2}>
              {columns.map(column => (
                <CardField key={column.field} column={column} row={row} />
              ))}
            </Grid>
          </Card>
        </ListItem>
      ))}
    </List>
  );
};

const TableResponsive = props => {
  return (
    <ResponsiveSwitch
      desktop={<Table {...props} />}
      mobile={<Cards {...props} />}
    />
  );
};

export default TableResponsive;
