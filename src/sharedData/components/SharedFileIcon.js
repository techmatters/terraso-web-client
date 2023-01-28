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
