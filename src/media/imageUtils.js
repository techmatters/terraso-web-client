import { readAsDataURL } from './fileUtils';

export const openImageUrl = url =>
  fetch(url)
    .then(res => res.blob())
    .then(readAsDataURL);
