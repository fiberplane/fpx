---
title: Generating Requests with AI - DO NOT REVIEW YET
description: Tutorial on AI request generation features in Studio
---

> **NOTE** DO NOT REVIEW THIS PAGE YET. IT IS STILL UNDER DEVELOPMENT.

Generating sample request data is a common task in api development. It can also be very tedious.

Studio's AI features help you generate request payloads, while accounting for any recent requests you've made to your API.

Let's walk through an example, then we can discuss how it works under the hood, and where it might fall short.

## Enabling Request Autofill

First, we need to enable AI features in Studio. Head on over to the Settings page and find the section "Request Autofill". 

Click on the toggle by "Enable Request Autofill", and then configure the AI provider and model you want to use.

As of writing, Studio supports both OpenAI and Anthropic.

For OpenAI, you can select from the following models:

- GPT-4o
- GPT-4o Mini
- GPT-4 Turbo

For Anthropic, you can choose:

- Claude 3.5 Sonnet
- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku

Once you've selected the provider and model, fill in your API key and click "Save".

The API key is stored locally in your project, and ignored by git by default. (Specifically, it's stored in a local database, which you can find in `.fpxconfig/fpx.db`.)

> TODO: Add a screenshot of the settings page

### Using a different LLM provider

If your LLM provider exposes an OpenAI-compatible API, you can use it with Studio.

You just need to set the base URL in your provider configuration.

This is a way to use a local AI, if you're so inclined! However, in our experiments with running local models, request parameters would often take 10+ seconds to generate, which is not ideal.

## Generating a request

Once you've enabled request autofill, you can generate a request by clicking the Magic Wand icon on the requests page. (Keybinding: `CMD+G`)

> TODO: Add a screenshot of the requests page

This works for POST bodies, query parameters, and headers. It can also fill in path parameters, if you have them in your URL.

### Testing like a QA Engineer

By default, Studio will generate a request that is similar to the most recent requests you've made to your API, and it will try to help you test the happy path.

If you want to change this behavior, click the caret by the magic wand icon, and select "Hostile" underneath "Personas".

> TODO: Add a screenshot of the request generation dropdown

## How it works

The AI generates a request based on the following:

- The most recent requests you've made to your API
- The handler code for the request you're currently working on

If you imported an OpenAPI spec, the AI will also generate requests based on the definitions in the spec.

### What gets sent to the LLM?

- The most recent requests you've made to your API
- The handler code for the request you're currently working on
- The OpenAPI spec, if you imported one
- The request you're currently working on

Certain sensitive headers are redacted by default.

Do not use this feature if you are handling sensitive data, and do not want it to be processed by the LLM provider you chose.