/*
 * Copyright © 2026 Technology Matters
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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from 'terraso-web-client/tests/utils';
import i18n from 'i18next';

import ImageCropDialog from 'terraso-web-client/storyMap/components/StoryMapForm/ImageCropDialog';

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext',
  () => ({ useStoryMapMediaContext: () => ({ getMediaFile: () => undefined }) })
);

afterEach(() => jest.restoreAllMocks());

const mockCropImage = (width = 640, height = 360) => {
  const drawImage = jest.fn();
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(function () {
      return {
        canvas: this,
        drawImage,
        save: jest.fn(),
        restore: jest.fn(),
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        beginPath: jest.fn(),
        rect: jest.fn(),
        fill: jest.fn(),
      };
    });
  // jsdom does not load images or paint canvases. Only those browser boundaries
  // are stubbed; react-avatar-editor and its crop calculations remain real.
  const loadingImages = [];
  jest.spyOn(window, 'Image').mockImplementation(() => {
    const image = document.createElement('img');
    Object.defineProperties(image, {
      width: { value: width },
      height: { value: height },
      src: { set: () => loadingImages.push(image) },
    });
    return image;
  });
  return {
    drawImage,
    load: () =>
      act(async () => {
        loadingImages.forEach(image => fireEvent.load(image));
      }),
  };
};

test('ImageCropDialog: the real crop canvas has a localized accessible name at every zoom level', async () => {
  const { load } = mockCropImage();
  const previousLanguage = i18n.language;
  try {
    await act(() => i18n.changeLanguage('en-US'));
    await render(
      <ImageCropDialog
        image={{
          type: 'image/jpeg',
          url: 'https://test.com/image.jpg',
          crop: { position: { x: 0.5, y: 0.5 }, scale: 2 },
        }}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    await load();
    expect(
      screen.getByRole('application', {
        name: 'Image crop editor',
      })
    ).toHaveAttribute('aria-roledescription', 'image editor');
    await act(() => i18n.changeLanguage('es-ES'));
    expect(
      screen.getByRole('application', {
        name: 'Editor de recorte de imagen',
      })
    ).toHaveAttribute('aria-roledescription', 'editor de imágenes');
    fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
      target: { value: '1' },
    });
    expect(
      screen.getByRole('application', {
        name: 'Editor de recorte de imagen',
      })
    ).toBeInTheDocument();
  } finally {
    await act(() => i18n.changeLanguage(previousLanguage));
  }
});

test('ImageCropDialog: legacy fit scale is used until image dimensions supply the actual fit threshold', async () => {
  const { load } = mockCropImage(1280, 360);
  await render(
    <ImageCropDialog
      image={{
        type: 'image/jpeg',
        url: 'https://test.com/wide.jpg',
        crop: { position: { x: 0.5, y: 0.5 }, scale: 0.8, fitScale: 0.6 },
      }}
      onClose={jest.fn()}
      onSave={jest.fn()}
    />
  );
  const zoom = screen.getByRole('slider', { name: 'Zoom' });
  expect(zoom).toHaveAttribute('aria-valuemin', '0.6');
  const source = screen.getByAltText('Crop source');
  Object.defineProperties(source, {
    naturalWidth: { value: 1280 },
    naturalHeight: { value: 360 },
  });
  fireEvent.load(source);
  await load();
  expect(zoom).toHaveAttribute('aria-valuemin', '0.5');
  expect(zoom).toHaveAttribute('aria-valuenow', '0.8');
});

test('ImageCropDialog: reopening an off-center crop draws the saved selection with the real editor', async () => {
  const { drawImage, load } = mockCropImage();
  const crop = { position: { x: 0.7, y: 0.4 }, scale: 2 };
  const onSave = jest.fn();
  await render(
    <ImageCropDialog
      image={{ type: 'image/jpeg', url: 'https://test.com/image.jpg', crop }}
      onClose={jest.fn()}
      onSave={onSave}
    />
  );

  await load();

  // A 640×360 source at 2× zoom is 1280×720. The selected crop starts
  // at (0.45, 0.15); the editor adds its 20px border to the drawing offsets.
  await waitFor(() =>
    expect(drawImage).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.closeTo(-556),
      expect.closeTo(-88),
      1280,
      720
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(onSave).toHaveBeenCalledWith(crop, '');
});
