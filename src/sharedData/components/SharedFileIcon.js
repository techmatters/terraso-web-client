import React from 'react';

import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';

const ICON_SIZE = 24;

const SharedFileIcon = ({ resourceType }) => {
  switch (resourceType) {
    case 'csv':
    case 'doc':
    case 'docx':
    case 'pdf':
    case 'ppt':
    case 'pptx':
    case 'xls':
    case 'xlsx':
      return (
        <img
          style={{ filter: 'opacity(50%)' }}
          width="24"
          height="24"
          src={`/files/${resourceType.substring(0, 3)}.png`}
          alt={resourceType.toUpperCase()}
        />
      );
    default:
      return (
        <InsertDriveFileOutlinedIcon
          sx={theme => ({
            fontSize: ICON_SIZE,
            color: theme.palette.gray.dark1,
          })}
        />
      );
  }
};

export default SharedFileIcon;
