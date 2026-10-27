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
  within,
} from 'terraso-web-client/tests/utils';
import i18n from 'i18next';
import StoryMapMediaEditor, {
  INITIAL_CHAPTER,
} from 'terraso-web-client/tests/data/StoryMapMediaEditor';
import Button from '@mui/material/Button';
import { getContrastRatio } from '@mui/material/styles';

import {
  CarouselPresentation,
  GalleryPresentation,
} from 'terraso-web-client/storyMap/components/StoryMapMedia';
import { STORY_MAP_THEME_OPTIONS } from 'terraso-web-client/storyMap/storyMapThemeUtils';

import { STORY_MAP_MEDIA_MAX_SIZE } from 'terraso-web-client/config';

const originalFetch = global.fetch;
const OriginalIntersectionObserver = globalThis.IntersectionObserver;
const loadImageDimensions = (
  image,
  naturalWidth = 640,
  naturalHeight = 360
) => {
  Object.defineProperties(image, {
    naturalWidth: { value: naturalWidth },
    naturalHeight: { value: naturalHeight },
  });
  fireEvent.load(image);
};

beforeEach(() => {
  globalThis.IntersectionObserver = jest.fn(callback => ({
    observe: target => callback([{ target, isIntersecting: true }]),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  }));
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ title: 'YouTube video title' }),
  });
});
afterAll(() => {
  global.fetch = originalFetch;
  globalThis.IntersectionObserver = OriginalIntersectionObserver;
});

const MEDIA_ERROR_MESSAGES = [
  {
    language: 'en-US',
    media: 'Media unavailable',
    video: 'Video preview unavailable',
  },
  {
    language: 'es-ES',
    media: 'Contenido multimedia no disponible',
    video: 'Vista previa no disponible',
  },
];

test.each(MEDIA_ERROR_MESSAGES)(
  'StoryMapMedia: failed images show the localized media error message in $language',
  async ({ language, media }) => {
    await render(
      <CarouselPresentation items={[INITIAL_CHAPTER.mediaItems[0]]} />
    );
    const previousLanguage = i18n.language;
    try {
      await act(() => i18n.changeLanguage(language));
      fireEvent.error(screen.getByRole('img'));
      expect(screen.getByRole('alert')).toHaveTextContent(media);
    } finally {
      await act(() => i18n.changeLanguage(previousLanguage));
    }
  }
);

test.each(MEDIA_ERROR_MESSAGES)(
  'StoryMapMedia: failed gallery videos show the localized preview error message in $language',
  async ({ language, video }) => {
    await render(
      <GalleryPresentation items={[INITIAL_CHAPTER.mediaItems[4]]} />
    );
    const previousLanguage = i18n.language;
    try {
      await act(() => i18n.changeLanguage(language));
      fireEvent.error(screen.getByLabelText('video media'));
      expect(screen.getByRole('alert')).toHaveTextContent(video);
    } finally {
      await act(() => i18n.changeLanguage(previousLanguage));
    }
  }
);

jest.mock('react-avatar-editor', () => ({
  __esModule: true,
  default: props => (
    <div
      data-position={JSON.stringify(props.position)}
      data-scale={props.scale}
      data-testid="image-crop-editor"
    />
  ),
}));

test.each([
  { name: 'portrait', width: 900, height: 1200 },
  { name: 'wide', width: 3000, height: 1000 },
])(
  'StoryMapMediaEditor: a fresh $name image fits the full image with blurred fill before crop editing and after reopening',
  async ({ width, height }) => {
    const image = {
      id: 'fresh-image',
      type: 'image/jpeg',
      signedUrl: 'https://test.com/fresh.jpg',
    };
    const initialChapter = { ...INITIAL_CHAPTER, mediaItems: [image] };
    const { unmount } = await render(
      <StoryMapMediaEditor initialChapter={initialChapter} />
    );
    const viewport = screen.getByTestId('carousel-viewport');
    expect(viewport).toHaveStyle({ 'aspect-ratio': '16/9' });
    const preview = within(viewport).getByRole('img');
    Object.defineProperties(preview, {
      naturalWidth: { value: width },
      naturalHeight: { value: height },
    });
    fireEvent.load(preview);
    expect(within(viewport).getByRole('img')).toHaveStyle({
      objectFit: 'contain',
    });
    expect(screen.getByTestId('image-fit-preview')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Update Media' })
    ).not.toBeInTheDocument();
    expect(image).not.toHaveProperty('crop');
    unmount();
    await render(
      <StoryMapMediaEditor
        initialChapter={JSON.parse(JSON.stringify(initialChapter))}
      />
    );
    expect(screen.getByTestId('image-fit-preview')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('carousel-viewport')).getByRole('img')
    ).toHaveStyle({ objectFit: 'contain' });
  }
);

test.each([
  {
    language: 'en-US',
    altAction: 'Add alt text for image media 1',
    editAltAction: 'Edit alt text for image media 1',
    altTooltip: 'Add alt text',
    done: 'Done',
  },
  {
    language: 'es-ES',
    altAction: 'Agregar texto alternativo para imagen multimedia 1',
    editAltAction: 'Editar texto alternativo para imagen multimedia 1',
    altTooltip: 'Agregar texto alternativo',
    done: 'Listo',
  },
])(
  'StoryMapMediaEditor: crop completion and ALT action labels are localized for $language',
  async ({ language, altAction, editAltAction, altTooltip, done }) => {
    const previousLanguage = i18n.language;
    try {
      await act(() => i18n.changeLanguage(language));
      await render(
        <StoryMapMediaEditor
          initialChapter={{
            ...INITIAL_CHAPTER,
            mediaItems: [INITIAL_CHAPTER.mediaItems[0]],
          }}
        />
      );
      const altButton = screen.getByRole('button', { name: altAction });
      fireEvent.mouseOver(altButton);
      expect(await screen.findByRole('tooltip')).toHaveTextContent(altTooltip);
      fireEvent.click(altButton);
      expect(screen.getByRole('button', { name: done })).toBeInTheDocument();
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Image description' },
      });
      fireEvent.click(screen.getByRole('button', { name: done }));
      fireEvent.click(screen.getByRole('button', { name: editAltAction }));
      expect(screen.getByRole('button', { name: done })).toBeInTheDocument();
    } finally {
      await act(() => i18n.changeLanguage(previousLanguage));
    }
  }
);

test.each(STORY_MAP_THEME_OPTIONS)(
  'StoryMapMediaEditor: $id keeps collection controls and expanded media in the selected theme',
  async storyTheme => {
    await render(
      <StoryMapMediaEditor
        initialChapter={{ ...INITIAL_CHAPTER, themeId: storyTheme.id }}
      />
    );
    expect(screen.getByRole('button', { name: 'Next media' })).toHaveStyle({
      color: 'var(--story-theme-text)',
    });
    expect(screen.getByRole('button', { name: 'Add media' })).toHaveClass(
      'MuiButton-contained'
    );
    const toolbar = screen.getByRole('toolbar', {
      name: 'Current media actions',
    });
    expect(toolbar).toHaveStyle({ backgroundColor: 'rgba(33, 33, 33, 0.92)' });
    for (const name of [
      'Crop image media 1',
      'Remove image media 1',
      'Move image media 1 later',
    ]) {
      expect(within(toolbar).getByRole('button', { name })).toHaveStyle({
        color: 'rgb(255, 255, 255)',
      });
    }
    expect(
      within(toolbar).getByRole('button', {
        name: 'Move image media 1 earlier',
      })
    ).toHaveStyle({
      color: 'rgba(255, 255, 255, 0.45)',
    });
    expect(
      screen.getByRole('button', { name: 'Display as carousel' })
    ).toHaveStyle({
      'background-color': 'var(--story-theme-highlight)',
      color: 'var(--story-theme-highlight-text)',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));
    expect(screen.getByTestId('gallery-media-collection')).toHaveStyle({
      color: 'var(--story-theme-text)',
      '--story-theme-text': storyTheme.text,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open image media 1' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveStyle({
      '--story-theme-background': storyTheme.background,
      '--story-theme-text': storyTheme.text,
    });
    expect(
      within(dialog).getByRole('button', { name: 'Close media viewer' })
    ).toHaveStyle({
      'background-color': 'var(--story-theme-text)',
      color: 'var(--story-theme-background)',
    });
    const highlightText = getComputedStyle(dialog).getPropertyValue(
      '--story-theme-highlight-text'
    );

    expect(
      getContrastRatio(highlightText, storyTheme.highlight)
    ).toBeGreaterThanOrEqual(4.5);
  }
);

test.each([1, 2])(
  'StoryMapMediaEditor: Add media matches standard editor action buttons with %i items',
  async count => {
    await render(
      <>
        <Button variant="contained">Reference action</Button>
        <StoryMapMediaEditor
          initialChapter={{
            ...INITIAL_CHAPTER,
            themeId: 'theme-1',
            mediaItems: INITIAL_CHAPTER.mediaItems.slice(0, count),
          }}
        />
      </>
    );

    const referenceStyle = getComputedStyle(
      screen.getByRole('button', { name: 'Reference action' })
    );
    expect(screen.getByRole('button', { name: 'Add media' })).toHaveStyle({
      color: referenceStyle.color,
      backgroundColor: referenceStyle.backgroundColor,
    });
  }
);

test.each([
  {
    language: 'en-US',
    heading: 'Drag files here or choose files',
    helper: 'Supported files: images, audio, and video.',
    position: 'Media 1 of 5',
    addText: 'Add media',
    toolbar: 'Media collection actions',
  },
  {
    language: 'es-ES',
    heading: 'Arrastra archivos aquí o elige archivos',
    helper: 'Archivos compatibles: imágenes, audio y video.',
    position: '1 de 5',
    addText: 'Agregar',
    toolbar: 'Acciones de la colección multimedia',
  },
])(
  'StoryMapMediaEditor: chapters below the limit can open the localized upload picker in $language',
  async ({ language, heading, helper, position, addText, toolbar }) => {
    const previousLanguage = i18n.language;
    try {
      await act(() => i18n.changeLanguage(language));
      await render(
        <StoryMapMediaEditor
          initialChapter={{
            ...INITIAL_CHAPTER,
            mediaItems: INITIAL_CHAPTER.mediaItems.slice(0, 5),
          }}
        />
      );

      const addMediaButton = screen.getByRole('button', {
        name: /Add media|Agregar multimedia/,
      });
      expect(addMediaButton).toBeEnabled();
      expect(addMediaButton.textContent).toBe(addText);
      expect(screen.getByRole('toolbar', { name: toolbar })).toHaveStyle({
        flexWrap: 'wrap',
      });
      fireEvent.click(addMediaButton);
      const dialog = screen.getByRole('dialog', {
        name: /Add media|Agregar multimedia/,
      });
      expect(
        within(dialog).getByRole('heading', { name: heading })
      ).toBeVisible();
      expect(within(dialog).getByText(helper)).toBeVisible();
      expect(screen.getByText(position)).toBeInTheDocument();
    } finally {
      await act(() => i18n.changeLanguage(previousLanguage));
    }
  }
);

test.each([
  {
    language: 'en-US',
    explanation: 'Maximum of 6 media items per chapter.',
  },
  {
    language: 'es-ES',
    explanation: 'Máximo de 6 elementos multimedia por capítulo.',
  },
])(
  'StoryMapMediaEditor: six items disable adding with a localized explanation in $language',
  async ({ language, explanation }) => {
    const previousLanguage = i18n.language;
    try {
      await act(() => i18n.changeLanguage(language));
      await render(<StoryMapMediaEditor />);
      const addMediaButton = screen.getByRole('button', {
        name: /Add media|Agregar multimedia/,
      });
      expect(addMediaButton).toBeDisabled();
      expect(addMediaButton).toHaveAttribute('aria-description', explanation);
      fireEvent.mouseOver(addMediaButton);
      expect(await screen.findByRole('tooltip')).toHaveTextContent(explanation);
      fireEvent.click(addMediaButton);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    } finally {
      await act(() => i18n.changeLanguage(previousLanguage));
    }
  }
);

test('StoryMapMediaEditor: adding a sixth item preserves existing media and disables further additions', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: INITIAL_CHAPTER.mediaItems.slice(0, 5),
      }}
    />
  );

  const addMediaButton = screen.getByRole('button', { name: 'Add media' });
  expect(addMediaButton).toBeEnabled();
  fireEvent.click(addMediaButton);
  const dialog = screen.getByRole('dialog', { name: 'Add media' });
  expect(
    within(dialog).getByRole('link', {
      name: /Learn how to add images, videos, and audio to your story/,
    })
  ).toHaveAttribute('href', 'https://terraso.org/help/chapters/#add-media');
  expect(within(dialog).getByRole('link')).toHaveAttribute('target', '_blank');
  expect(within(dialog).getByRole('link')).toHaveStyle({
    display: 'block',
    marginBottom: '16px',
  });
  expect(within(dialog).getByRole('link').parentElement).toContainElement(
    within(dialog).getByRole('button', {
      name: /Drag files here or choose files/,
    })
  );
  const input = within(dialog).getByRole('textbox', {
    name: 'Link to a YouTube or Vimeo video',
  });
  fireEvent.change(input, {
    target: { value: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
  });
  fireEvent.blur(input);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add media' }));

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(screen.getByText('Media 6 of 6')).toBeInTheDocument();
  expect(await screen.findByText('YouTube video title')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add media' })).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Expand Embedded video' })
  );
  expect(
    within(screen.getByRole('dialog')).getByTitle('Embedded video')
  ).toHaveAttribute('src', 'https://www.youtube.com/embed/aqz-KE-bpKQ');
  fireEvent.click(screen.getByRole('button', { name: 'Close media viewer' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  for (let position = 5; position >= 1; position -= 1) {
    fireEvent.click(screen.getByRole('button', { name: 'Previous media' }));
    expect(screen.getByText(`Media ${position} of 6`)).toBeInTheDocument();
  }
});

test('StoryMapMedia: YouTube Gallery preview still opens playback when metadata fails', async () => {
  global.fetch.mockRejectedValue(new Error('Video is unavailable'));
  await render(<GalleryPresentation items={[INITIAL_CHAPTER.mediaItems[5]]} />);
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Video preview unavailable'
  );
  const preview = screen.getByRole('button', { name: /Open/ });
  expect(within(preview).getByRole('presentation')).toHaveAttribute(
    'src',
    'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg'
  );
  fireEvent.click(preview);
  expect(
    within(screen.getByRole('dialog')).getByTitle(/embedded/i)
  ).toHaveAttribute('src', INITIAL_CHAPTER.mediaItems[5].url);
});

test.each([
  { name: 'Gallery', Presentation: GalleryPresentation },
  { name: 'Carousel', Presentation: CarouselPresentation },
])(
  'StoryMapMedia: $name Vimeo preview shows title and thumbnail and retains playback after a thumbnail error',
  async ({ Presentation }) => {
    const item = {
      type: 'embedded',
      source: 'vimeo',
      url: 'https://player.vimeo.com/video/1084537',
    };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Big Buck Bunny',
        thumbnail_url: 'https://i.vimeocdn.com/video/bunny.jpg',
      }),
    });
    await render(<Presentation items={[item]} />);
    expect(await screen.findByText('Big Buck Bunny')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F1084537',
      expect.objectContaining({ signal: expect.anything() })
    );
    const thumbnail = screen.getByRole('presentation');
    expect(thumbnail).toHaveAttribute(
      'src',
      'https://i.vimeocdn.com/video/bunny.jpg'
    );
    fireEvent.error(thumbnail);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Video preview unavailable'
    );
    fireEvent.click(screen.getByRole('button', { name: /^(Open|Expand) / }));
    expect(
      within(screen.getByRole('dialog')).getByTitle(/embedded/i)
    ).toHaveAttribute('src', item.url);
  }
);

test('StoryMapMedia: unavailable Vimeo metadata leaves a usable playback preview', async () => {
  const item = {
    type: 'embedded',
    source: 'vimeo',
    url: 'https://player.vimeo.com/video/1084537',
  };
  global.fetch.mockResolvedValue({ ok: false, status: 404 });
  await render(<GalleryPresentation items={[item]} />);
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Video preview unavailable'
  );
  fireEvent.click(screen.getByRole('button', { name: /^Open / }));
  expect(
    within(screen.getByRole('dialog')).getByTitle(/embedded/i)
  ).toHaveAttribute('src', item.url);
});

test('StoryMapMediaEditor: choosing a link after dropping a file submits only the link without radios', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: INITIAL_CHAPTER.mediaItems.slice(0, 1),
      }}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Add media' }));
  const dialog = screen.getByRole('dialog', { name: 'Add media' });
  expect(within(dialog).queryByRole('radio')).not.toBeInTheDocument();
  const dropZone = within(dialog).getByRole('button', {
    name: /Drag files here or choose files/,
  });
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
  await act(async () =>
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      },
    })
  );
  const submit = within(dialog).getByRole('button', { name: 'Add media' });
  await waitFor(() => expect(submit).toBeEnabled());
  const input = within(dialog).getByRole('textbox', {
    name: 'Link to a YouTube or Vimeo video',
  });
  fireEvent.change(input, {
    target: { value: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
  });
  fireEvent.blur(input);
  fireEvent.click(submit);
  expect(await screen.findByText('YouTube video title')).toBeInTheDocument();
  expect(screen.getByText('Media 2 of 2')).toBeInTheDocument();
});

test.each([
  {
    filename: 'document.txt',
    type: 'text/plain',
    size: 10,
    error: 'The file cannot be added.',
  },
  {
    filename: 'large.jpg',
    type: 'image/jpeg',
    size: STORY_MAP_MEDIA_MAX_SIZE + 1,
    error: 'large.jpg cannot be added because the file is too large.',
  },
])(
  'StoryMapMediaEditor: rejects $filename without allowing submission',
  async ({ filename, type, size, error }) => {
    await render(
      <StoryMapMediaEditor
        initialChapter={{
          ...INITIAL_CHAPTER,
          mediaItems: INITIAL_CHAPTER.mediaItems.slice(0, 5),
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add media' }));
    const dialog = screen.getByRole('dialog', { name: 'Add media' });
    const file = new File(['file'], filename, { type });
    Object.defineProperty(file, 'size', { value: size });
    await act(async () =>
      fireEvent.drop(
        within(dialog).getByRole('button', {
          name: /Drag files here or choose files/,
        }),
        {
          dataTransfer: {
            files: [file],
            items: [{ kind: 'file', type, getAsFile: () => file }],
            types: ['Files'],
          },
        }
      )
    );
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(error);
    expect(
      within(dialog).getByRole('button', { name: 'Add media' })
    ).toBeDisabled();
  }
);

test('StoryMapMediaEditor: existing chapters above six retain navigation but cannot add more', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: [
          ...INITIAL_CHAPTER.mediaItems,
          { ...INITIAL_CHAPTER.mediaItems[0], id: 'legacy-seventh-item' },
        ],
      }}
    />
  );

  expect(screen.getByText('Media 1 of 7')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add media' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
  expect(screen.getByText('Media 2 of 7')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add media' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test.each(['theme-1', 'theme-7'])(
  'StoryMapMediaEditor: empty media retains the original upload placeholder in %s',
  async themeId => {
    await render(
      <StoryMapMediaEditor
        initialChapter={{
          ...INITIAL_CHAPTER,
          themeId,
          mediaItems: [],
        }}
      />
    );
    const upload = screen.getByRole('button', { name: 'Add media' });
    expect(upload).toHaveClass('MuiButton-outlined');
    expect(within(upload).queryByTestId('AddIcon')).not.toBeInTheDocument();
    expect(upload.parentElement).toHaveStyle({
      backgroundColor: 'rgb(210, 237, 247)',
      minHeight: '150px',
      padding: '16px',
      alignItems: 'center',
      justifyContent: 'center',
    });
    expect(
      screen.getByText(
        'Upload or link images, audio recordings or video files.'
      )
    ).toBeInTheDocument();
    fireEvent.click(upload);
    expect(
      screen.getByRole('dialog', { name: 'Add media' })
    ).toBeInTheDocument();
  }
);

test('StoryMapMediaEditor: single-media controls remain visible on a dark theme', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        themeId: 'theme-1',
        mediaItems: [INITIAL_CHAPTER.mediaItems[0]],
      }}
    />
  );
  expect(
    screen.getByRole('button', { name: 'Crop image media 1' })
  ).toHaveStyle({ color: 'rgb(255, 255, 255)' });
});

test('StoryMapMediaEditor: next and previous controls navigate the controlled media collection', async () => {
  await render(<StoryMapMediaEditor />);
  expect(
    within(
      screen.getByRole('button', { name: 'Move image media 1 earlier' })
    ).getByTestId('NavigateBeforeIcon')
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole('button', { name: 'Move image media 1 later' })
    ).getByTestId('NavigateNextIcon')
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
  expect(screen.getByText('Media 2 of 6')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Previous media' }));
  expect(screen.getByText('Media 1 of 6')).toBeInTheDocument();
});

test('StoryMapMediaEditor: a single image supports alt text, cropping and original-image expansion', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: [INITIAL_CHAPTER.mediaItems[0]],
      }}
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Add alt text for image media 1' })
  );
  fireEvent.change(
    screen.getByRole('textbox', {
      name: 'Describe this image for people with visual impairments',
    }),
    {
      target: { value: 'Mangrove restoration' },
    }
  );
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  const croppedImage = screen.getByRole('img', {
    name: 'Mangrove restoration',
  });
  loadImageDimensions(croppedImage);
  expect(croppedImage).toHaveStyle({
    width: '200%',
    height: '200%',
    left: '-50%',
    top: '-50%',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Expand image media' }));
  expect(
    within(screen.getByRole('dialog')).getByRole('img', {
      name: 'Mangrove restoration',
    }).style.left
  ).toBe('');
});

test.each([
  { name: 'Gallery', Presentation: GalleryPresentation },
  { name: 'Carousel', Presentation: CarouselPresentation },
])(
  'StoryMapMedia: $name previews launch playback only in the viewer',
  async ({ Presentation }) => {
    const items = [
      {
        id: 'audio-1',
        type: 'audio/mpeg',
        url: 'https://test.com/audio.mp3',
        label: 'audio media',
      },
      {
        id: 'video-1',
        type: 'video/mp4',
        url: 'https://test.com/video.mp4',
        label: 'video media',
      },
      {
        id: 'image-1',
        type: 'image/jpeg',
        url: 'https://test.com/image.jpg',
        label: 'image media',
      },
      {
        id: 'embed-1',
        type: 'embedded',
        url: 'https://test.com/embed',
        label: 'Embedded video',
      },
      { ...INITIAL_CHAPTER.mediaItems[5], label: 'Embedded video' },
      {
        id: 'vimeo-1',
        type: 'embedded',
        source: 'vimeo',
        url: 'https://player.vimeo.com/video/1084537',
        label: 'Embedded video',
      },
    ];
    for (const item of items) {
      const { unmount } = await render(
        <Presentation items={[item]} theme={{ id: 'theme-5' }} />
      );
      expect(screen.queryByLabelText('audio media')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Embedded video')).not.toBeInTheDocument();
      screen.queryAllByLabelText('video media').forEach(preview => {
        expect(preview).not.toHaveAttribute('controls');
      });
      const launcher = screen.getByRole('button', {
        name: /^(Open|Expand) /,
      });
      expect(
        within(launcher).queryByTestId('OpenInFullIcon')
      ).not.toBeInTheDocument();
      expect(within(launcher).queryByRole('button')).not.toBeInTheDocument();
      launcher.focus();
      expect(launcher).toHaveFocus();
      fireEvent.click(launcher);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle({ '--story-theme-background': '#1A3A2A' });
      const player = item.type.startsWith('image')
        ? within(dialog).getByRole('img', { name: item.label })
        : within(dialog).getByLabelText(item.label);
      expect(player.hasAttribute('controls')).toBe(
        item.type.startsWith('audio') || item.type.startsWith('video')
      );
      expect(player).not.toHaveAttribute('autoplay');
      unmount();
    }
  }
);

test.each([
  {
    name: 'off-center',
    naturalWidth: 640,
    naturalHeight: 360,
    position: { x: 0.3, y: 0.7 },
    offsets: [
      [-64, -324],
      [-144, -324],
    ],
  },
  {
    name: 'portrait',
    naturalWidth: 640,
    naturalHeight: 720,
    position: { x: 0.4, y: 0.6 },
    offsets: [
      [-192, -684],
      [-144, -468],
    ],
  },
  {
    name: 'wide',
    naturalWidth: 1280,
    naturalHeight: 360,
    position: { x: 0.3, y: 0.7 },
    offsets: [
      [-448, -324],
      [-528, -324],
    ],
  },
  {
    name: 'boundary-clamped',
    naturalWidth: 640,
    naturalHeight: 360,
    position: { x: 0, y: 1 },
    offsets: [
      [0, -360],
      [0, -360],
    ],
  },
])(
  'StoryMapMediaEditor: renders $name crops at editor-equivalent offsets in both presentations',
  async ({ naturalWidth, naturalHeight, position, offsets }) => {
    const item = {
      ...INITIAL_CHAPTER.mediaItems[0],
      crop: { position, scale: 2 },
    };
    for (const [index, Presentation] of [
      CarouselPresentation,
      GalleryPresentation,
    ].entries()) {
      const { unmount } = await render(<Presentation items={[item]} />);
      const image = screen.getByRole('img', { name: 'image media' });
      loadImageDimensions(image, naturalWidth, naturalHeight);

      expect(image.draggable).toBe(false);
      expect(image).toHaveStyle({
        position: 'absolute',
        objectFit: 'fill',
      });
      const width = index === 0 ? 640 : 480;
      const height = 360;
      const coverScale = Math.max(width / naturalWidth, height / naturalHeight);
      expect((parseFloat(image.style.width) / 100) * width).toBeCloseTo(
        naturalWidth * coverScale * 2
      );
      expect((parseFloat(image.style.height) / 100) * height).toBeCloseTo(
        naturalHeight * coverScale * 2
      );
      const renderedX = (parseFloat(image.style.left) / 100) * width;
      const renderedY = (parseFloat(image.style.top) / 100) * height;
      expect(renderedX).toBeCloseTo(offsets[index][0]);
      expect(renderedY).toBeCloseTo(offsets[index][1]);
      expect(image.style.transform).toBe('');
      expect(image.parentElement).toHaveStyle({
        position: 'absolute',
        inset: '0',
        overflow: 'hidden',
      });
      unmount();
    }
  }
);

test('StoryMapMediaEditor: stores image crop settings for the carousel while expansion uses the original image', async () => {
  await render(<StoryMapMediaEditor />);

  expect(screen.getByRole('button', { name: 'Add media' })).toBeInTheDocument();

  const carousel = screen.getByTestId('carousel-viewport');
  const originalImage = within(carousel).getByRole('img', {
    name: 'image media',
  });
  const originalSource = originalImage.getAttribute('src');

  const carouselActions = screen.getByRole('toolbar', {
    name: 'Current media actions',
  });
  expect(carousel.parentElement.previousElementSibling).toBe(carouselActions);
  fireEvent.click(
    within(carouselActions).getByRole('button', {
      name: 'Crop image media 1',
    })
  );
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));

  const croppedImage = within(carousel).getByRole('img', {
    name: 'image media',
  });
  loadImageDimensions(croppedImage);
  expect(croppedImage).toHaveStyle({
    width: '200%',
    height: '200%',
    left: '-50%',
    top: '-50%',
  });
  expect(screen.getByText('Media 1 of 6')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Expand image media' }));

  expect(
    within(screen.getByRole('dialog')).getByRole('img', {
      name: 'image media',
    })
  ).toHaveAttribute('src', originalSource);
});

test('StoryMapMediaEditor: closes the headerless expanded media viewer with its top-right close control', async () => {
  await render(<StoryMapMediaEditor />);

  fireEvent.click(screen.getByRole('button', { name: 'Expand image media' }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(
    screen.queryByTestId('gallery-media-viewer-header')
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Close media viewer' }));

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
});

test('StoryMapMediaEditor: fits the full image at the computed minimum zoom', async () => {
  await render(<StoryMapMediaEditor />);

  fireEvent.click(
    within(
      screen.getByRole('toolbar', { name: 'Current media actions' })
    ).getByRole('button', { name: 'Crop image media 1' })
  );
  const cropSource = screen.getByAltText('Crop source');
  Object.defineProperties(cropSource, {
    naturalHeight: { value: 1000 },
    naturalWidth: { value: 3000 },
  });
  fireEvent.load(cropSource);
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '0.5925925925925926' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));

  const stageImage = within(screen.getByTestId('carousel-viewport')).getByRole(
    'img',
    { name: 'image media' }
  );
  Object.defineProperties(stageImage, {
    naturalHeight: { value: 1000 },
    naturalWidth: { value: 3000 },
  });
  fireEvent.load(stageImage);

  expect(
    within(screen.getByTestId('carousel-viewport')).getByRole('img', {
      name: 'image media',
    })
  ).toHaveStyle({ objectFit: 'contain' });
});

test('StoryMapMediaEditor: applies saved carousel crops to Gallery tiles', async () => {
  await render(<StoryMapMediaEditor />);

  fireEvent.click(
    within(
      screen.getByRole('toolbar', { name: 'Current media actions' })
    ).getByRole('button', { name: 'Crop image media 1' })
  );
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));

  const galleryImage = await waitFor(() =>
    within(
      screen.getByRole('button', { name: 'Open image media 1' })
    ).getByRole('img', { name: 'image media' })
  );
  loadImageDimensions(galleryImage, 480, 360);
  expect(galleryImage).toHaveStyle({
    width: '200%',
    height: '200%',
    left: '-50%',
    top: '-50%',
  });
});

test('StoryMapMediaEditor: fills Gallery tiles behind complete minimum-zoom images', async () => {
  await render(<StoryMapMediaEditor />);

  fireEvent.click(
    within(
      screen.getByRole('toolbar', { name: 'Current media actions' })
    ).getByRole('button', { name: 'Crop image media 1' })
  );
  const cropSource = screen.getByAltText('Crop source');
  Object.defineProperties(cropSource, {
    naturalHeight: { value: 1000 },
    naturalWidth: { value: 3000 },
  });
  fireEvent.load(cropSource);
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '0.5925925925925926' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));

  const galleryImage = await waitFor(() =>
    within(
      screen.getByRole('button', { name: 'Open image media 1' })
    ).getByRole('img', { name: 'image media' })
  );
  Object.defineProperties(galleryImage, {
    naturalHeight: { value: 1000 },
    naturalWidth: { value: 3000 },
  });
  fireEvent.load(galleryImage);

  const fittedGalleryImage = within(
    screen.getByRole('button', { name: 'Open image media 1' })
  ).getByRole('img', { name: 'image media' });
  expect(fittedGalleryImage).toHaveStyle({ objectFit: 'contain' });
  expect(fittedGalleryImage.parentElement).toHaveStyle({
    position: 'relative',
  });
});

test('StoryMapMediaEditor: provides clear reordering, direct navigation, and confirmed deletion', async () => {
  await render(<StoryMapMediaEditor />);

  expect(
    within(
      screen.getByRole('toolbar', { name: 'Media collection actions' })
    ).getByRole('button', { name: 'Add media' })
  ).toBeInTheDocument();

  const currentMediaActions = screen.getByRole('toolbar', {
    name: 'Current media actions',
  });
  expect(
    within(currentMediaActions).getByRole('button', {
      name: 'Move image media 1 earlier',
    })
  ).toBeDisabled();
  expect(
    within(currentMediaActions).getByRole('button', {
      name: 'Move image media 1 later',
    })
  ).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: 'image media 2' }));

  expect(screen.getByText('Media 2 of 6')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'image media 2' })).toHaveAttribute(
    'aria-current',
    'true'
  );

  fireEvent.click(
    within(
      screen.getByRole('toolbar', { name: 'Current media actions' })
    ).getByRole('button', { name: 'Remove image media 2' })
  );

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Delete image?')).toBeInTheDocument();
  expect(screen.getByText('Media 2 of 6')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(screen.getByText('Media 2 of 5')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add media' })).toBeEnabled();
});

test('StoryMapMediaEditor: shows one actionable ALT indicator on images without alt text', async () => {
  await render(<StoryMapMediaEditor />);

  const altTextBadge = screen.getByRole('button', {
    name: 'Add alt text for image media 1',
  });
  expect(altTextBadge).toBeInTheDocument();
  expect(
    screen.queryAllByRole('button', {
      name: 'Add alt text for image media 1',
    })
  ).toHaveLength(1);

  fireEvent.click(altTextBadge);
  fireEvent.change(
    screen.getByPlaceholderText(
      'Describe this image for people with visual impairments'
    ),
    { target: { value: 'A mapped landscape with trees and wildflowers.' } }
  );
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));

  expect(
    screen.getByRole('button', { name: 'Edit alt text for image media 1' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /alt text for audio media/i })
  ).not.toBeInTheDocument();
});

test.each([
  { position: { x: 0.3, y: 0.7 }, left: -144, top: -324 },
  { position: { x: 0, y: 1 }, left: 0, top: -360 },
])(
  'StoryMapMedia: cropped drag snapshots keep tile bounds at crop $position',
  async ({ position, left, top }) => {
    const drawImage = jest.fn();
    const getContext = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage });
    try {
      await render(
        <GalleryPresentation
          items={[
            {
              ...INITIAL_CHAPTER.mediaItems[0],
              crop: { position, scale: 2 },
            },
          ]}
          onItemsReorder={jest.fn()}
        />
      );
      const image = screen.getByRole('img');
      loadImageDimensions(image);
      Object.defineProperty(image, 'complete', { value: true });
      const tile = image.closest('[data-gallery-media-tile]');
      jest.spyOn(tile, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 200,
        width: 480,
        height: 360,
      });
      jest.spyOn(image, 'getBoundingClientRect').mockReturnValue({
        left: 100 + left,
        top: 200 + top,
        width: 1280,
        height: 720,
      });
      const dataTransfer = {
        setData: jest.fn(),
        setDragImage: jest.fn(),
      };
      fireEvent.dragStart(tile, { dataTransfer });
      const [snapshot, x, y] = dataTransfer.setDragImage.mock.calls[0];
      expect(snapshot).toBeInstanceOf(HTMLCanvasElement);
      expect([snapshot.width, snapshot.height, x, y]).toEqual([
        480, 360, 240, 180,
      ]);
      expect(drawImage).toHaveBeenCalledWith(image, left, top, 1280, 720);
    } finally {
      getContext.mockRestore();
    }
  }
);

test('StoryMapMediaEditor: switches presentation while sharing contextual media actions', async () => {
  await render(<StoryMapMediaEditor />);

  const collectionActions = screen.getByRole('toolbar', {
    name: 'Media collection actions',
  });
  expect(
    within(collectionActions).getByRole('button', {
      name: 'Display as carousel',
    })
  ).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(
    within(collectionActions).getByRole('button', {
      name: 'Display as gallery',
    })
  );

  await waitFor(() =>
    expect(screen.getByTestId('gallery-media-grid')).toBeInTheDocument()
  );
  expect(screen.queryByTestId('carousel-viewport')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Reorder / })).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Open image media 1' }).parentElement
  ).toHaveAttribute('draggable', 'true');

  const firstMedia = screen.getByRole('button', {
    name: 'Open image media 1',
  });
  const secondMedia = screen.getByRole('button', {
    name: 'Open image media 2',
  });
  const firstSource = within(firstMedia).getByRole('img').getAttribute('src');
  expect(within(firstMedia).getByRole('img').draggable).toBe(false);
  expect(firstMedia).toHaveStyle({ cursor: 'grab' });
  expect(firstMedia.parentElement).toHaveStyle({
    backgroundColor: 'var(--story-theme-background)',
  });
  const secondSource = within(secondMedia).getByRole('img').getAttribute('src');
  const dataTransfer = {
    effectAllowed: 'uninitialized',
    getData: jest.fn(() => '0'),
    setData: jest.fn(),
    setDragImage: jest.fn(),
  };
  fireEvent.dragStart(firstMedia.parentElement, { dataTransfer });
  expect(dataTransfer.setDragImage).toHaveBeenCalledWith(
    firstMedia.parentElement,
    expect.any(Number),
    expect.any(Number)
  );
  expect(dataTransfer.effectAllowed).toBe('move');
  expect(firstMedia).toHaveStyle({ cursor: 'grabbing' });
  fireEvent.dragOver(secondMedia, { dataTransfer });
  expect(dataTransfer.dropEffect).toBe('move');
  fireEvent.drop(secondMedia, { dataTransfer });

  expect(
    within(
      screen.getByRole('button', { name: 'Open image media 1' })
    ).getByRole('img')
  ).toHaveAttribute('src', secondSource);
  expect(
    within(
      screen.getByRole('button', { name: 'Open image media 2' })
    ).getByRole('img')
  ).toHaveAttribute('src', firstSource);

  const secondMediaActions = screen.getByRole('button', {
    name: 'Actions for image media 2',
  });
  expect(secondMediaActions).toBeVisible();
  fireEvent.click(secondMediaActions);
  expect(screen.getByRole('menuitem', { name: 'Crop' })).toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: 'Move earlier' })
  ).not.toHaveAttribute('aria-disabled', 'true');
  expect(
    within(screen.getByRole('menuitem', { name: 'Move earlier' })).getByTestId(
      'ArrowUpwardIcon'
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: 'Move later' })
  ).not.toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();

  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Open image media 2' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('StoryMapMediaEditor: shows a muted first-frame video preview in Gallery', async () => {
  await render(<StoryMapMediaEditor />);

  fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));

  const videoTile = screen.getByRole('button', {
    name: 'Open video media 5',
  });
  const preview = within(videoTile).getByTestId('gallery-video-preview');
  const video = within(preview).getByLabelText('video media');

  Object.defineProperty(video, 'duration', { configurable: true, value: 5 });
  video.pause = jest.fn();
  fireEvent.loadedMetadata(video);
  fireEvent.seeked(video);

  expect(video.muted).toBe(true);
  expect(video).toHaveAttribute('playsinline');
  expect(video).toHaveAttribute('preload', 'metadata');
  expect(video).not.toHaveAttribute('controls');
  expect(video.currentTime).toBe(0.1);
  expect(
    within(preview).getByTestId('PlayCircleOutlinedIcon')
  ).toBeInTheDocument();
});

test('StoryMapMediaEditor: Gallery audio tiles open the viewer without inline playback', async () => {
  await render(<StoryMapMediaEditor />);

  fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));

  const preview = screen.getByTestId('gallery-audio-preview');
  const audioIcon = within(preview).getByTestId('VolumeUpIcon');
  expect(audioIcon).toHaveAttribute('aria-hidden', 'true');
  expect(audioIcon).toHaveStyle({ fontSize: '32px' });
  expect(preview).toHaveStyle({ color: 'var(--story-theme-text)' });
  expect(within(preview).queryByLabelText('audio media')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Open audio media 4' }));
  expect(
    within(screen.getByRole('dialog')).getByLabelText('audio media')
  ).toHaveAttribute('controls');
});

test('StoryMapMediaEditor: uses the production editor for one media item', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: [INITIAL_CHAPTER.mediaItems[0]],
      }}
    />
  );

  expect(screen.queryByText('Media 1 of 1')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Display as carousel' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Display as gallery' })
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Media navigation')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Reorder media')).not.toBeInTheDocument();
  const toolbar = screen.getByRole('toolbar', {
    name: 'Current media actions',
  });
  expect(
    within(toolbar).getByRole('button', { name: 'Crop image media 1' })
  ).toBeInTheDocument();
  expect(
    within(toolbar).queryByRole('button', { name: 'Update Media' })
  ).not.toBeInTheDocument();
  expect(
    within(toolbar).getByRole('button', { name: 'Remove image media 1' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Move .* (earlier|later)/ })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add media' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Update Media' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove image media 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  const upload = screen.getByRole('button', { name: 'Add media' });
  expect(upload).toHaveClass('MuiButton-outlined');
  expect(upload.parentElement).toHaveStyle({
    backgroundColor: 'rgb(210, 237, 247)',
  });
  expect(
    screen.queryByRole('toolbar', { name: 'Current media actions' })
  ).not.toBeInTheDocument();
});

test('StoryMapMediaEditor: uses production actions for one embedded item', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: [INITIAL_CHAPTER.mediaItems[5]],
      }}
    />
  );

  expect(
    screen.queryByRole('button', { name: 'Update Media' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Remove Embedded video 1' })
  ).toBeInTheDocument();
});

test('StoryMapMediaEditor: deleting a failed image and adding a new upload renders it', async () => {
  const { crop, ...image } = INITIAL_CHAPTER.mediaItems[0];
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: [image],
      }}
    />
  );
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('alert')).toHaveTextContent('Media unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Remove image media 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Add media' }));
  const dialog = screen.getByRole('dialog', { name: 'Add media' });
  const dropZone = within(dialog).getByRole('button', {
    name: /Drag files here or choose files/,
  });
  expect(within(dialog).queryByRole('radio')).not.toBeInTheDocument();
  expect(dropZone).toHaveStyle({ borderStyle: 'dashed' });
  expect(
    within(dropZone).getByTestId('CloudUploadOutlinedIcon')
  ).toBeInTheDocument();
  const file = new File(['replacement'], 'replacement.jpg', {
    type: 'image/jpeg',
  });
  await act(async () =>
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      },
    })
  );
  const submit = within(dialog).getByRole('button', { name: 'Add media' });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    'data:image/jpeg;base64,cmVwbGFjZW1lbnQ='
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByTestId('image-fit-preview')).toBeInTheDocument();
});

test('StoryMapMediaEditor: deleting single media and adding a link keeps a single-item collection', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: INITIAL_CHAPTER.mediaItems.slice(0, 1),
      }}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Remove image media 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Add media' }));
  const dialog = screen.getByRole('dialog', { name: 'Add media' });
  const input = within(dialog).getByRole('textbox', {
    name: 'Link to a YouTube or Vimeo video',
  });
  fireEvent.change(input, {
    target: { value: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
  });
  fireEvent.blur(input);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add media' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(
    screen.getByRole('button', { name: 'Expand Embedded video' })
  ).toBeInTheDocument();
  expect(screen.queryByText('Media 1 of 2')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Media navigation')).not.toBeInTheDocument();
});

test('StoryMapMediaEditor: multiple items omit Update Media in carousel and gallery actions', async () => {
  await render(<StoryMapMediaEditor />);
  expect(
    screen.queryByRole('button', { name: 'Update Media' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Actions for image media 1' })
  );
  expect(
    screen.queryByRole('menuitem', { name: 'Update Media' })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
});

test('StoryMapMediaEditor: removing the second item keeps the shared layout and adding restores gallery selection', async () => {
  await render(
    <StoryMapMediaEditor
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaPresentation: 'gallery',
        mediaItems: INITIAL_CHAPTER.mediaItems.slice(0, 2),
      }}
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Actions for image media 2' })
  );
  fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(
    screen.getByRole('toolbar', { name: 'Current media actions' })
  ).toBeInTheDocument();
  expect(screen.getByTestId('carousel-viewport')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Update Media' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Display as gallery' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Move .* (earlier|later)/ })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add media' }));
  const dialog = screen.getByRole('dialog', { name: 'Add media' });
  const input = within(dialog).getByRole('textbox', {
    name: 'Link to a YouTube or Vimeo video',
  });
  fireEvent.change(input, {
    target: { value: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
  });
  fireEvent.blur(input);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add media' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(screen.getByTestId('gallery-media-collection')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Update Media' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Display as gallery' })
  ).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByText(/Media \d of 2/)).not.toBeInTheDocument();
});

test('StoryMapMediaEditor: Gallery hides the position counter while Carousel retains it', async () => {
  await render(<StoryMapMediaEditor />);
  expect(screen.getByText('Media 1 of 6')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));
  expect(screen.queryByText(/Media \d of 6/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Display as carousel' }));
  expect(screen.getByText('Media 1 of 6')).toBeInTheDocument();
});

test.each([3, 4, 5])(
  'StoryMapMedia: non-image item %s has a full tinted Carousel stage and Gallery preview',
  async index => {
    const item = INITIAL_CHAPTER.mediaItems[index];
    const background =
      'color-mix(in srgb, var(--story-theme-text) 8%, var(--story-theme-background))';
    const { unmount } = await render(<CarouselPresentation items={[item]} />);
    expect(screen.getByTestId('carousel-viewport')).toHaveStyle({
      backgroundColor: background,
    });
    unmount();
    await render(<GalleryPresentation items={[item]} />);
    const preview = item.type.startsWith('audio')
      ? screen.getByTestId('gallery-audio-preview')
      : screen.getByRole('button', { name: /Open/ });
    expect(preview).toHaveStyle({ backgroundColor: background });
  }
);
