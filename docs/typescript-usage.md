# TypeScript Usage Guidelines

This is a mixed JS/TS repo. Choose whether to use TypeScript or JavaScript when making changes according to the following guidelines:

Any further TypeScript migration should wait until we have more comprehensive E2E/integration tests, and then be done on a case-by-case basis, in tandem with other feature work, using the following process:

1. **If** TS migration could be helpful for the feature work, migrate relevant code to TS _without_ implementing any new features.
2. Validate and merge that change.
3. Then implement new features by modifying the existing TS code that we are confident in.

New code which does not depend on any existing JavaScript code should feel free to use TypeScript.
