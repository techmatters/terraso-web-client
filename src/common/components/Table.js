import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'

const PAGE_SIZE = 10

const Table = props => {
  const [sortModel, setSortModel] = useState(props.initialSort)
  return (
    <DataGrid
      pageSize={PAGE_SIZE}
      rowsPerPageOptions={[PAGE_SIZE]}
      sortModel={sortModel}
      onSortModelChange={model => setSortModel(model)}
      autoHeight
      disableVirtualization
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
