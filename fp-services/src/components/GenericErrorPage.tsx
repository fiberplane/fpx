import { Layout } from "./Layout";

type ErrorPageProps = {
  statusCode: number;
  message: string;
};

export const GenericErrorPage = ({ statusCode, message }: ErrorPageProps) => {
  return (
    <Layout>
      <div className="container">
        <div className="status error">Error {statusCode}</div>
        <p>{message}</p>
        <p className="subtle">
          If this feels like a bug, file an issue on{" "}
          <a href="https://github.com/fiberplane/fpx/issues">GitHub</a>
        </p>
      </div>
    </Layout>
  );
};
