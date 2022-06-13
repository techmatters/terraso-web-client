import React, { useEffect, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import Highlighter from 'react-highlight-words';
import { useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {
  Card,
  Divider,
  Grid,
  IconButton,
  InputLabel,
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
const SEARCH_MINIMUM_LENGTH = 2;

const Table = props => {
  const { tableProps } = props;

  return (
    <BaseTable
      {..._.pick(
        ['rows', 'columns', 'searchParams', 'onSearchParamsChange'],
        props
      )}
      {...tableProps}
    />
  );
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

  if (column.getActions) {
    return (
      <>
        {column.getActions({ row }).map((action, index) => (
          <React.Fragment key={index}>{action}</React.Fragment>
        ))}
      </>
    );
  }

  const formattedValue = _.has('valueFormatter', column)
    ? column.valueFormatter({ value })
    : value;

  if (column.renderCell) {
    return column.renderCell({ row, formattedValue });
  }

  if (!formattedValue) {
    return null;
  }

  return <Typography>{formattedValue}</Typography>;
};

const Cards = props => {
  const { columns, rows, cardsProps = {} } = props;

  return (
    <List>
      {rows.map(row => (
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

const cleanSearchValue = value =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const indexOfMatchPartial = query => {
  const cleanedQuery = cleanSearchValue(query);
  return fieldValue => cleanSearchValue(fieldValue).indexOf(cleanedQuery);
};

const getHighlightLimits = ({ textToHighlight, searchWords }) => {
  if (_.isEmpty(searchWords)) {
    return [];
  }
  const query = searchWords[0];
  const index = indexOfMatchPartial(query)(textToHighlight);
  if (index === -1) {
    return [];
  }

  return [
    {
      start: index,
      end: index + query.length,
    },
  ];
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
    searchParams,
    onSearchParamsChange,
  } = props;

  const validSearch = useMemo(
    () => query.length > SEARCH_MINIMUM_LENGTH - 1,
    [query]
  );
  const searchQuery = useMemo(
    () => (validSearch ? query : ''),
    [query, validSearch]
  );

  const updateFilteredRows = useMemo(
    () =>
      _.debounce(SEARCH_DEBOUNCE, (rows, query) => {
        if (!query) {
          setFilterdRows(rows);
          return;
        }
        const indexOfMatch = indexOfMatchPartial(query);
        setFilterdRows(
          rows.filter(row => indexOfMatch(_.get(searchFilterField, row)) !== -1)
        );
      }),
    [setFilterdRows, searchFilterField]
  );

  useEffect(() => {
    updateFilteredRows(rows, searchQuery);
    if (searchQuery !== searchParams.search) {
      if (searchQuery) {
        onSearchParamsChange({
          ...searchParams,
          search: searchQuery,
        });
      } else if (searchParams.search) {
        onSearchParamsChange(_.omit('search', searchParams));
      }
    }
  }, [
    rows,
    searchQuery,
    updateFilteredRows,
    validSearch,
    searchParams,
    onSearchParamsChange,
  ]);

  useEffect(() => {
    if (searchParams?.search) {
      setQuery(searchParams.search);
    }
  }, [searchParams]);

  if (!searchEnabled) {
    return null;
  }

  const handleChange = event => {
    const newQuery = event.target.value;
    setQuery(newQuery);
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
        {searchQuery &&
          t('common.table_search_filter_results', {
            rows: filteredRows,
            count: filteredRows.length,
            query: searchQuery,
          })}
      </Typography>
      <InputLabel htmlFor="table-search" className="visually-hidden">
        {searchPlaceholder}
      </InputLabel>
      <TextField
        variant="outlined"
        id="table-search"
        size="small"
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
              <IconButton aria-label={searchPlaceholder}>
                <SearchIcon />
              </IconButton>
            </>
          ),
        }}
      />
    </Stack>
  );
};

const setSearchHighligthRender = props => {
  const { columns, searchFilterField, searchParams } = props;
  const validSearch =
    searchParams.search &&
    searchParams.search.length > SEARCH_MINIMUM_LENGTH - 1;
  if (!validSearch) {
    return columns;
  }
  return columns.map(column => {
    if (column.field !== searchFilterField) {
      return column;
    }
    return {
      ...column,
      valueFormatter: params => {
        const formattedValue = _.has('valueFormatter', column)
          ? column.valueFormatter(params)
          : params.value;
        return (
          <Highlighter
            searchWords={[searchParams.search]}
            autoEscape={true}
            textToHighlight={formattedValue}
            findChunks={getHighlightLimits}
          />
        );
      },
    };
  });
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

  const filteredProps = useMemo(
    () => ({
      ..._.omit(['rows', 'columns'], props),
      rows: filteredRows,
      columns: props.searchEnabled
        ? setSearchHighligthRender(props)
        : props.columns,
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
          desktop={<Table {...filteredProps} />}
          mobile={<Cards {...filteredProps} />}
        />
      )}
    </>
  );
};

export default TableResponsive;
