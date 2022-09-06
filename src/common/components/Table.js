import React, { useEffect, useState } from 'react';

import _ from 'lodash/fp';

import { DataGrid } from '@mui/x-data-grid';

import theme from 'theme';

const PAGE_SIZE = 15;
const SORT_DIRECTION_BY_WORD = {
  desc: '-',
  asc: '+',
};
const SORT_DIRECTION_BY_SYMBOL = _.invert(SORT_DIRECTION_BY_WORD);

const Table = props => {
  const [sortModel, setSortModel] = useState();
  const [page, setPage] = useState();
  const { searchParams, onSearchParamsChange, ariaLabel } = props;

  const parseSortQuery = value =>
    _.flow(
      _.split(','),
      _.map(column => ({
        field: column.substring(1),
        sort: SORT_DIRECTION_BY_SYMBOL[column.substring(0, 1)],
      }))
    )(value);

  useEffect(() => {
    const sort = searchParams.sort;
    setSortModel(sort ? parseSortQuery(sort) : props.initialSort);
  }, [props.initialSort, searchParams]);

  useEffect(() => {
    const pageValue = searchParams.page;
    setPage(parseInt(pageValue) || 0);
  }, [searchParams]);

  const onPageChange = page => {
    onSearchParamsChange({
      ...searchParams,
      page,
    });
  };

  const onSortModelChange = model => {
    const sort = model
      .map(column => `${SORT_DIRECTION_BY_WORD[column.sort]}${column.field}`)
      .join(',');
    onSearchParamsChange({
      ...searchParams,
      sort,
    });
  };

  return (
    <DataGrid
      components={{
        Panel: () => <div></div>,
      }}
      pageSize={PAGE_SIZE}
      page={page}
      rowsPerPageOptions={[PAGE_SIZE]}
      sortModel={sortModel}
      onSortModelChange={model => {
        setSortModel(model);
        onSortModelChange(model);
      }}
      autoHeight
      disableVirtualization
      disableColumnSelector
      hideFooterSelectedRowCount
      onPageChange={onPageChange}
      aria-labelledby={ariaLabel}
      sx={{
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'gray.lite2',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: 'transparent',
        },
        '& .MuiDataGrid-row a:hover': {
          textDecoration: 'underline',
        },
        '.MuiDataGrid-row:nth-of-type(even)': {
          backgroundColor: theme.palette.gray.lite2,
        },
      }}
      {...props}
    />
  );
};

export default Table;
