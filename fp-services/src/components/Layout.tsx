import { Style, css } from "hono/css";

// NOTE - I could not figure out the proper type for `children` on a JSX element.
//        (Hono docs uses `any` for `children`)
//
// biome-ignore lint/suspicious/noExplicitAny: Getting children properly typed is a pain
export const Layout = ({ children }: { children: any }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Fiberplane Studio Auth</title>
        <Style>{css`
          body {
            font-family: sans-serif;
            color: hsl(210, 40%, 98%);
            background-color: hsl(222.2, 84%, 4.9%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          a {
            color: #6D84F7;
            text-decoration: none;
            transition: color 0.3s ease;
          }
          a:hover {
            color: #8FA3FF;
            text-decoration: underline;
          }
          .container {
            background-color: hsl(222.2, 84%, 4.9%);
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 10%;
          }
          .hidden {
            display: none;
          }
          .loading {
            font-family: sans-serif;
            color: hsl(215, 20.2%, 65.1%);
          }
          .success {
            font-family: sans-serif;
            color: #6D84F7;
          }
          .error {
            font-family: sans-serif;
            color: #FF5E87;
          }
          .status {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .subtle {
            color: hsl(207, 9.9%, 78.2%);
          }
          .hidden {
            display: none;
          }
        `}</Style>
      </head>
      <body>{children}</body>
    </html>
  );
};
