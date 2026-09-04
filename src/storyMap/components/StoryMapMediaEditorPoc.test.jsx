import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';

import StoryMapMediaEditorPoc, {
  INITIAL_CHAPTER,
} from 'terraso-web-client/storyMap/components/StoryMapMediaEditorPoc';

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

test('StoryMapMediaEditorPoc: stores image crop settings for the carousel while expansion uses the original image', async () => {
  await render(<StoryMapMediaEditorPoc />);

  expect(screen.getByRole('button', { name: 'Add media' })).toBeInTheDocument();

  const carousel = screen.getByTestId('carousel-viewport');
  const originalImage = within(carousel).getByRole('img', {
    name: 'image media',
  });
  const originalSource = originalImage.getAttribute('src');

  const carouselActions = screen.getByRole('toolbar', {
    name: 'Current media actions',
  });
  expect(carousel.previousElementSibling).toBe(carouselActions);
  fireEvent.click(
    within(carouselActions).getByRole('button', {
      name: 'Crop image media 1',
    })
  );
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

  expect(originalImage).toHaveStyle({ transform: 'scale(2)' });
  expect(screen.getByText('Media 1 of 6')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Expand image media' }));

  expect(
    within(screen.getByRole('dialog')).getByRole('img', {
      name: 'image media',
    })
  ).toHaveAttribute('src', originalSource);
});

test('StoryMapMediaEditorPoc: fits the full image at the computed minimum zoom', async () => {
  await render(<StoryMapMediaEditorPoc />);

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
  fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

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

test('StoryMapMediaEditorPoc: applies saved carousel crops to Gallery tiles', async () => {
  await render(<StoryMapMediaEditorPoc />);

  fireEvent.click(
    within(
      screen.getByRole('toolbar', { name: 'Current media actions' })
    ).getByRole('button', { name: 'Crop image media 1' })
  );
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));
  fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));

  const galleryImage = within(
    screen.getByRole('button', { name: 'Open image media 1' })
  ).getByRole('img', { name: 'image media' });
  expect(galleryImage).toHaveStyle({
    objectPosition: '50% 50%',
    transform: 'scale(2)',
    transformOrigin: '50% 50%',
  });
});

test('StoryMapMediaEditorPoc: fills Gallery tiles behind complete minimum-zoom images', async () => {
  await render(<StoryMapMediaEditorPoc />);

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
  fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));
  fireEvent.click(screen.getByRole('button', { name: 'Display as gallery' }));

  const galleryImage = within(
    screen.getByRole('button', { name: 'Open image media 1' })
  ).getByRole('img', { name: 'image media' });
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

test('StoryMapMediaEditorPoc: provides clear reordering, direct navigation, and confirmed deletion', async () => {
  await render(<StoryMapMediaEditorPoc />);

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
});

test('StoryMapMediaEditorPoc: switches presentation while sharing contextual media actions', async () => {
  await render(<StoryMapMediaEditorPoc />);

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

  expect(screen.getByTestId('gallery-media-grid')).toBeInTheDocument();
  expect(screen.queryByTestId('carousel-viewport')).not.toBeInTheDocument();

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
    screen.getByRole('menuitem', { name: 'Move later' })
  ).not.toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();

  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Open image media 2' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('StoryMapMediaEditorPoc: uses the production editor for one media item', async () => {
  await render(
    <StoryMapMediaEditorPoc
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
  expect(screen.getByRole('button', { name: 'Add media' })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Update Media' })
  ).toBeInTheDocument();
});

test('StoryMapMediaEditorPoc: uses production actions for one embedded item', async () => {
  await render(
    <StoryMapMediaEditorPoc
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: [INITIAL_CHAPTER.mediaItems[5]],
      }}
    />
  );

  expect(
    screen.getByRole('button', { name: 'Update Media' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'storyMap.form_media_delete' })
  ).toBeInTheDocument();
});
