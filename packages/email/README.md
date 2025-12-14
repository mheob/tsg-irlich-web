# @tsg-web/email

Email templates for TSG Irlich using [React Email](https://react.email).

## Getting Started

Run the development server with live preview:

```sh
bun run dev:email
```

Open [localhost:3001](http://localhost:3001) to preview email templates in your browser.

## Available Scripts

| Script      | Description                                       |
| ----------- | ------------------------------------------------- |
| `dev:email` | Start the React Email preview server on port 3001 |
| `build`     | Build email templates                             |
| `export`    | Export email templates                            |

## Creating New Templates

1. Create a new `.tsx` file in the `emails/` directory
2. Use components from `@react-email/components`
3. Preview your template at [localhost:3001](http://localhost:3001)

## Dependencies

- `@react-email/components` - React Email component library
- `@tsgi-web/shared` - Shared utilities and components (TSGLogo, etc.)
