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
        <title>Hatch Honc App</title>
        <Style>{css`
          body {
            font-family: 'Arial', sans-serif;
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
            background-color: hsl(222.2, 70%, 10%);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 500px;
          }
          .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: bold;
          }
          textarea, input[type="radio"] {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid hsl(215, 20.2%, 65.1%);
            border-radius: 4px;
            background-color: hsl(222.2, 84%, 4.9%);
            color: hsl(210, 40%, 98%);
          }
          textarea {
            resize: vertical;
          }
          .radio-group {
            display: flex;
            gap: 1rem;
            margin-top: 0.5rem;
          }
          .radio-option {
            display: flex;
            align-items: center;
          }
          .radio-option input[type="radio"] {
            width: auto;
            margin-right: 0.5rem;
          }
          button {
            background-color: #6D84F7;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.3s ease;
          }
          button:hover {
            background-color: #8FA3FF;
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
