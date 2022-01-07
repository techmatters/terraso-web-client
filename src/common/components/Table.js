import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { DataGrid } from '@mui/x-data-grid'
import { useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 15
const DIRECTION = {
  desc: '-',
  asc: '+'
}
const DIRECTION_REVERSE = {
  '-': 'desc',
  '+': 'asc'
}

const Table = props => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortModel, setSortModel] = useState()
  const [page, setPage] = useState()

  const setUrlParam = (field, value) => setSearchParams({
    ...Object.fromEntries(searchParams.entries()),
    [field]: value
  })

  const parseSortQuery = value =>
    _.chain(value)
      .split(',')
      .map(column => ({
        field: column.substring(1),
        sort: DIRECTION_REVERSE[column.substring(0, 1)]
      }))
      .value()

  useEffect(() => {
    const sortQuery = searchParams.get('sort')
    setSortModel(sortQuery
      ? parseSortQuery(sortQuery)
      : props.initialSort
    )
  }, [props.initialSort, searchParams])

  useEffect(() => {
    const pageValue = searchParams.get('page')
    setPage(parseInt(pageValue) || 0)
  }, [searchParams])

  const onPageChange = page => {
    setUrlParam('page', page)
  }

  const onSortModelChange = model => {
    const sortValue = model
      .map(column => `${DIRECTION[column.sort]}${column.field}`)
      .join(',')
    setUrlParam('sort', sortValue)
  }

  return (
    <DataGrid
      pageSize={PAGE_SIZE}
      page={page}
      rowsPerPageOptions={[PAGE_SIZE]}
      sortModel={sortModel}
      onSortModelChange={model => {
        setSortModel(model)
        onSortModelChange(model)
      }}
      autoHeight
      disableVirtualization
      onPageChange={onPageChange}
      sx={{
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'gray.lite2'
        }
      }}
      {...props}
    />

  )
}

export default Table
