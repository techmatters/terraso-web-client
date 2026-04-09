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

import { useTranslation } from 'react-i18next';
import { Grid } from '@mui/material';

const TopBarContainer = ({ children }) => {
  const { t } = useTranslation();
  return (
    <Grid
      id="form-header"
      container
      component="section"
      aria-label={t('storyMap.form_header_section_label')}
      sx={theme => ({
        borderBottom: `1px solid ${theme.palette.gray.lite1}`,
        display: 'flex',
        alignItems: 'center',
        pt: 3,
        pb: 1,
        zIndex: 2,
        bgcolor: 'white',
        minHeight: 70,
        position: 'relative',
        width: '100%',
      })}
    >
      {children}
    </Grid>
  );
};

export default TopBarContainer;
