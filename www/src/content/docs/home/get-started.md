---
title: FPX Documentation
description: entry point for the fpx docs site
---

FPX is a local debugging companion designed to help you to build and explore your [Hono](https://www.hono.dev) APIs. 

## Get started
### 1. Setup a Hono project
You can set up a basic Hono project via your terminal:
```
 npm create hono@latest my-app 
 ```


If you want a project including an ORM, a database and already has a cloud deployment platform in mind we recommend using [HONC](https://honc.dev/):

```
create honc-app@latest 
```

### 2. Add FPX middleware
Install the fpx middleware
```sh
npm i @fiberplane/hono-otel
```

Add the fpx middleware to the `index.ts` of your Hono project

```typescript
import { Hono } from 'hono'
import { instrument } from '@fiberplane/hono-otel';

const app = new Hono<{ Bindings: Bindings }>()


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default instrument(app)
```

start your application

### 3. Launch FPX
in a new terminal next to your application start fpx:
```sh
npx @fiberplane/studio
```
