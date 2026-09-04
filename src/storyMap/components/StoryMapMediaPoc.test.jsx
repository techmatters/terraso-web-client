import {
  fireEvent,
  render,
  screen,
  within,
} from 'terraso-web-client/tests/utils';

import StoryMapMediaPoc from 'terraso-web-client/storyMap/components/StoryMapMediaPoc';

jest.mock('terraso-web-client/storyMap/components/StoryMap', () => ({
  __esModule: true,
  default: ({ config, ChapterComponent }) => (
    <div
      data-media-items={JSON.stringify(config.chapters[0].mediaItems)}
      data-testid="story-map"
      data-theme-id={config.themeId}
    >
      {config.chapters.map(chapter =>
        ChapterComponent ? (
          <ChapterComponent active key={chapter.id} record={chapter} />
        ) : (
          <span key={chapter.id}>{chapter.title}</span>
        )
      )}
    </div>
  ),
}));

test('StoryMapMediaPoc: compares five media presentation options in one Story Map', async () => {
  await render(<StoryMapMediaPoc />);

  expect(screen.getByTestId('story-map')).toHaveAttribute(
    'data-theme-id',
    'theme-7'
  );
  expect(screen.getByText('Gallery')).toBeInTheDocument();
  expect(screen.getByText('Carousel')).toBeInTheDocument();
  expect(screen.getByText('Thumbnail Carousel')).toBeInTheDocument();
  expect(screen.getByText('Editorial Stack')).toBeInTheDocument();
  expect(screen.getByText('Inline Editorial')).toBeInTheDocument();
});

test('StoryMapMediaPoc: uses the supported chapter media payload shape', async () => {
  await render(<StoryMapMediaPoc />);

  const mediaItems = JSON.parse(
    screen.getByTestId('story-map').getAttribute('data-media-items')
  );

  expect(mediaItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        signedUrl: expect.any(String),
        type: 'image/jpeg',
      }),
      expect.objectContaining({
        signedUrl: expect.any(String),
        type: 'audio/mpeg',
      }),
      expect.objectContaining({
        signedUrl: expect.any(String),
        type: 'video/mp4',
      }),
      expect.objectContaining({
        source: 'youtube',
        type: 'embedded',
        url: expect.any(String),
      }),
    ])
  );
  expect(mediaItems).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ title: expect.anything() }),
    ])
  );
});

test('StoryMapMediaPoc: selects a media item from Thumbnail Carousel previews', async () => {
  await render(<StoryMapMediaPoc />);

  const carousel = screen.getByRole('region', {
    name: 'Chapter: Thumbnail Carousel',
  });
  const viewport = within(carousel).getByTestId('thumbnail-carousel-viewport');

  expect(
    within(carousel).getByTestId('thumbnail-carousel-preview-strip')
  ).toBeInTheDocument();
  expect(
    within(carousel).getByRole('button', { name: 'Previous previews' })
  ).toBeInTheDocument();
  expect(
    within(carousel).getByRole('button', { name: 'Next previews' })
  ).toBeInTheDocument();
  expect(
    within(viewport).getByRole('img', { name: 'image media' })
  ).toBeInTheDocument();

  fireEvent.click(
    within(carousel).getByRole('button', { name: 'Show video media 5' })
  );

  expect(within(viewport).getByLabelText('video media')).toBeInTheDocument();
});

test('StoryMapMediaPoc: interleaves rich text and media in Inline Editorial', async () => {
  await render(<StoryMapMediaPoc />);

  const chapter = screen.getByRole('region', {
    name: 'Chapter: Inline Editorial',
  });
  const sequence = Array.from(
    chapter.querySelectorAll('h4, img, audio, video')
  );

  expect(sequence.map(element => element.tagName)).toEqual([
    'H4',
    'IMG',
    'H4',
    'AUDIO',
    'H4',
    'VIDEO',
  ]);
});

test('StoryMapMediaPoc: lets editorial media use the full story column', async () => {
  await render(<StoryMapMediaPoc />);

  for (const title of ['Editorial Stack', 'Inline Editorial']) {
    const chapter = screen.getByRole('region', { name: `Chapter: ${title}` });
    within(chapter)
      .getAllByRole('img', { name: 'image media' })
      .forEach(image => {
        expect(image).toHaveStyle({ maxHeight: 'none', width: '100%' });
      });
  }
});

test('StoryMapMediaPoc: renders rich chapter content with every media option', async () => {
  await render(<StoryMapMediaPoc />);

  for (const title of ['Gallery', 'Carousel', 'Editorial Stack']) {
    const chapter = screen.getByRole('region', { name: `Chapter: ${title}` });
    expect(
      within(chapter).getByRole('heading', {
        name: 'Chapter context',
        level: 4,
      })
    ).toBeInTheDocument();
    expect(
      within(chapter).getByText('Participatory mapping')
    ).toBeInTheDocument();
    expect(
      within(chapter).getByRole('link', { name: /Learn more/ })
    ).toBeInTheDocument();
  }
});

test('StoryMapMediaPoc: uses a scan-first grid and stable carousel viewport', async () => {
  await render(<StoryMapMediaPoc />);

  const gallery = screen.getByRole('region', { name: 'Chapter: Gallery' });
  expect(within(gallery).getByTestId('gallery-media-grid')).toBeInTheDocument();

  const carousel = screen.getByRole('region', { name: 'Chapter: Carousel' });
  const viewport = within(carousel).getByTestId('carousel-viewport');
  expect(
    within(carousel).getByRole('img', { name: 'image media' })
  ).toBeInTheDocument();

  fireEvent.click(within(carousel).getByRole('button', { name: 'Next media' }));

  expect(viewport).toBeInTheDocument();
  expect(
    within(carousel).getByRole('img', { name: 'image media' })
  ).toBeInTheDocument();
});

test('StoryMapMediaPoc: compares contained and full-bleed fixed media frames', async () => {
  await render(<StoryMapMediaPoc />);

  const gallery = screen.getByRole('region', { name: 'Chapter: Gallery' });
  const galleryImages = within(gallery).getAllByRole('img', {
    name: 'image media',
  });

  expect(galleryImages).toHaveLength(3);
  expect(galleryImages[0]).toHaveStyle({ objectFit: 'cover' });
  expect(galleryImages[1]).toHaveStyle({ objectFit: 'cover' });

  const carousel = screen.getByRole('region', { name: 'Chapter: Carousel' });
  expect(
    within(carousel).getByTestId('carousel-viewport').querySelector('img')
  ).toHaveStyle({ objectFit: 'cover' });

  const thumbnailCarousel = screen.getByRole('region', {
    name: 'Chapter: Thumbnail Carousel',
  });
  expect(
    within(thumbnailCarousel)
      .getByTestId('thumbnail-carousel-viewport')
      .querySelector('img')
  ).toHaveStyle({ objectFit: 'cover' });
});

test('StoryMapMediaPoc: fills a saved full-fit portrait crop with a blurred source image', async () => {
  await render(<StoryMapMediaPoc />);

  const carousel = screen.getByRole('region', { name: 'Chapter: Carousel' });
  const viewport = within(carousel).getByTestId('carousel-viewport');

  fireEvent.click(within(carousel).getByRole('button', { name: 'Next media' }));
  fireEvent.click(within(carousel).getByRole('button', { name: 'Next media' }));

  const portraitImage = within(viewport).getByRole('img', {
    name: 'image media',
  });
  Object.defineProperties(portraitImage, {
    naturalHeight: { value: 1200 },
    naturalWidth: { value: 900 },
  });
  fireEvent.load(portraitImage);

  expect(
    within(viewport).getByRole('img', { name: 'image media' })
  ).toHaveStyle({ objectFit: 'contain' });
  expect(viewport.querySelector('div')).toHaveStyle({
    position: 'relative',
  });
});

test('StoryMapMediaPoc: expands the active Carousel media from its main stage', async () => {
  await render(<StoryMapMediaPoc />);

  const carousel = screen.getByRole('region', { name: 'Chapter: Carousel' });
  fireEvent.click(
    within(carousel).getByRole('button', { name: 'Expand image media' })
  );

  expect(
    screen.getByRole('dialog', { name: 'image media' })
  ).toBeInTheDocument();
});

test('StoryMapMediaPoc: expands the active Thumbnail Carousel media', async () => {
  await render(<StoryMapMediaPoc />);

  const carousel = screen.getByRole('region', {
    name: 'Chapter: Thumbnail Carousel',
  });
  fireEvent.click(
    within(carousel).getByRole('button', { name: 'Expand image media' })
  );

  expect(
    screen.getByRole('dialog', { name: 'image media' })
  ).toBeInTheDocument();
});

test('StoryMapMediaPoc: opens full media controls from a gallery preview', async () => {
  await render(<StoryMapMediaPoc />);

  const gallery = screen.getByRole('region', { name: 'Chapter: Gallery' });
  fireEvent.click(
    within(gallery).getByRole('button', { name: 'Open audio media 4' })
  );

  expect(
    screen.getByRole('dialog', { name: 'audio media' })
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole('dialog', { name: 'audio media' })).getByLabelText(
      'audio media'
    )
  ).toBeInTheDocument();
  expect(screen.getByTestId('gallery-media-viewer-header')).toContainElement(
    screen.getByRole('button', { name: 'Close media viewer' })
  );
});
