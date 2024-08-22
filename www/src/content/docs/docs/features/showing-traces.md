---
title: Showing traced requests
description: Using the Fiberplane Studio
sidebar:
  order: 2
---

Studio comes with a companion client library `@fiberplane/hono-otel` that if used together, can show you not just the response a typical HTTP client would see, but the entire request-to-response cycle traced.

See the [Client Library docs](/docs/components/client-library) for more information on the client library.

### Navigating to the request trace page

Too see requests that have been traced, you can navigate to the "Requests" tab in the Studio UI. This will show you a list of all the requests that have been made to your API. Select the request you want to see the trace for.

Alternatively, when you [make a request](/docs/features/making-requests), you can click "Go to Trace Details" to see the trace for that request.

![Request detail vie](@/assets/fpx-request-details-view.png)

## Summary

At the top of the page, you will see a summary of the trace. It will show either the body of the response if it has been successfully returned, or a list of errors that occurred during the request.

![Request summary or errors](@/assets/fpx-request-details-view-summary.png)

## Timeline

![Request summary or errors](@/assets/fpx-request-details-view-timeline.png)

## Details

![Request summary or errors](@/assets/fpx-request-details-view-details.png)
