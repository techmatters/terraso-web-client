import React, { useEffect, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {
  Card,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import BaseTable from 'common/components/Table';
import ResponsiveSwitch from 'layout/ResponsiveSwitch';

const SEARCH_DEBOUNCE = 100; // milliseconds

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

const SearchBar = props => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const {
    rows,
    searchEnabled,
    searchPlaceholder,
    searchFilterField,
    filteredRows,
    setFilterdRows,
  } = props;

  const updateFilteredRows = _.debounce(SEARCH_DEBOUNCE, () => {
    if (!query) {
      setFilterdRows(rows);
      return;
    }
    setFilterdRows(
      rows.filter(
        row =>
          _.get(searchFilterField, row)
            .toLowerCase()
            .indexOf(query.toLowerCase()) !== -1
      )
    );
  });

  useEffect(
    () => updateFilteredRows(),
    [rows, query, searchFilterField, updateFilteredRows]
  );

  if (!searchEnabled) {
    return null;
  }

  const handleChange = event => {
    setQuery(event.target.value);
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={{ xs: 1 }}
      justifyContent="space-between"
      alignItems="center"
      sx={{ width: '100%' }}
    >
      <Typography sx={{ flexGrow: 3, width: { xs: '100%' } }}>
        {query &&
          t('common.table_search_filter_results', {
            rows: filteredRows,
            query,
          })}
      </Typography>
      <TextField
        size="small"
        variant="outlined"
        placeholder={searchPlaceholder}
        onChange={handleChange}
        value={query}
        sx={{ flexGrow: 2, width: { xs: '100%' } }}
        InputProps={{
          sx: {
            marginBottom: 2,
            padding: 0,
          },
          endAdornment: (
            <>
              {query && (
                <IconButton
                  onClick={() => setQuery('')}
                  sx={{ p: '10px' }}
                  aria-label={t('common.table_search_filter_clear')}
                >
                  <CloseIcon />
                </IconButton>
              )}
              <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
              <IconButton
                sx={{ p: '10px' }}
                aria-label={t('common.table_search_filter_search')}
              >
                <SearchIcon />
              </IconButton>
            </>
          ),
        }}
      />
    </Stack>
  );
};

const EmptyList = props => {
  return (
    <Paper variant="outlined" sx={{ padding: 3 }}>
      {props.emptyMessage}
    </Paper>
  );
};

const TableResponsive = props => {
  const [filteredRows, setFilterdRows] = useState(props.rows);

  const tableProps = useMemo(
    () => ({
      ..._.omit('rows', props),
      rows: filteredRows,
    }),
    [filteredRows, props]
  );

  return (
    <>
      <SearchBar
        {...props}
        filteredRows={filteredRows}
        setFilterdRows={setFilterdRows}
      />
      {_.isEmpty(filteredRows) ? (
        <EmptyList {...props} />
      ) : (
        <ResponsiveSwitch
          desktop={<Table {...tableProps} />}
          mobile={<Cards {...tableProps} />}
        />
      )}
    </>
  );
};

export default TableResponsive;
