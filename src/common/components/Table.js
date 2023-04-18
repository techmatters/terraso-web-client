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
import React, { useEffect, useState } from 'react';

import _ from 'lodash/fp';

import ImportExportIcon from '@mui/icons-material/ImportExport';
import { DataGrid, GridColumnMenu } from '@mui/x-data-grid';

import theme from 'theme';

const PAGE_SIZE = 15;
const SORT_DIRECTION_BY_WORD = {
  desc: '-',
  asc: '+',
};
const SORT_DIRECTION_BY_SYMBOL = _.invert(SORT_DIRECTION_BY_WORD);

const CustomColumnMenu = props => (
  <GridColumnMenu
    {...props}
    slots={{
      columnMenuFilterItem: null,
    }}
  />
);
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

  const onPageChange = model => {
    onSearchParamsChange({
      ...searchParams,
      page: model.page,
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
      slots={{
        panel: () => <div></div>,
        columnUnsortedIcon: () => <ImportExportIcon />,
        columnMenu: CustomColumnMenu,
      }}
      paginationModel={{
        pageSize: PAGE_SIZE,
        page: page || 0,
      }}
      pageSizeOptions={[PAGE_SIZE]}
      sortModel={sortModel}
      onSortModelChange={model => {
        setSortModel(model);
        onSortModelChange(model);
      }}
      autoHeight
      disableVirtualization
      disableColumnSelector
      hideFooterSelectedRowCount
      onPaginationModelChange={onPageChange}
      aria-labelledby={ariaLabel}
      // Show the sort button in the column at all times, not just on hover.
      // Improve accessibility.
      // Based on https://github.com/mui/mui-x/issues/1076#issuecomment-926943642
      sx={{
        '& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer': {
          width: 'auto',
          visibility: 'visible',
        },
        '& .MuiDataGrid-columnHeader:not(.MuiDataGrid-columnHeader--sorted) .MuiDataGrid-sortIcon':
          {
            opacity: 1,
          },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'gray.lite2',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: 'transparent',
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
