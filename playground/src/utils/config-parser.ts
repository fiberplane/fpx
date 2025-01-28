/**
 * Parses the embedded config from the root element of the DOM.
 *
 * The config should be serialized into the DOM as a data attribute.
 */
export function parseEmbeddedConfig(rootElement: HTMLElement) {
  const { mountedPath, openapi, fpxEndpoint } = JSON.parse(
    rootElement.dataset.options as string,
  ) as {
    mountedPath: string;
    openapi?: {
      url?: string;
      content?: string;
    };
    fpxEndpoint?: string;
  };

  let fpxEndpointHost: string | undefined = undefined;
  if (fpxEndpoint) {
    const url = new URL(fpxEndpoint);
    fpxEndpointHost = url.origin;
  }

  return {
    mountedPath,
    openapi,
    fpxEndpointHost,
  };
}
