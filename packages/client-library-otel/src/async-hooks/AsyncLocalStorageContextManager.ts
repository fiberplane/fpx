/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { type Context, ROOT_CONTEXT } from "@opentelemetry/api";
import { AbstractAsyncHooksContextManager } from "./AbstractAsyncHooksContextManager";

export class AsyncLocalStorageContextManager extends AbstractAsyncHooksContextManager {
  private _asyncLocalStorage: AsyncLocalStorage<Context>;

  constructor() {
    super();
    this._asyncLocalStorage = new AsyncLocalStorage();
  }

  active(): Context {
    return this._asyncLocalStorage.getStore() ?? ROOT_CONTEXT;
  }

  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    context: Context,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F> {
    const cb = thisArg == null ? fn : fn.bind(thisArg);
    return this._asyncLocalStorage.run(context, cb as never, ...args);
  }

  enable(): this {
    return this;
  }

  disable(): this {
    this._asyncLocalStorage.disable();
    return this;
  }
}
