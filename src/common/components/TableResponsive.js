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
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import Highlighter from 'react-highlight-words';
import { useTranslation } from 'react-i18next';
import { cleanSensitiveCharacters } from 'stringUtils';
import { useDebounce } from 'use-debounce';

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
        [
          'rows',
          'columns',
          'searchParams',
          'onSearchParamsChange',
          'ariaLabel',
        ],
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

const indexOfMatchPartial = query => {
  const cleanedQuery = cleanSensitiveCharacters(query);
  return fieldValue =>
    cleanSensitiveCharacters(fieldValue).indexOf(cleanedQuery);
};

const getHighlightLimits = ({ textToHighlight, searchWords }) => {
  if (_.isEmpty(searchWords)) {
    return [];
  }
  const query = searchWords[0];
  if (!query) {
    return [];
  }
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
  const [debouncedQuery] = useDebounce(query, SEARCH_DEBOUNCE);
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
    () => debouncedQuery.length > SEARCH_MINIMUM_LENGTH - 1,
    [debouncedQuery]
  );
  const searchQuery = useMemo(
    () => (validSearch ? debouncedQuery : ''),
    [debouncedQuery, validSearch]
  );

  const updateFilteredRows = useCallback(
    (rows, query) => {
      if (!query) {
        setFilterdRows(rows);
        return;
      }
      const indexOfMatch = indexOfMatchPartial(query);
      setFilterdRows(
        rows.filter(row => indexOfMatch(_.get(searchFilterField, row)) !== -1)
      );
    },
    [searchFilterField, setFilterdRows]
  );

  const onClickClear = useCallback(() => {
    onSearchParamsChange(_.omit('search', searchParams));
    setQuery('');
  }, [onSearchParamsChange, searchParams]);

  useEffect(() => {
    updateFilteredRows(rows, searchQuery);
  }, [rows, searchQuery, updateFilteredRows]);

  useEffect(() => {
    if (
      searchQuery &&
      query === searchQuery &&
      searchQuery !== searchParams.search
    ) {
      onSearchParamsChange({
        ...searchParams,
        search: searchQuery,
      });
    }
  }, [query, searchQuery, searchParams, onSearchParamsChange]);

  useEffect(() => {
    if (!validSearch && searchParams?.search) {
      onSearchParamsChange(_.omit('search', searchParams));
    }
  }, [validSearch, searchParams, onSearchParamsChange]);

  useEffect(() => {
    if (!query && searchParams?.search) {
      setQuery(searchParams.search);
    }
  }, [searchParams?.search, query]);

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
          sx: theme => ({
            borderColor: theme.palette.gray.dark2,
            marginBottom: 2,
            padding: 0,
            '& ::placeholder': {
              opacity: 0.65,
            },
          }),
          endAdornment: (
            <>
              {query && (
                <IconButton
                  onClick={onClickClear}
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
            textToHighlight={formattedValue || ''}
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
