# Anonymous routes

To add an anonymous route, you need to add the optionalAuth field in the route configuration.

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
**enabled:** is a boolean that enables or disables the anonymous route. If it is set to false, the route will be accessible only to logged in users.

**topMessage:** is a string that will be displayed at the top of the route content. See `OptionalAuthTopMessage` component.

**bottomMessage:** is a string that will be displayed at the bottom of the route content. See `OptionalAuthBottomMessage` component.