# Unauthenticated routes

To add an unauthenticated route, you need to add the optionalAuth field in the route configuration.

```js
  path('/tools/story-maps/:storyMapId/:slug', UserStoryMap, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'storyMap.breadcrumbs_view',
    optionalAuth: {
      enabled: true,
      topMessage: 'storyMap.optional_auth_top_message',
      bottomMessage: 'storyMap.optional_auth_bottom_message',
    },
  }),
```
**enabled:** is a boolean that enables or disables the unauthenticated route. If it is set to false, the route will be accessible only to logged in users.

**topMessage:** is a string that will be displayed at the top of the route content. See `OptionalAuthTopMessage` component.

**bottomMessage:** is a string that will be displayed at the bottom of the route content. See `OptionalAuthBottomMessage` component.

**isEmbedded:** is a boolean that enables or disables the embedded view of the route. If it is set to true, the header and footer will be hidden.
