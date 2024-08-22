---
title: Webhooks
description: Tutorial on webhooks in studio
---

Fiberplane Studio enhances developer workflows with webhooks. Unlike an API where your application code sends out requests, a webhook triggers a call to your application when certain events occur in a third-party application. To receive these events, your application must provide an endpoint that the third-party webhook can call.

## Expose Your Local Environment Using Studio
Within the Studio settings, you can proxy requests from a public URL to your locally running application. Enable the public URL in Studio’s settings. In the top right corner, you'll see a green box indicating "Public URL active." You can copy the address from there.

## Provide the Publicly Generated Address as the Webhook URL
Use the copied address as the webhook URL that will call your local application. Be sure to append the correct routes to the end of the address.

## Trigger the Webhook
To view the webhook's payload, trigger the webhook event from the third-party application. Within Studio, you can observe the incoming request from the webhook under the "Requests" tab. When selected, you can view the full trace in the request details, where a "proxied" label will be displayed.

## Replay the Webhook Event from Studio
Once you've created the webhook event and captured its payload, you can replay it from Studio to further test and develop your application.