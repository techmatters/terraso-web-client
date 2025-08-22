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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import { IconButton, List, ListItem, Stack } from '@mui/material';
import { DataGrid, GridColumnMenu, GridPagination } from '@mui/x-data-grid';

import theme from 'theme';

const PAGE_SIZE = 15;
const SORT_DIRECTION_BY_WORD = {
  desc: '-',
  asc: '+',
};
const SORT_DIRECTION_BY_SYMBOL = _.invert(SORT_DIRECTION_BY_WORD);

const parseSortQuery = value =>
  _.flow(
    _.split(','),
    _.map(column => ({
      field: column.substring(1),
      sort: SORT_DIRECTION_BY_SYMBOL[column.substring(0, 1)],
    }))
  )(value);

const disableBack = page => page === 0;

const disableNext = (page, count, rowsPerPage) =>
  page >= Math.ceil(count / rowsPerPage) - 1;

const TablePaginationActions = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  const { count, onPageChange, page, rowsPerPage } = props;
  const backRef = useRef();
  const nextRef = useRef();

  const handleBackButtonClick = event => {
    const nextPage = page - 1;
    if (disableBack(nextPage)) {
      nextRef.current.focus();
    }
    onPageChange(event, nextPage);
  };

  const handleNextButtonClick = event => {
    const nextPage = page + 1;
    if (disableNext(nextPage, count, rowsPerPage)) {
      backRef.current.focus();
    }
    onPageChange(event, nextPage);
  };

  return (
    <Stack
      ref={ref}
      component={List}
      direction="row"
      sx={{ ml: 2, p: 0 }}
      role="list"
      aria-label={t('common.table_pagination_label')}
    >
      <ListItem sx={{ p: 0 }}>
        <IconButton
          ref={backRef}
          aria-label={t('common.table_pagination_previous_page')}
          onClick={handleBackButtonClick}
          disabled={disableBack(page)}
          color="inherit"
        >
          <KeyboardArrowLeft />
        </IconButton>
      </ListItem>
      <ListItem sx={{ p: 0 }}>
        <IconButton
          ref={nextRef}
          aria-label={t('common.table_pagination_next_page')}
          onClick={handleNextButtonClick}
          disabled={disableNext(page, count, rowsPerPage)}
          color="inherit"
        >
          <KeyboardArrowRight />
        </IconButton>
      </ListItem>
    </Stack>
  );
});

const CustomPagination = props => {
  const { t } = useTranslation();
  return (
    <GridPagination
      labelDisplayedRows={({ from, to, count }) =>
        t('common.table_pagination_displayed', { from, to, count })
      }
      ActionsComponent={TablePaginationActions}
      {...props}
    />
  );
};

const CustomColumnMenu = props => (
  <GridColumnMenu
    {...props}
    slots={{
      columnMenuFilterItem: null,
    }}
  />
);

const CustomIconButton = React.forwardRef((props, ref) => {
  return <IconButton ref={ref} {..._.omit('title', props)} />;
});

const Table = props => {
  const { t } = useTranslation();
  const [sortModel, setSortModel] = useState();
  const [page, setPage] = useState();
  const {
    searchParams,
    onSearchParamsChange,
    ariaLabel,
    columns,
    ...gridProps
  } = props;

  useEffect(() => {
    const sort = searchParams?.sort;
    setSortModel(sort ? parseSortQuery(sort) : props.initialSort);
  }, [props.initialSort, searchParams]);

  useEffect(() => {
    const pageValue = searchParams?.page;
    setPage(parseInt(pageValue) || 0);
  }, [searchParams]);

  const onPageChange = useCallback(
    model => {
      onSearchParamsChange?.({
        ...searchParams,
        page: model.page,
      });
    },
    [onSearchParamsChange, searchParams]
  );

  const onSortModelChange = useCallback(
    model => {
      setSortModel(model);
      const sort = model
        .map(column => `${SORT_DIRECTION_BY_WORD[column.sort]}${column.field}`)
        .join(',');
      onSearchParamsChange?.({
        ...searchParams,
        sort,
      });
    },
    [onSearchParamsChange, searchParams]
  );

  const columnsWithDefaults = useMemo(
    () =>
      columns.map(column => ({
        ...column,
        disableColumnMenu: column.sortable === false,
      })),
    [columns]
  );

  return (
    <DataGrid
      slots={{
        panel: () => <div></div>,
        pagination: CustomPagination,
        columnUnsortedIcon: () => <ImportExportIcon />,
        columnMenu: CustomColumnMenu,
        baseIconButton: CustomIconButton,
      }}
      columns={columnsWithDefaults}
      paginationModel={{
        pageSize: PAGE_SIZE,
        page: page || 0,
      }}
      pageSizeOptions={[PAGE_SIZE]}
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      autoHeight
      disableVirtualization
      disableColumnSelector
      hideFooterSelectedRowCount
      onPaginationModelChange={onPageChange}
      getRowHeight={() => 'auto'}
      slotProps={{
        main: {
          'aria-labelledby': ariaLabel,
        },
      }}
      localeText={{
        columnMenuSortAsc: t('common.table_sort_asc'),
        columnMenuSortDesc: t('common.table_sort_desc'),
        columnMenuUnsort: t('common.table_sort_unsort'),
      }}
      // Show the sort button in the column at all times, not just on hover.
      // Improve accessibility.
      // Based on https://github.com/mui/mui-x/issues/1076#issuecomment-926943642
      sx={{
        backgroundColor: 'white',
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
        '& .MuiDataGrid-cell': {
          pt: 1,
          pb: 1,
        },
        '.MuiDataGrid-columnHeaderTitle': {
          fontWeight: 'bold',
        },
      }}
      {...gridProps}
    />
  );
};

export default Table;
