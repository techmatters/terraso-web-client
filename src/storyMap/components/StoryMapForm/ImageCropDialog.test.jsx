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
import { CarouselPresentation } from 'terraso-web-client/storyMap/components/StoryMapMedia';

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

test('ImageCropDialog: a fully visible image stays centered and higher zoom restores movement', async () => {
  const { drawImage, load } = mockCropImage(1280, 360);
  const onSave = jest.fn();
  await render(
    <ImageCropDialog
      image={{
        type: 'image/jpeg',
        url: 'https://test.com/wide.jpg',
        crop: { position: { x: 0.7, y: 0.4 }, scale: 2 },
      }}
      onClose={jest.fn()}
      onSave={onSave}
    />
  );
  const source = screen.getByAltText('Crop source');
  Object.defineProperties(source, {
    naturalWidth: { value: 1280 },
    naturalHeight: { value: 360 },
  });
  fireEvent.load(source);
  await load();
  const zoom = screen.getByRole('slider', { name: 'Zoom' });
  fireEvent.change(zoom, { target: { value: '0.5' } });
  const editor = screen.getByRole('application');
  const drag = () => {
    fireEvent.mouseDown(editor, { clientX: 300, clientY: 200 });
    fireEvent.mouseMove(document, { clientX: 300, clientY: 200 });
    fireEvent.mouseMove(document, { clientX: 364, clientY: 236 });
    fireEvent.mouseUp(document);
  };
  drag();
  fireEvent.keyDown(editor, { key: 'ArrowRight' });
  fireEvent.touchStart(editor, { touches: [{ pageX: 300, pageY: 200 }] });
  fireEvent.touchMove(document, {
    targetTouches: [{ pageX: 300, pageY: 200 }],
  });
  fireEvent.touchMove(document, {
    targetTouches: [{ pageX: 364, pageY: 236 }],
  });
  fireEvent.touchEnd(document);
  expect(editor).toHaveStyle({ cursor: 'default' });
  expect(drawImage).toHaveBeenLastCalledWith(
    expect.any(HTMLImageElement),
    20,
    20,
    640,
    180
  );
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(onSave).toHaveBeenLastCalledWith(
    { position: { x: 0.5, y: 0.5 }, scale: 0.5 },
    ''
  );

  fireEvent.change(zoom, { target: { value: '2' } });
  expect(editor).toHaveStyle({ cursor: 'grab' });
  drag();
  expect(drawImage).toHaveBeenLastCalledWith(
    expect.any(HTMLImageElement),
    expect.closeTo(-876),
    expect.closeTo(-124),
    2560,
    720
  );
});

test.each([
  { name: 'wide, vertically fitted', width: 1280, height: 360, scale: 0.8 },
  {
    name: 'portrait, horizontally fitted',
    width: 640,
    height: 720,
    scale: 0.8,
  },
  { name: 'wide, overflowing both axes', width: 1280, height: 360, scale: 1.2 },
  {
    name: 'portrait, overflowing both axes',
    width: 640,
    height: 720,
    scale: 1.2,
  },
])(
  'ImageCropDialog: $name crop stops at visible image edges in each direction',
  async ({ width, height, scale }) => {
    const { drawImage, load } = mockCropImage(width, height);
    const onSave = jest.fn();
    await render(
      <ImageCropDialog
        image={{
          type: 'image/jpeg',
          url: 'https://test.com/image.jpg',
          crop: { position: { x: 0.5, y: 0.5 }, scale },
        }}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );
    const source = screen.getByAltText('Crop source');
    Object.defineProperties(source, {
      naturalWidth: { value: width },
      naturalHeight: { value: height },
    });
    fireEvent.load(source);
    await load();
    const editor = screen.getByRole('application');
    const drag = distance => {
      fireEvent.mouseDown(editor, { clientX: 300, clientY: 200 });
      fireEvent.mouseMove(document, { clientX: 300, clientY: 200 });
      fireEvent.mouseMove(document, {
        clientX: 300 + distance,
        clientY: 200 + distance,
      });
      fireEvent.mouseUp(document);
    };
    const coverScale = Math.max(640 / width, 360 / height);
    const imageWidth = width * coverScale * scale;
    const imageHeight = height * coverScale * scale;
    const visibleWidth = Math.min(640, imageWidth);
    const visibleHeight = Math.min(360, imageHeight);
    drag(2000);
    expect(drawImage).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.closeTo(20),
      expect.closeTo(20),
      expect.closeTo(imageWidth),
      expect.closeTo(imageHeight)
    );
    drag(-2000);
    // Repeating a drag at the limit must not push the real canvas past the edge.
    drag(-2000);
    expect(drawImage).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.closeTo(20 - (imageWidth - visibleWidth)),
      expect.closeTo(20 - (imageHeight - visibleHeight)),
      expect.closeTo(imageWidth),
      expect.closeTo(imageHeight)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onSave).toHaveBeenLastCalledWith(
      {
        scale,
        position: {
          x: expect.closeTo(1 - visibleWidth / (2 * imageWidth)),
          y: expect.closeTo(1 - visibleHeight / (2 * imageHeight)),
        },
      },
      ''
    );
    // Zooming in after repeated edge drags preserves the visible selection,
    // rather than reusing the library's off-image drag coordinates.
    fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
      target: { value: '2' },
    });
    expect(drawImage).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.closeTo(
        20 +
          320 -
          (1 - visibleWidth / (2 * imageWidth)) * width * coverScale * 2
      ),
      expect.closeTo(
        20 +
          180 -
          (1 - visibleHeight / (2 * imageHeight)) * height * coverScale * 2
      ),
      expect.closeTo(width * coverScale * 2),
      expect.closeTo(height * coverScale * 2)
    );
    fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
      target: { value: '0.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onSave).toHaveBeenLastCalledWith(
      { scale: 0.5, position: { x: 0.5, y: 0.5 } },
      ''
    );
  }
);

test.each([
  { name: 'wide', width: 1280, height: 360, left: '0%', top: '10%' },
  { name: 'portrait', width: 640, height: 720, left: '10%', top: '0%' },
])(
  'CarouselPresentation: an underfilled $name crop centers the fitted axis and bounds the overflowing axis',
  async ({ width, height, left, top }) => {
    await render(
      <CarouselPresentation
        items={[
          {
            type: 'image/jpeg',
            url: 'https://test.com/image.jpg',
            crop: { position: { x: -1, y: -1 }, scale: 0.8 },
          },
        ]}
      />
    );
    const image = screen.getByRole('img');
    Object.defineProperties(image, {
      naturalWidth: { value: width },
      naturalHeight: { value: height },
    });
    fireEvent.load(image);
    expect(parseFloat(image.style.left)).toBeCloseTo(parseFloat(left));
    expect(parseFloat(image.style.top)).toBeCloseTo(parseFloat(top));
  }
);
