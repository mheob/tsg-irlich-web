# @tsg-web/email

Email templates for TSG Irlich using [React Email](https://react.email).

## Getting Started

Run the development server with live preview:

```sh
pnpm run dev:email
```

Open [localhost:3001](http://localhost:3001) to preview email templates in your browser.

## Available Scripts

| Script              | Description                                       |
| ------------------- | ------------------------------------------------- |
| `dev:email`         | Start the React Email preview server on port 3001 |
| `build`             | Build email templates                             |
| `build:preview`     | Build the preview mailing                         |
| `build:cleverreach` | Build the CleverReach template                    |
| `export`            | Export email templates                            |
| `lint`              | Run oxlint                                        |
| `lint:fix`          | Run oxlint with auto-fix                          |
| `test`              | Run the unit tests once with Vitest               |
| `test:watch`        | Run the unit tests in watch mode                  |
| `test:coverage`     | Run the unit tests with coverage                  |

## Creating New Templates

1. Create a new `.tsx` file in the `emails/` directory
2. Use components from `@react-email/components`
3. Preview your template at [localhost:3001](http://localhost:3001)

## Dependencies

- `@react-email/components` - React Email component library
- `@tsgi-web/shared` - Shared utilities and components (TSGLogo, etc.)
