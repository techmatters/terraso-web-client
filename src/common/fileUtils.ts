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
import path from 'path-browserify';
import { v4 as uuidv4 } from 'uuid';

export const dataURItoBlob = (dataURI: string): Promise<Blob> =>
  fetch(dataURI).then(res => res.blob());

export const readAsDataURL = (data: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(data);
  });

export const openFile = (file: File): Promise<string> => readAsDataURL(file);

export type FileWrapper = {
  id: string;
  name: string;
  resourceType: string;
  file: File;
};

export const fileWrapper = (file: File): FileWrapper => {
  const filePath = path.parse(file.name);
  return {
    id: uuidv4(),
    name: filePath.name,
    resourceType: filePath.ext,
    file,
  };
};
