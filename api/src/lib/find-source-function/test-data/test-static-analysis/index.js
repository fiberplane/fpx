var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except2, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except2)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// .wrangler/tmp/bundle-OrDozK/checked-fetch.js
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
var urls;
var init_checked_fetch = __esm({
  ".wrangler/tmp/bundle-OrDozK/checked-fetch.js"() {
    "use strict";
    urls = /* @__PURE__ */ new Set();
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_checked_fetch();
    init_modules_watch_stub();
  }
});

// ../../node_modules/.pnpm/wrangler@3.78.5_@cloudflare+workers-types@4.20240924.0/node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "../../node_modules/.pnpm/wrangler@3.78.5_@cloudflare+workers-types@4.20240924.0/node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/browser/globalThis.js
var require_globalThis = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/browser/globalThis.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports._globalThis = void 0;
    exports._globalThis = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/browser/index.js
var require_browser = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/browser/index.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
          __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_globalThis(), exports);
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/version.js
var require_version = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/version.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VERSION = void 0;
    exports.VERSION = "1.9.0";
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/semver.js
var require_semver = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/semver.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCompatible = exports._makeCompatibilityCheck = void 0;
    var version_1 = require_version();
    var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
    function _makeCompatibilityCheck(ownVersion) {
      const acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
      const rejectedVersions = /* @__PURE__ */ new Set();
      const myVersionMatch = ownVersion.match(re);
      if (!myVersionMatch) {
        return () => false;
      }
      const ownVersionParsed = {
        major: +myVersionMatch[1],
        minor: +myVersionMatch[2],
        patch: +myVersionMatch[3],
        prerelease: myVersionMatch[4]
      };
      if (ownVersionParsed.prerelease != null) {
        return function isExactmatch(globalVersion) {
          return globalVersion === ownVersion;
        };
      }
      function _reject(v) {
        rejectedVersions.add(v);
        return false;
      }
      function _accept(v) {
        acceptedVersions.add(v);
        return true;
      }
      return function isCompatible(globalVersion) {
        if (acceptedVersions.has(globalVersion)) {
          return true;
        }
        if (rejectedVersions.has(globalVersion)) {
          return false;
        }
        const globalVersionMatch = globalVersion.match(re);
        if (!globalVersionMatch) {
          return _reject(globalVersion);
        }
        const globalVersionParsed = {
          major: +globalVersionMatch[1],
          minor: +globalVersionMatch[2],
          patch: +globalVersionMatch[3],
          prerelease: globalVersionMatch[4]
        };
        if (globalVersionParsed.prerelease != null) {
          return _reject(globalVersion);
        }
        if (ownVersionParsed.major !== globalVersionParsed.major) {
          return _reject(globalVersion);
        }
        if (ownVersionParsed.major === 0) {
          if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
            return _accept(globalVersion);
          }
          return _reject(globalVersion);
        }
        if (ownVersionParsed.minor <= globalVersionParsed.minor) {
          return _accept(globalVersion);
        }
        return _reject(globalVersion);
      };
    }
    exports._makeCompatibilityCheck = _makeCompatibilityCheck;
    exports.isCompatible = _makeCompatibilityCheck(version_1.VERSION);
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/global-utils.js
var require_global_utils = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/global-utils.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.unregisterGlobal = exports.getGlobal = exports.registerGlobal = void 0;
    var platform_1 = require_browser();
    var version_1 = require_version();
    var semver_1 = require_semver();
    var major = version_1.VERSION.split(".")[0];
    var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
    var _global = platform_1._globalThis;
    function registerGlobal(type, instance, diag14, allowOverride = false) {
      var _a91;
      const api2 = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a91 = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a91 !== void 0 ? _a91 : {
        version: version_1.VERSION
      };
      if (!allowOverride && api2[type]) {
        const err = new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
        diag14.error(err.stack || err.message);
        return false;
      }
      if (api2.version !== version_1.VERSION) {
        const err = new Error(`@opentelemetry/api: Registration of version v${api2.version} for ${type} does not match previously registered API v${version_1.VERSION}`);
        diag14.error(err.stack || err.message);
        return false;
      }
      api2[type] = instance;
      diag14.debug(`@opentelemetry/api: Registered a global for ${type} v${version_1.VERSION}.`);
      return true;
    }
    exports.registerGlobal = registerGlobal;
    function getGlobal(type) {
      var _a91, _b;
      const globalVersion = (_a91 = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a91 === void 0 ? void 0 : _a91.version;
      if (!globalVersion || !(0, semver_1.isCompatible)(globalVersion)) {
        return;
      }
      return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
    }
    exports.getGlobal = getGlobal;
    function unregisterGlobal(type, diag14) {
      diag14.debug(`@opentelemetry/api: Unregistering a global for ${type} v${version_1.VERSION}.`);
      const api2 = _global[GLOBAL_OPENTELEMETRY_API_KEY];
      if (api2) {
        delete api2[type];
      }
    }
    exports.unregisterGlobal = unregisterGlobal;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/ComponentLogger.js
var require_ComponentLogger = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/ComponentLogger.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagComponentLogger = void 0;
    var global_utils_1 = require_global_utils();
    var DiagComponentLogger = class {
      constructor(props) {
        this._namespace = props.namespace || "DiagComponentLogger";
      }
      debug(...args) {
        return logProxy("debug", this._namespace, args);
      }
      error(...args) {
        return logProxy("error", this._namespace, args);
      }
      info(...args) {
        return logProxy("info", this._namespace, args);
      }
      warn(...args) {
        return logProxy("warn", this._namespace, args);
      }
      verbose(...args) {
        return logProxy("verbose", this._namespace, args);
      }
    };
    exports.DiagComponentLogger = DiagComponentLogger;
    function logProxy(funcName, namespace, args) {
      const logger = (0, global_utils_1.getGlobal)("diag");
      if (!logger) {
        return;
      }
      args.unshift(namespace);
      return logger[funcName](...args);
    }
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/types.js
var require_types = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/types.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagLogLevel = void 0;
    var DiagLogLevel2;
    (function(DiagLogLevel3) {
      DiagLogLevel3[DiagLogLevel3["NONE"] = 0] = "NONE";
      DiagLogLevel3[DiagLogLevel3["ERROR"] = 30] = "ERROR";
      DiagLogLevel3[DiagLogLevel3["WARN"] = 50] = "WARN";
      DiagLogLevel3[DiagLogLevel3["INFO"] = 60] = "INFO";
      DiagLogLevel3[DiagLogLevel3["DEBUG"] = 70] = "DEBUG";
      DiagLogLevel3[DiagLogLevel3["VERBOSE"] = 80] = "VERBOSE";
      DiagLogLevel3[DiagLogLevel3["ALL"] = 9999] = "ALL";
    })(DiagLogLevel2 = exports.DiagLogLevel || (exports.DiagLogLevel = {}));
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/internal/logLevelLogger.js
var require_logLevelLogger = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/internal/logLevelLogger.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createLogLevelDiagLogger = void 0;
    var types_1 = require_types();
    function createLogLevelDiagLogger(maxLevel, logger) {
      if (maxLevel < types_1.DiagLogLevel.NONE) {
        maxLevel = types_1.DiagLogLevel.NONE;
      } else if (maxLevel > types_1.DiagLogLevel.ALL) {
        maxLevel = types_1.DiagLogLevel.ALL;
      }
      logger = logger || {};
      function _filterFunc(funcName, theLevel) {
        const theFunc = logger[funcName];
        if (typeof theFunc === "function" && maxLevel >= theLevel) {
          return theFunc.bind(logger);
        }
        return function() {
        };
      }
      return {
        error: _filterFunc("error", types_1.DiagLogLevel.ERROR),
        warn: _filterFunc("warn", types_1.DiagLogLevel.WARN),
        info: _filterFunc("info", types_1.DiagLogLevel.INFO),
        debug: _filterFunc("debug", types_1.DiagLogLevel.DEBUG),
        verbose: _filterFunc("verbose", types_1.DiagLogLevel.VERBOSE)
      };
    }
    exports.createLogLevelDiagLogger = createLogLevelDiagLogger;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/diag.js
var require_diag = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/diag.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagAPI = void 0;
    var ComponentLogger_1 = require_ComponentLogger();
    var logLevelLogger_1 = require_logLevelLogger();
    var types_1 = require_types();
    var global_utils_1 = require_global_utils();
    var API_NAME = "diag";
    var DiagAPI = class {
      /**
       * Private internal constructor
       * @private
       */
      constructor() {
        function _logProxy(funcName) {
          return function(...args) {
            const logger = (0, global_utils_1.getGlobal)("diag");
            if (!logger)
              return;
            return logger[funcName](...args);
          };
        }
        const self2 = this;
        const setLogger = (logger, optionsOrLogLevel = { logLevel: types_1.DiagLogLevel.INFO }) => {
          var _a91, _b, _c;
          if (logger === self2) {
            const err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
            self2.error((_a91 = err.stack) !== null && _a91 !== void 0 ? _a91 : err.message);
            return false;
          }
          if (typeof optionsOrLogLevel === "number") {
            optionsOrLogLevel = {
              logLevel: optionsOrLogLevel
            };
          }
          const oldLogger = (0, global_utils_1.getGlobal)("diag");
          const newLogger = (0, logLevelLogger_1.createLogLevelDiagLogger)((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : types_1.DiagLogLevel.INFO, logger);
          if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
            const stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
            oldLogger.warn(`Current logger will be overwritten from ${stack}`);
            newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
          }
          return (0, global_utils_1.registerGlobal)("diag", newLogger, self2, true);
        };
        self2.setLogger = setLogger;
        self2.disable = () => {
          (0, global_utils_1.unregisterGlobal)(API_NAME, self2);
        };
        self2.createComponentLogger = (options) => {
          return new ComponentLogger_1.DiagComponentLogger(options);
        };
        self2.verbose = _logProxy("verbose");
        self2.debug = _logProxy("debug");
        self2.info = _logProxy("info");
        self2.warn = _logProxy("warn");
        self2.error = _logProxy("error");
      }
      /** Get the singleton instance of the DiagAPI API */
      static instance() {
        if (!this._instance) {
          this._instance = new DiagAPI();
        }
        return this._instance;
      }
    };
    exports.DiagAPI = DiagAPI;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/baggage-impl.js
var require_baggage_impl = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/baggage-impl.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaggageImpl = void 0;
    var BaggageImpl = class {
      constructor(entries) {
        this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
      }
      getEntry(key) {
        const entry = this._entries.get(key);
        if (!entry) {
          return void 0;
        }
        return Object.assign({}, entry);
      }
      getAllEntries() {
        return Array.from(this._entries.entries()).map(([k, v]) => [k, v]);
      }
      setEntry(key, entry) {
        const newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.set(key, entry);
        return newBaggage;
      }
      removeEntry(key) {
        const newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.delete(key);
        return newBaggage;
      }
      removeEntries(...keys) {
        const newBaggage = new BaggageImpl(this._entries);
        for (const key of keys) {
          newBaggage._entries.delete(key);
        }
        return newBaggage;
      }
      clear() {
        return new BaggageImpl();
      }
    };
    exports.BaggageImpl = BaggageImpl;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/symbol.js
var require_symbol = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/symbol.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.baggageEntryMetadataSymbol = void 0;
    exports.baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/utils.js
var require_utils = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/utils.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.baggageEntryMetadataFromString = exports.createBaggage = void 0;
    var diag_1 = require_diag();
    var baggage_impl_1 = require_baggage_impl();
    var symbol_1 = require_symbol();
    var diag14 = diag_1.DiagAPI.instance();
    function createBaggage(entries = {}) {
      return new baggage_impl_1.BaggageImpl(new Map(Object.entries(entries)));
    }
    exports.createBaggage = createBaggage;
    function baggageEntryMetadataFromString2(str) {
      if (typeof str !== "string") {
        diag14.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
        str = "";
      }
      return {
        __TYPE__: symbol_1.baggageEntryMetadataSymbol,
        toString() {
          return str;
        }
      };
    }
    exports.baggageEntryMetadataFromString = baggageEntryMetadataFromString2;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/context.js
var require_context = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/context.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ROOT_CONTEXT = exports.createContextKey = void 0;
    function createContextKey2(description) {
      return Symbol.for(description);
    }
    exports.createContextKey = createContextKey2;
    var BaseContext = class {
      /**
       * Construct a new context which inherits values from an optional parent context.
       *
       * @param parentContext a context from which to inherit values
       */
      constructor(parentContext) {
        const self2 = this;
        self2._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
        self2.getValue = (key) => self2._currentContext.get(key);
        self2.setValue = (key, value) => {
          const context8 = new BaseContext(self2._currentContext);
          context8._currentContext.set(key, value);
          return context8;
        };
        self2.deleteValue = (key) => {
          const context8 = new BaseContext(self2._currentContext);
          context8._currentContext.delete(key);
          return context8;
        };
      }
    };
    exports.ROOT_CONTEXT = new BaseContext();
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/consoleLogger.js
var require_consoleLogger = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/consoleLogger.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagConsoleLogger = void 0;
    var consoleMap = [
      { n: "error", c: "error" },
      { n: "warn", c: "warn" },
      { n: "info", c: "info" },
      { n: "debug", c: "debug" },
      { n: "verbose", c: "trace" }
    ];
    var DiagConsoleLogger = class {
      constructor() {
        function _consoleFunc(funcName) {
          return function(...args) {
            if (console) {
              let theFunc = console[funcName];
              if (typeof theFunc !== "function") {
                theFunc = console.log;
              }
              if (typeof theFunc === "function") {
                return theFunc.apply(console, args);
              }
            }
          };
        }
        for (let i = 0; i < consoleMap.length; i++) {
          this[consoleMap[i].n] = _consoleFunc(consoleMap[i].c);
        }
      }
    };
    exports.DiagConsoleLogger = DiagConsoleLogger;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeter.js
var require_NoopMeter = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeter.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createNoopMeter = exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = exports.NOOP_OBSERVABLE_GAUGE_METRIC = exports.NOOP_OBSERVABLE_COUNTER_METRIC = exports.NOOP_UP_DOWN_COUNTER_METRIC = exports.NOOP_HISTOGRAM_METRIC = exports.NOOP_GAUGE_METRIC = exports.NOOP_COUNTER_METRIC = exports.NOOP_METER = exports.NoopObservableUpDownCounterMetric = exports.NoopObservableGaugeMetric = exports.NoopObservableCounterMetric = exports.NoopObservableMetric = exports.NoopHistogramMetric = exports.NoopGaugeMetric = exports.NoopUpDownCounterMetric = exports.NoopCounterMetric = exports.NoopMetric = exports.NoopMeter = void 0;
    var NoopMeter = class {
      constructor() {
      }
      /**
       * @see {@link Meter.createGauge}
       */
      createGauge(_name, _options) {
        return exports.NOOP_GAUGE_METRIC;
      }
      /**
       * @see {@link Meter.createHistogram}
       */
      createHistogram(_name, _options) {
        return exports.NOOP_HISTOGRAM_METRIC;
      }
      /**
       * @see {@link Meter.createCounter}
       */
      createCounter(_name, _options) {
        return exports.NOOP_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createUpDownCounter}
       */
      createUpDownCounter(_name, _options) {
        return exports.NOOP_UP_DOWN_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createObservableGauge}
       */
      createObservableGauge(_name, _options) {
        return exports.NOOP_OBSERVABLE_GAUGE_METRIC;
      }
      /**
       * @see {@link Meter.createObservableCounter}
       */
      createObservableCounter(_name, _options) {
        return exports.NOOP_OBSERVABLE_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createObservableUpDownCounter}
       */
      createObservableUpDownCounter(_name, _options) {
        return exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.addBatchObservableCallback}
       */
      addBatchObservableCallback(_callback, _observables) {
      }
      /**
       * @see {@link Meter.removeBatchObservableCallback}
       */
      removeBatchObservableCallback(_callback) {
      }
    };
    exports.NoopMeter = NoopMeter;
    var NoopMetric = class {
    };
    exports.NoopMetric = NoopMetric;
    var NoopCounterMetric = class extends NoopMetric {
      add(_value, _attributes) {
      }
    };
    exports.NoopCounterMetric = NoopCounterMetric;
    var NoopUpDownCounterMetric = class extends NoopMetric {
      add(_value, _attributes) {
      }
    };
    exports.NoopUpDownCounterMetric = NoopUpDownCounterMetric;
    var NoopGaugeMetric = class extends NoopMetric {
      record(_value, _attributes) {
      }
    };
    exports.NoopGaugeMetric = NoopGaugeMetric;
    var NoopHistogramMetric = class extends NoopMetric {
      record(_value, _attributes) {
      }
    };
    exports.NoopHistogramMetric = NoopHistogramMetric;
    var NoopObservableMetric = class {
      addCallback(_callback) {
      }
      removeCallback(_callback) {
      }
    };
    exports.NoopObservableMetric = NoopObservableMetric;
    var NoopObservableCounterMetric = class extends NoopObservableMetric {
    };
    exports.NoopObservableCounterMetric = NoopObservableCounterMetric;
    var NoopObservableGaugeMetric = class extends NoopObservableMetric {
    };
    exports.NoopObservableGaugeMetric = NoopObservableGaugeMetric;
    var NoopObservableUpDownCounterMetric = class extends NoopObservableMetric {
    };
    exports.NoopObservableUpDownCounterMetric = NoopObservableUpDownCounterMetric;
    exports.NOOP_METER = new NoopMeter();
    exports.NOOP_COUNTER_METRIC = new NoopCounterMetric();
    exports.NOOP_GAUGE_METRIC = new NoopGaugeMetric();
    exports.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
    exports.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
    exports.NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
    exports.NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
    exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
    function createNoopMeter() {
      return exports.NOOP_METER;
    }
    exports.createNoopMeter = createNoopMeter;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/Metric.js
var require_Metric = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/Metric.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueType = void 0;
    var ValueType;
    (function(ValueType2) {
      ValueType2[ValueType2["INT"] = 0] = "INT";
      ValueType2[ValueType2["DOUBLE"] = 1] = "DOUBLE";
    })(ValueType = exports.ValueType || (exports.ValueType = {}));
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/TextMapPropagator.js
var require_TextMapPropagator = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/TextMapPropagator.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultTextMapSetter = exports.defaultTextMapGetter = void 0;
    exports.defaultTextMapGetter = {
      get(carrier, key) {
        if (carrier == null) {
          return void 0;
        }
        return carrier[key];
      },
      keys(carrier) {
        if (carrier == null) {
          return [];
        }
        return Object.keys(carrier);
      }
    };
    exports.defaultTextMapSetter = {
      set(carrier, key, value) {
        if (carrier == null) {
          return;
        }
        carrier[key] = value;
      }
    };
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/NoopContextManager.js
var require_NoopContextManager = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/NoopContextManager.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoopContextManager = void 0;
    var context_1 = require_context();
    var NoopContextManager = class {
      active() {
        return context_1.ROOT_CONTEXT;
      }
      with(_context, fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      bind(_context, target) {
        return target;
      }
      enable() {
        return this;
      }
      disable() {
        return this;
      }
    };
    exports.NoopContextManager = NoopContextManager;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/context.js
var require_context2 = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/context.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextAPI = void 0;
    var NoopContextManager_1 = require_NoopContextManager();
    var global_utils_1 = require_global_utils();
    var diag_1 = require_diag();
    var API_NAME = "context";
    var NOOP_CONTEXT_MANAGER = new NoopContextManager_1.NoopContextManager();
    var ContextAPI = class {
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
      }
      /** Get the singleton instance of the Context API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new ContextAPI();
        }
        return this._instance;
      }
      /**
       * Set the current context manager.
       *
       * @returns true if the context manager was successfully registered, else false
       */
      setGlobalContextManager(contextManager) {
        return (0, global_utils_1.registerGlobal)(API_NAME, contextManager, diag_1.DiagAPI.instance());
      }
      /**
       * Get the currently active context
       */
      active() {
        return this._getContextManager().active();
      }
      /**
       * Execute a function with an active context
       *
       * @param context context to be active during function execution
       * @param fn function to execute in a context
       * @param thisArg optional receiver to be used for calling fn
       * @param args optional arguments forwarded to fn
       */
      with(context8, fn, thisArg, ...args) {
        return this._getContextManager().with(context8, fn, thisArg, ...args);
      }
      /**
       * Bind a context to a target function or event emitter
       *
       * @param context context to bind to the event emitter or function. Defaults to the currently active context
       * @param target function or event emitter to bind
       */
      bind(context8, target) {
        return this._getContextManager().bind(context8, target);
      }
      _getContextManager() {
        return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_CONTEXT_MANAGER;
      }
      /** Disable and remove the global context manager */
      disable() {
        this._getContextManager().disable();
        (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
      }
    };
    exports.ContextAPI = ContextAPI;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/trace_flags.js
var require_trace_flags = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/trace_flags.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TraceFlags = void 0;
    var TraceFlags6;
    (function(TraceFlags7) {
      TraceFlags7[TraceFlags7["NONE"] = 0] = "NONE";
      TraceFlags7[TraceFlags7["SAMPLED"] = 1] = "SAMPLED";
    })(TraceFlags6 = exports.TraceFlags || (exports.TraceFlags = {}));
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/invalid-span-constants.js
var require_invalid_span_constants = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/invalid-span-constants.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = void 0;
    var trace_flags_1 = require_trace_flags();
    exports.INVALID_SPANID = "0000000000000000";
    exports.INVALID_TRACEID = "00000000000000000000000000000000";
    exports.INVALID_SPAN_CONTEXT = {
      traceId: exports.INVALID_TRACEID,
      spanId: exports.INVALID_SPANID,
      traceFlags: trace_flags_1.TraceFlags.NONE
    };
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NonRecordingSpan.js
var require_NonRecordingSpan = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NonRecordingSpan.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NonRecordingSpan = void 0;
    var invalid_span_constants_1 = require_invalid_span_constants();
    var NonRecordingSpan = class {
      constructor(_spanContext = invalid_span_constants_1.INVALID_SPAN_CONTEXT) {
        this._spanContext = _spanContext;
      }
      // Returns a SpanContext.
      spanContext() {
        return this._spanContext;
      }
      // By default does nothing
      setAttribute(_key, _value) {
        return this;
      }
      // By default does nothing
      setAttributes(_attributes) {
        return this;
      }
      // By default does nothing
      addEvent(_name, _attributes) {
        return this;
      }
      addLink(_link) {
        return this;
      }
      addLinks(_links) {
        return this;
      }
      // By default does nothing
      setStatus(_status) {
        return this;
      }
      // By default does nothing
      updateName(_name) {
        return this;
      }
      // By default does nothing
      end(_endTime) {
      }
      // isRecording always returns false for NonRecordingSpan.
      isRecording() {
        return false;
      }
      // By default does nothing
      recordException(_exception, _time) {
      }
    };
    exports.NonRecordingSpan = NonRecordingSpan;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/context-utils.js
var require_context_utils = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/context-utils.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSpanContext = exports.setSpanContext = exports.deleteSpan = exports.setSpan = exports.getActiveSpan = exports.getSpan = void 0;
    var context_1 = require_context();
    var NonRecordingSpan_1 = require_NonRecordingSpan();
    var context_2 = require_context2();
    var SPAN_KEY = (0, context_1.createContextKey)("OpenTelemetry Context Key SPAN");
    function getSpan(context8) {
      return context8.getValue(SPAN_KEY) || void 0;
    }
    exports.getSpan = getSpan;
    function getActiveSpan() {
      return getSpan(context_2.ContextAPI.getInstance().active());
    }
    exports.getActiveSpan = getActiveSpan;
    function setSpan(context8, span) {
      return context8.setValue(SPAN_KEY, span);
    }
    exports.setSpan = setSpan;
    function deleteSpan(context8) {
      return context8.deleteValue(SPAN_KEY);
    }
    exports.deleteSpan = deleteSpan;
    function setSpanContext(context8, spanContext) {
      return setSpan(context8, new NonRecordingSpan_1.NonRecordingSpan(spanContext));
    }
    exports.setSpanContext = setSpanContext;
    function getSpanContext(context8) {
      var _a91;
      return (_a91 = getSpan(context8)) === null || _a91 === void 0 ? void 0 : _a91.spanContext();
    }
    exports.getSpanContext = getSpanContext;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/spancontext-utils.js
var require_spancontext_utils = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/spancontext-utils.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wrapSpanContext = exports.isSpanContextValid = exports.isValidSpanId = exports.isValidTraceId = void 0;
    var invalid_span_constants_1 = require_invalid_span_constants();
    var NonRecordingSpan_1 = require_NonRecordingSpan();
    var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
    var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
    function isValidTraceId2(traceId) {
      return VALID_TRACEID_REGEX.test(traceId) && traceId !== invalid_span_constants_1.INVALID_TRACEID;
    }
    exports.isValidTraceId = isValidTraceId2;
    function isValidSpanId(spanId) {
      return VALID_SPANID_REGEX.test(spanId) && spanId !== invalid_span_constants_1.INVALID_SPANID;
    }
    exports.isValidSpanId = isValidSpanId;
    function isSpanContextValid3(spanContext) {
      return isValidTraceId2(spanContext.traceId) && isValidSpanId(spanContext.spanId);
    }
    exports.isSpanContextValid = isSpanContextValid3;
    function wrapSpanContext(spanContext) {
      return new NonRecordingSpan_1.NonRecordingSpan(spanContext);
    }
    exports.wrapSpanContext = wrapSpanContext;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracer.js
var require_NoopTracer = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracer.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoopTracer = void 0;
    var context_1 = require_context2();
    var context_utils_1 = require_context_utils();
    var NonRecordingSpan_1 = require_NonRecordingSpan();
    var spancontext_utils_1 = require_spancontext_utils();
    var contextApi = context_1.ContextAPI.getInstance();
    var NoopTracer = class {
      // startSpan starts a noop span.
      startSpan(name, options, context8 = contextApi.active()) {
        const root = Boolean(options === null || options === void 0 ? void 0 : options.root);
        if (root) {
          return new NonRecordingSpan_1.NonRecordingSpan();
        }
        const parentFromContext = context8 && (0, context_utils_1.getSpanContext)(context8);
        if (isSpanContext(parentFromContext) && (0, spancontext_utils_1.isSpanContextValid)(parentFromContext)) {
          return new NonRecordingSpan_1.NonRecordingSpan(parentFromContext);
        } else {
          return new NonRecordingSpan_1.NonRecordingSpan();
        }
      }
      startActiveSpan(name, arg2, arg3, arg4) {
        let opts;
        let ctx;
        let fn;
        if (arguments.length < 2) {
          return;
        } else if (arguments.length === 2) {
          fn = arg2;
        } else if (arguments.length === 3) {
          opts = arg2;
          fn = arg3;
        } else {
          opts = arg2;
          ctx = arg3;
          fn = arg4;
        }
        const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
        const span = this.startSpan(name, opts, parentContext);
        const contextWithSpanSet = (0, context_utils_1.setSpan)(parentContext, span);
        return contextApi.with(contextWithSpanSet, fn, void 0, span);
      }
    };
    exports.NoopTracer = NoopTracer;
    function isSpanContext(spanContext) {
      return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
    }
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracer.js
var require_ProxyTracer = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracer.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProxyTracer = void 0;
    var NoopTracer_1 = require_NoopTracer();
    var NOOP_TRACER = new NoopTracer_1.NoopTracer();
    var ProxyTracer = class {
      constructor(_provider, name, version2, options) {
        this._provider = _provider;
        this.name = name;
        this.version = version2;
        this.options = options;
      }
      startSpan(name, options, context8) {
        return this._getTracer().startSpan(name, options, context8);
      }
      startActiveSpan(_name, _options, _context, _fn) {
        const tracer2 = this._getTracer();
        return Reflect.apply(tracer2.startActiveSpan, tracer2, arguments);
      }
      /**
       * Try to get a tracer from the proxy tracer provider.
       * If the proxy tracer provider has no delegate, return a noop tracer.
       */
      _getTracer() {
        if (this._delegate) {
          return this._delegate;
        }
        const tracer2 = this._provider.getDelegateTracer(this.name, this.version, this.options);
        if (!tracer2) {
          return NOOP_TRACER;
        }
        this._delegate = tracer2;
        return this._delegate;
      }
    };
    exports.ProxyTracer = ProxyTracer;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracerProvider.js
var require_NoopTracerProvider = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracerProvider.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoopTracerProvider = void 0;
    var NoopTracer_1 = require_NoopTracer();
    var NoopTracerProvider = class {
      getTracer(_name, _version, _options) {
        return new NoopTracer_1.NoopTracer();
      }
    };
    exports.NoopTracerProvider = NoopTracerProvider;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracerProvider.js
var require_ProxyTracerProvider = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracerProvider.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProxyTracerProvider = void 0;
    var ProxyTracer_1 = require_ProxyTracer();
    var NoopTracerProvider_1 = require_NoopTracerProvider();
    var NOOP_TRACER_PROVIDER = new NoopTracerProvider_1.NoopTracerProvider();
    var ProxyTracerProvider = class {
      /**
       * Get a {@link ProxyTracer}
       */
      getTracer(name, version2, options) {
        var _a91;
        return (_a91 = this.getDelegateTracer(name, version2, options)) !== null && _a91 !== void 0 ? _a91 : new ProxyTracer_1.ProxyTracer(this, name, version2, options);
      }
      getDelegate() {
        var _a91;
        return (_a91 = this._delegate) !== null && _a91 !== void 0 ? _a91 : NOOP_TRACER_PROVIDER;
      }
      /**
       * Set the delegate tracer provider
       */
      setDelegate(delegate) {
        this._delegate = delegate;
      }
      getDelegateTracer(name, version2, options) {
        var _a91;
        return (_a91 = this._delegate) === null || _a91 === void 0 ? void 0 : _a91.getTracer(name, version2, options);
      }
    };
    exports.ProxyTracerProvider = ProxyTracerProvider;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/SamplingResult.js
var require_SamplingResult = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/SamplingResult.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SamplingDecision = void 0;
    var SamplingDecision3;
    (function(SamplingDecision4) {
      SamplingDecision4[SamplingDecision4["NOT_RECORD"] = 0] = "NOT_RECORD";
      SamplingDecision4[SamplingDecision4["RECORD"] = 1] = "RECORD";
      SamplingDecision4[SamplingDecision4["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
    })(SamplingDecision3 = exports.SamplingDecision || (exports.SamplingDecision = {}));
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/span_kind.js
var require_span_kind = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/span_kind.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpanKind = void 0;
    var SpanKind4;
    (function(SpanKind5) {
      SpanKind5[SpanKind5["INTERNAL"] = 0] = "INTERNAL";
      SpanKind5[SpanKind5["SERVER"] = 1] = "SERVER";
      SpanKind5[SpanKind5["CLIENT"] = 2] = "CLIENT";
      SpanKind5[SpanKind5["PRODUCER"] = 3] = "PRODUCER";
      SpanKind5[SpanKind5["CONSUMER"] = 4] = "CONSUMER";
    })(SpanKind4 = exports.SpanKind || (exports.SpanKind = {}));
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/status.js
var require_status = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/status.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpanStatusCode = void 0;
    var SpanStatusCode3;
    (function(SpanStatusCode4) {
      SpanStatusCode4[SpanStatusCode4["UNSET"] = 0] = "UNSET";
      SpanStatusCode4[SpanStatusCode4["OK"] = 1] = "OK";
      SpanStatusCode4[SpanStatusCode4["ERROR"] = 2] = "ERROR";
    })(SpanStatusCode3 = exports.SpanStatusCode || (exports.SpanStatusCode = {}));
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-validators.js
var require_tracestate_validators = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-validators.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateValue = exports.validateKey = void 0;
    var VALID_KEY_CHAR_RANGE2 = "[_0-9a-z-*/]";
    var VALID_KEY2 = `[a-z]${VALID_KEY_CHAR_RANGE2}{0,255}`;
    var VALID_VENDOR_KEY2 = `[a-z0-9]${VALID_KEY_CHAR_RANGE2}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE2}{0,13}`;
    var VALID_KEY_REGEX2 = new RegExp(`^(?:${VALID_KEY2}|${VALID_VENDOR_KEY2})$`);
    var VALID_VALUE_BASE_REGEX2 = /^[ -~]{0,255}[!-~]$/;
    var INVALID_VALUE_COMMA_EQUAL_REGEX2 = /,|=/;
    function validateKey2(key) {
      return VALID_KEY_REGEX2.test(key);
    }
    exports.validateKey = validateKey2;
    function validateValue2(value) {
      return VALID_VALUE_BASE_REGEX2.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX2.test(value);
    }
    exports.validateValue = validateValue2;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-impl.js
var require_tracestate_impl = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-impl.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TraceStateImpl = void 0;
    var tracestate_validators_1 = require_tracestate_validators();
    var MAX_TRACE_STATE_ITEMS2 = 32;
    var MAX_TRACE_STATE_LEN2 = 512;
    var LIST_MEMBERS_SEPARATOR2 = ",";
    var LIST_MEMBER_KEY_VALUE_SPLITTER2 = "=";
    var TraceStateImpl = class {
      constructor(rawTraceState) {
        this._internalState = /* @__PURE__ */ new Map();
        if (rawTraceState)
          this._parse(rawTraceState);
      }
      set(key, value) {
        const traceState = this._clone();
        if (traceState._internalState.has(key)) {
          traceState._internalState.delete(key);
        }
        traceState._internalState.set(key, value);
        return traceState;
      }
      unset(key) {
        const traceState = this._clone();
        traceState._internalState.delete(key);
        return traceState;
      }
      get(key) {
        return this._internalState.get(key);
      }
      serialize() {
        return this._keys().reduce((agg, key) => {
          agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER2 + this.get(key));
          return agg;
        }, []).join(LIST_MEMBERS_SEPARATOR2);
      }
      _parse(rawTraceState) {
        if (rawTraceState.length > MAX_TRACE_STATE_LEN2)
          return;
        this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR2).reverse().reduce((agg, part) => {
          const listMember = part.trim();
          const i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER2);
          if (i !== -1) {
            const key = listMember.slice(0, i);
            const value = listMember.slice(i + 1, part.length);
            if ((0, tracestate_validators_1.validateKey)(key) && (0, tracestate_validators_1.validateValue)(value)) {
              agg.set(key, value);
            } else {
            }
          }
          return agg;
        }, /* @__PURE__ */ new Map());
        if (this._internalState.size > MAX_TRACE_STATE_ITEMS2) {
          this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS2));
        }
      }
      _keys() {
        return Array.from(this._internalState.keys()).reverse();
      }
      _clone() {
        const traceState = new TraceStateImpl();
        traceState._internalState = new Map(this._internalState);
        return traceState;
      }
    };
    exports.TraceStateImpl = TraceStateImpl;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/utils.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTraceState = void 0;
    var tracestate_impl_1 = require_tracestate_impl();
    function createTraceState(rawTraceState) {
      return new tracestate_impl_1.TraceStateImpl(rawTraceState);
    }
    exports.createTraceState = createTraceState;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context-api.js
var require_context_api = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context-api.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.context = void 0;
    var context_1 = require_context2();
    exports.context = context_1.ContextAPI.getInstance();
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag-api.js
var require_diag_api = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag-api.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.diag = void 0;
    var diag_1 = require_diag();
    exports.diag = diag_1.DiagAPI.instance();
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeterProvider.js
var require_NoopMeterProvider = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeterProvider.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NOOP_METER_PROVIDER = exports.NoopMeterProvider = void 0;
    var NoopMeter_1 = require_NoopMeter();
    var NoopMeterProvider = class {
      getMeter(_name, _version, _options) {
        return NoopMeter_1.NOOP_METER;
      }
    };
    exports.NoopMeterProvider = NoopMeterProvider;
    exports.NOOP_METER_PROVIDER = new NoopMeterProvider();
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/metrics.js
var require_metrics = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/metrics.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MetricsAPI = void 0;
    var NoopMeterProvider_1 = require_NoopMeterProvider();
    var global_utils_1 = require_global_utils();
    var diag_1 = require_diag();
    var API_NAME = "metrics";
    var MetricsAPI = class {
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
      }
      /** Get the singleton instance of the Metrics API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new MetricsAPI();
        }
        return this._instance;
      }
      /**
       * Set the current global meter provider.
       * Returns true if the meter provider was successfully registered, else false.
       */
      setGlobalMeterProvider(provider) {
        return (0, global_utils_1.registerGlobal)(API_NAME, provider, diag_1.DiagAPI.instance());
      }
      /**
       * Returns the global meter provider.
       */
      getMeterProvider() {
        return (0, global_utils_1.getGlobal)(API_NAME) || NoopMeterProvider_1.NOOP_METER_PROVIDER;
      }
      /**
       * Returns a meter from the global meter provider.
       */
      getMeter(name, version2, options) {
        return this.getMeterProvider().getMeter(name, version2, options);
      }
      /** Remove the global meter provider */
      disable() {
        (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
      }
    };
    exports.MetricsAPI = MetricsAPI;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics-api.js
var require_metrics_api = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics-api.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.metrics = void 0;
    var metrics_1 = require_metrics();
    exports.metrics = metrics_1.MetricsAPI.getInstance();
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/NoopTextMapPropagator.js
var require_NoopTextMapPropagator = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/NoopTextMapPropagator.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoopTextMapPropagator = void 0;
    var NoopTextMapPropagator = class {
      /** Noop inject function does nothing */
      inject(_context, _carrier) {
      }
      /** Noop extract function does nothing and returns the input context */
      extract(context8, _carrier) {
        return context8;
      }
      fields() {
        return [];
      }
    };
    exports.NoopTextMapPropagator = NoopTextMapPropagator;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/context-helpers.js
var require_context_helpers = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/context-helpers.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deleteBaggage = exports.setBaggage = exports.getActiveBaggage = exports.getBaggage = void 0;
    var context_1 = require_context2();
    var context_2 = require_context();
    var BAGGAGE_KEY = (0, context_2.createContextKey)("OpenTelemetry Baggage Key");
    function getBaggage(context8) {
      return context8.getValue(BAGGAGE_KEY) || void 0;
    }
    exports.getBaggage = getBaggage;
    function getActiveBaggage() {
      return getBaggage(context_1.ContextAPI.getInstance().active());
    }
    exports.getActiveBaggage = getActiveBaggage;
    function setBaggage(context8, baggage) {
      return context8.setValue(BAGGAGE_KEY, baggage);
    }
    exports.setBaggage = setBaggage;
    function deleteBaggage(context8) {
      return context8.deleteValue(BAGGAGE_KEY);
    }
    exports.deleteBaggage = deleteBaggage;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/propagation.js
var require_propagation = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/propagation.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PropagationAPI = void 0;
    var global_utils_1 = require_global_utils();
    var NoopTextMapPropagator_1 = require_NoopTextMapPropagator();
    var TextMapPropagator_1 = require_TextMapPropagator();
    var context_helpers_1 = require_context_helpers();
    var utils_1 = require_utils();
    var diag_1 = require_diag();
    var API_NAME = "propagation";
    var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator_1.NoopTextMapPropagator();
    var PropagationAPI = class {
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
        this.createBaggage = utils_1.createBaggage;
        this.getBaggage = context_helpers_1.getBaggage;
        this.getActiveBaggage = context_helpers_1.getActiveBaggage;
        this.setBaggage = context_helpers_1.setBaggage;
        this.deleteBaggage = context_helpers_1.deleteBaggage;
      }
      /** Get the singleton instance of the Propagator API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new PropagationAPI();
        }
        return this._instance;
      }
      /**
       * Set the current propagator.
       *
       * @returns true if the propagator was successfully registered, else false
       */
      setGlobalPropagator(propagator) {
        return (0, global_utils_1.registerGlobal)(API_NAME, propagator, diag_1.DiagAPI.instance());
      }
      /**
       * Inject context into a carrier to be propagated inter-process
       *
       * @param context Context carrying tracing data to inject
       * @param carrier carrier to inject context into
       * @param setter Function used to set values on the carrier
       */
      inject(context8, carrier, setter = TextMapPropagator_1.defaultTextMapSetter) {
        return this._getGlobalPropagator().inject(context8, carrier, setter);
      }
      /**
       * Extract context from a carrier
       *
       * @param context Context which the newly created context will inherit from
       * @param carrier Carrier to extract context from
       * @param getter Function used to extract keys from a carrier
       */
      extract(context8, carrier, getter = TextMapPropagator_1.defaultTextMapGetter) {
        return this._getGlobalPropagator().extract(context8, carrier, getter);
      }
      /**
       * Return a list of all fields which may be used by the propagator.
       */
      fields() {
        return this._getGlobalPropagator().fields();
      }
      /** Remove the global propagator */
      disable() {
        (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
      }
      _getGlobalPropagator() {
        return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
      }
    };
    exports.PropagationAPI = PropagationAPI;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation-api.js
var require_propagation_api = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation-api.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.propagation = void 0;
    var propagation_1 = require_propagation();
    exports.propagation = propagation_1.PropagationAPI.getInstance();
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/trace.js
var require_trace = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/trace.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TraceAPI = void 0;
    var global_utils_1 = require_global_utils();
    var ProxyTracerProvider_1 = require_ProxyTracerProvider();
    var spancontext_utils_1 = require_spancontext_utils();
    var context_utils_1 = require_context_utils();
    var diag_1 = require_diag();
    var API_NAME = "trace";
    var TraceAPI = class {
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
        this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
        this.wrapSpanContext = spancontext_utils_1.wrapSpanContext;
        this.isSpanContextValid = spancontext_utils_1.isSpanContextValid;
        this.deleteSpan = context_utils_1.deleteSpan;
        this.getSpan = context_utils_1.getSpan;
        this.getActiveSpan = context_utils_1.getActiveSpan;
        this.getSpanContext = context_utils_1.getSpanContext;
        this.setSpan = context_utils_1.setSpan;
        this.setSpanContext = context_utils_1.setSpanContext;
      }
      /** Get the singleton instance of the Trace API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new TraceAPI();
        }
        return this._instance;
      }
      /**
       * Set the current global tracer.
       *
       * @returns true if the tracer provider was successfully registered, else false
       */
      setGlobalTracerProvider(provider) {
        const success = (0, global_utils_1.registerGlobal)(API_NAME, this._proxyTracerProvider, diag_1.DiagAPI.instance());
        if (success) {
          this._proxyTracerProvider.setDelegate(provider);
        }
        return success;
      }
      /**
       * Returns the global tracer provider.
       */
      getTracerProvider() {
        return (0, global_utils_1.getGlobal)(API_NAME) || this._proxyTracerProvider;
      }
      /**
       * Returns a tracer from the global tracer provider.
       */
      getTracer(name, version2) {
        return this.getTracerProvider().getTracer(name, version2);
      }
      /** Remove the global tracer provider */
      disable() {
        (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
        this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
      }
    };
    exports.TraceAPI = TraceAPI;
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace-api.js
var require_trace_api = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace-api.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.trace = void 0;
    var trace_1 = require_trace();
    exports.trace = trace_1.TraceAPI.getInstance();
  }
});

// ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/index.js
var require_src = __commonJS({
  "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/index.js"(exports) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.trace = exports.propagation = exports.metrics = exports.diag = exports.context = exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = exports.isValidSpanId = exports.isValidTraceId = exports.isSpanContextValid = exports.createTraceState = exports.TraceFlags = exports.SpanStatusCode = exports.SpanKind = exports.SamplingDecision = exports.ProxyTracerProvider = exports.ProxyTracer = exports.defaultTextMapSetter = exports.defaultTextMapGetter = exports.ValueType = exports.createNoopMeter = exports.DiagLogLevel = exports.DiagConsoleLogger = exports.ROOT_CONTEXT = exports.createContextKey = exports.baggageEntryMetadataFromString = void 0;
    var utils_1 = require_utils();
    Object.defineProperty(exports, "baggageEntryMetadataFromString", { enumerable: true, get: function() {
      return utils_1.baggageEntryMetadataFromString;
    } });
    var context_1 = require_context();
    Object.defineProperty(exports, "createContextKey", { enumerable: true, get: function() {
      return context_1.createContextKey;
    } });
    Object.defineProperty(exports, "ROOT_CONTEXT", { enumerable: true, get: function() {
      return context_1.ROOT_CONTEXT;
    } });
    var consoleLogger_1 = require_consoleLogger();
    Object.defineProperty(exports, "DiagConsoleLogger", { enumerable: true, get: function() {
      return consoleLogger_1.DiagConsoleLogger;
    } });
    var types_1 = require_types();
    Object.defineProperty(exports, "DiagLogLevel", { enumerable: true, get: function() {
      return types_1.DiagLogLevel;
    } });
    var NoopMeter_1 = require_NoopMeter();
    Object.defineProperty(exports, "createNoopMeter", { enumerable: true, get: function() {
      return NoopMeter_1.createNoopMeter;
    } });
    var Metric_1 = require_Metric();
    Object.defineProperty(exports, "ValueType", { enumerable: true, get: function() {
      return Metric_1.ValueType;
    } });
    var TextMapPropagator_1 = require_TextMapPropagator();
    Object.defineProperty(exports, "defaultTextMapGetter", { enumerable: true, get: function() {
      return TextMapPropagator_1.defaultTextMapGetter;
    } });
    Object.defineProperty(exports, "defaultTextMapSetter", { enumerable: true, get: function() {
      return TextMapPropagator_1.defaultTextMapSetter;
    } });
    var ProxyTracer_1 = require_ProxyTracer();
    Object.defineProperty(exports, "ProxyTracer", { enumerable: true, get: function() {
      return ProxyTracer_1.ProxyTracer;
    } });
    var ProxyTracerProvider_1 = require_ProxyTracerProvider();
    Object.defineProperty(exports, "ProxyTracerProvider", { enumerable: true, get: function() {
      return ProxyTracerProvider_1.ProxyTracerProvider;
    } });
    var SamplingResult_1 = require_SamplingResult();
    Object.defineProperty(exports, "SamplingDecision", { enumerable: true, get: function() {
      return SamplingResult_1.SamplingDecision;
    } });
    var span_kind_1 = require_span_kind();
    Object.defineProperty(exports, "SpanKind", { enumerable: true, get: function() {
      return span_kind_1.SpanKind;
    } });
    var status_1 = require_status();
    Object.defineProperty(exports, "SpanStatusCode", { enumerable: true, get: function() {
      return status_1.SpanStatusCode;
    } });
    var trace_flags_1 = require_trace_flags();
    Object.defineProperty(exports, "TraceFlags", { enumerable: true, get: function() {
      return trace_flags_1.TraceFlags;
    } });
    var utils_2 = require_utils2();
    Object.defineProperty(exports, "createTraceState", { enumerable: true, get: function() {
      return utils_2.createTraceState;
    } });
    var spancontext_utils_1 = require_spancontext_utils();
    Object.defineProperty(exports, "isSpanContextValid", { enumerable: true, get: function() {
      return spancontext_utils_1.isSpanContextValid;
    } });
    Object.defineProperty(exports, "isValidTraceId", { enumerable: true, get: function() {
      return spancontext_utils_1.isValidTraceId;
    } });
    Object.defineProperty(exports, "isValidSpanId", { enumerable: true, get: function() {
      return spancontext_utils_1.isValidSpanId;
    } });
    var invalid_span_constants_1 = require_invalid_span_constants();
    Object.defineProperty(exports, "INVALID_SPANID", { enumerable: true, get: function() {
      return invalid_span_constants_1.INVALID_SPANID;
    } });
    Object.defineProperty(exports, "INVALID_TRACEID", { enumerable: true, get: function() {
      return invalid_span_constants_1.INVALID_TRACEID;
    } });
    Object.defineProperty(exports, "INVALID_SPAN_CONTEXT", { enumerable: true, get: function() {
      return invalid_span_constants_1.INVALID_SPAN_CONTEXT;
    } });
    var context_api_1 = require_context_api();
    Object.defineProperty(exports, "context", { enumerable: true, get: function() {
      return context_api_1.context;
    } });
    var diag_api_1 = require_diag_api();
    Object.defineProperty(exports, "diag", { enumerable: true, get: function() {
      return diag_api_1.diag;
    } });
    var metrics_api_1 = require_metrics_api();
    Object.defineProperty(exports, "metrics", { enumerable: true, get: function() {
      return metrics_api_1.metrics;
    } });
    var propagation_api_1 = require_propagation_api();
    Object.defineProperty(exports, "propagation", { enumerable: true, get: function() {
      return propagation_api_1.propagation;
    } });
    var trace_api_1 = require_trace_api();
    Object.defineProperty(exports, "trace", { enumerable: true, get: function() {
      return trace_api_1.trace;
    } });
    exports.default = {
      context: context_api_1.context,
      diag: diag_api_1.diag,
      metrics: metrics_api_1.metrics,
      propagation: propagation_api_1.propagation,
      trace: trace_api_1.trace
    };
  }
});

// ../../node_modules/.pnpm/shimmer@1.2.1/node_modules/shimmer/index.js
var require_shimmer = __commonJS({
  "../../node_modules/.pnpm/shimmer@1.2.1/node_modules/shimmer/index.js"(exports, module) {
    "use strict";
    init_checked_fetch();
    init_modules_watch_stub();
    function isFunction2(funktion) {
      return typeof funktion === "function";
    }
    var logger = console.error.bind(console);
    function defineProperty(obj, name, value) {
      var enumerable = !!obj[name] && obj.propertyIsEnumerable(name);
      Object.defineProperty(obj, name, {
        configurable: true,
        enumerable,
        writable: true,
        value
      });
    }
    function shimmer3(options) {
      if (options && options.logger) {
        if (!isFunction2(options.logger))
          logger("new logger isn't a function, not replacing");
        else
          logger = options.logger;
      }
    }
    function wrap3(nodule, name, wrapper) {
      if (!nodule || !nodule[name]) {
        logger("no original function " + name + " to wrap");
        return;
      }
      if (!wrapper) {
        logger("no wrapper function");
        logger(new Error().stack);
        return;
      }
      if (!isFunction2(nodule[name]) || !isFunction2(wrapper)) {
        logger("original object and wrapper must be functions");
        return;
      }
      var original = nodule[name];
      var wrapped = wrapper(original, name);
      defineProperty(wrapped, "__original", original);
      defineProperty(wrapped, "__unwrap", function() {
        if (nodule[name] === wrapped)
          defineProperty(nodule, name, original);
      });
      defineProperty(wrapped, "__wrapped", true);
      defineProperty(nodule, name, wrapped);
      return wrapped;
    }
    function massWrap(nodules, names, wrapper) {
      if (!nodules) {
        logger("must provide one or more modules to patch");
        logger(new Error().stack);
        return;
      } else if (!Array.isArray(nodules)) {
        nodules = [nodules];
      }
      if (!(names && Array.isArray(names))) {
        logger("must provide one or more functions to wrap on modules");
        return;
      }
      nodules.forEach(function(nodule) {
        names.forEach(function(name) {
          wrap3(nodule, name, wrapper);
        });
      });
    }
    function unwrap(nodule, name) {
      if (!nodule || !nodule[name]) {
        logger("no function to unwrap.");
        logger(new Error().stack);
        return;
      }
      if (!nodule[name].__unwrap) {
        logger("no original to unwrap to -- has " + name + " already been unwrapped?");
      } else {
        return nodule[name].__unwrap();
      }
    }
    function massUnwrap(nodules, names) {
      if (!nodules) {
        logger("must provide one or more modules to patch");
        logger(new Error().stack);
        return;
      } else if (!Array.isArray(nodules)) {
        nodules = [nodules];
      }
      if (!(names && Array.isArray(names))) {
        logger("must provide one or more functions to unwrap on modules");
        return;
      }
      nodules.forEach(function(nodule) {
        names.forEach(function(name) {
          unwrap(nodule, name);
        });
      });
    }
    shimmer3.wrap = wrap3;
    shimmer3.massWrap = massWrap;
    shimmer3.unwrap = unwrap;
    shimmer3.massUnwrap = massUnwrap;
    module.exports = shimmer3;
  }
});

// .wrangler/tmp/bundle-OrDozK/middleware-loader.entry.ts
init_checked_fetch();
init_modules_watch_stub();

// .wrangler/tmp/bundle-OrDozK/middleware-insertion-facade.js
init_checked_fetch();
init_modules_watch_stub();

// src/index.ts
init_checked_fetch();
init_modules_watch_stub();

// ../../packages/client-library-otel/dist/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../packages/client-library-otel/dist/instrumentation.js
init_checked_fetch();
init_modules_watch_stub();
var import_api27 = __toESM(require_src(), 1);

// ../../node_modules/.pnpm/@opentelemetry+exporter-trace-otlp-http@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/exporter-trace-otlp-http/build/esm/platform/browser/OTLPTraceExporter.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/baggage/propagation/W3CBaggagePropagator.js
init_checked_fetch();
init_modules_watch_stub();
var import_api3 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/trace/suppress-tracing.js
init_checked_fetch();
init_modules_watch_stub();
var import_api = __toESM(require_src());
var SUPPRESS_TRACING_KEY = (0, import_api.createContextKey)("OpenTelemetry SDK Context Key SUPPRESS_TRACING");
function suppressTracing(context8) {
  return context8.setValue(SUPPRESS_TRACING_KEY, true);
}
function isTracingSuppressed(context8) {
  return context8.getValue(SUPPRESS_TRACING_KEY) === true;
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/baggage/constants.js
init_checked_fetch();
init_modules_watch_stub();
var BAGGAGE_KEY_PAIR_SEPARATOR = "=";
var BAGGAGE_PROPERTIES_SEPARATOR = ";";
var BAGGAGE_ITEMS_SEPARATOR = ",";
var BAGGAGE_HEADER = "baggage";
var BAGGAGE_MAX_NAME_VALUE_PAIRS = 180;
var BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;
var BAGGAGE_MAX_TOTAL_LENGTH = 8192;

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/baggage/utils.js
var utils_exports = {};
__export(utils_exports, {
  getKeyPairs: () => getKeyPairs,
  parseKeyPairsIntoRecord: () => parseKeyPairsIntoRecord,
  parsePairKeyValue: () => parsePairKeyValue,
  serializeKeyPairs: () => serializeKeyPairs
});
init_checked_fetch();
init_modules_watch_stub();
var import_api2 = __toESM(require_src());
var __read = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function serializeKeyPairs(keyPairs) {
  return keyPairs.reduce(function(hValue, current) {
    var value = "" + hValue + (hValue !== "" ? BAGGAGE_ITEMS_SEPARATOR : "") + current;
    return value.length > BAGGAGE_MAX_TOTAL_LENGTH ? hValue : value;
  }, "");
}
function getKeyPairs(baggage) {
  return baggage.getAllEntries().map(function(_a91) {
    var _b = __read(_a91, 2), key = _b[0], value = _b[1];
    var entry = encodeURIComponent(key) + "=" + encodeURIComponent(value.value);
    if (value.metadata !== void 0) {
      entry += BAGGAGE_PROPERTIES_SEPARATOR + value.metadata.toString();
    }
    return entry;
  });
}
function parsePairKeyValue(entry) {
  var valueProps = entry.split(BAGGAGE_PROPERTIES_SEPARATOR);
  if (valueProps.length <= 0)
    return;
  var keyPairPart = valueProps.shift();
  if (!keyPairPart)
    return;
  var separatorIndex = keyPairPart.indexOf(BAGGAGE_KEY_PAIR_SEPARATOR);
  if (separatorIndex <= 0)
    return;
  var key = decodeURIComponent(keyPairPart.substring(0, separatorIndex).trim());
  var value = decodeURIComponent(keyPairPart.substring(separatorIndex + 1).trim());
  var metadata;
  if (valueProps.length > 0) {
    metadata = (0, import_api2.baggageEntryMetadataFromString)(valueProps.join(BAGGAGE_PROPERTIES_SEPARATOR));
  }
  return { key, value, metadata };
}
function parseKeyPairsIntoRecord(value) {
  if (typeof value !== "string" || value.length === 0)
    return {};
  return value.split(BAGGAGE_ITEMS_SEPARATOR).map(function(entry) {
    return parsePairKeyValue(entry);
  }).filter(function(keyPair) {
    return keyPair !== void 0 && keyPair.value.length > 0;
  }).reduce(function(headers, keyPair) {
    headers[keyPair.key] = keyPair.value;
    return headers;
  }, {});
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/baggage/propagation/W3CBaggagePropagator.js
var W3CBaggagePropagator = (
  /** @class */
  function() {
    function W3CBaggagePropagator2() {
    }
    W3CBaggagePropagator2.prototype.inject = function(context8, carrier, setter) {
      var baggage = import_api3.propagation.getBaggage(context8);
      if (!baggage || isTracingSuppressed(context8))
        return;
      var keyPairs = getKeyPairs(baggage).filter(function(pair) {
        return pair.length <= BAGGAGE_MAX_PER_NAME_VALUE_PAIRS;
      }).slice(0, BAGGAGE_MAX_NAME_VALUE_PAIRS);
      var headerValue = serializeKeyPairs(keyPairs);
      if (headerValue.length > 0) {
        setter.set(carrier, BAGGAGE_HEADER, headerValue);
      }
    };
    W3CBaggagePropagator2.prototype.extract = function(context8, carrier, getter) {
      var headerValue = getter.get(carrier, BAGGAGE_HEADER);
      var baggageString = Array.isArray(headerValue) ? headerValue.join(BAGGAGE_ITEMS_SEPARATOR) : headerValue;
      if (!baggageString)
        return context8;
      var baggage = {};
      if (baggageString.length === 0) {
        return context8;
      }
      var pairs = baggageString.split(BAGGAGE_ITEMS_SEPARATOR);
      pairs.forEach(function(entry) {
        var keyPair = parsePairKeyValue(entry);
        if (keyPair) {
          var baggageEntry = { value: keyPair.value };
          if (keyPair.metadata) {
            baggageEntry.metadata = keyPair.metadata;
          }
          baggage[keyPair.key] = baggageEntry;
        }
      });
      if (Object.entries(baggage).length === 0) {
        return context8;
      }
      return import_api3.propagation.setBaggage(context8, import_api3.propagation.createBaggage(baggage));
    };
    W3CBaggagePropagator2.prototype.fields = function() {
      return [BAGGAGE_HEADER];
    };
    return W3CBaggagePropagator2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/attributes.js
init_checked_fetch();
init_modules_watch_stub();
var import_api4 = __toESM(require_src());
var __values = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read2 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function sanitizeAttributes(attributes) {
  var e_1, _a91;
  var out = {};
  if (typeof attributes !== "object" || attributes == null) {
    return out;
  }
  try {
    for (var _b = __values(Object.entries(attributes)), _c = _b.next(); !_c.done; _c = _b.next()) {
      var _d = __read2(_c.value, 2), key = _d[0], val = _d[1];
      if (!isAttributeKey(key)) {
        import_api4.diag.warn("Invalid attribute key: " + key);
        continue;
      }
      if (!isAttributeValue(val)) {
        import_api4.diag.warn("Invalid attribute value set for key: " + key);
        continue;
      }
      if (Array.isArray(val)) {
        out[key] = val.slice();
      } else {
        out[key] = val;
      }
    }
  } catch (e_1_1) {
    e_1 = { error: e_1_1 };
  } finally {
    try {
      if (_c && !_c.done && (_a91 = _b.return))
        _a91.call(_b);
    } finally {
      if (e_1)
        throw e_1.error;
    }
  }
  return out;
}
function isAttributeKey(key) {
  return typeof key === "string" && key.length > 0;
}
function isAttributeValue(val) {
  if (val == null) {
    return true;
  }
  if (Array.isArray(val)) {
    return isHomogeneousAttributeValueArray(val);
  }
  return isValidPrimitiveAttributeValue(val);
}
function isHomogeneousAttributeValueArray(arr) {
  var e_2, _a91;
  var type;
  try {
    for (var arr_1 = __values(arr), arr_1_1 = arr_1.next(); !arr_1_1.done; arr_1_1 = arr_1.next()) {
      var element = arr_1_1.value;
      if (element == null)
        continue;
      if (!type) {
        if (isValidPrimitiveAttributeValue(element)) {
          type = typeof element;
          continue;
        }
        return false;
      }
      if (typeof element === type) {
        continue;
      }
      return false;
    }
  } catch (e_2_1) {
    e_2 = { error: e_2_1 };
  } finally {
    try {
      if (arr_1_1 && !arr_1_1.done && (_a91 = arr_1.return))
        _a91.call(arr_1);
    } finally {
      if (e_2)
        throw e_2.error;
    }
  }
  return true;
}
function isValidPrimitiveAttributeValue(val) {
  switch (typeof val) {
    case "number":
    case "boolean":
    case "string":
      return true;
  }
  return false;
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/logging-error-handler.js
init_checked_fetch();
init_modules_watch_stub();
var import_api5 = __toESM(require_src());
function loggingErrorHandler() {
  return function(ex) {
    import_api5.diag.error(stringifyException(ex));
  };
}
function stringifyException(ex) {
  if (typeof ex === "string") {
    return ex;
  } else {
    return JSON.stringify(flattenException(ex));
  }
}
function flattenException(ex) {
  var result = {};
  var current = ex;
  while (current !== null) {
    Object.getOwnPropertyNames(current).forEach(function(propertyName) {
      if (result[propertyName])
        return;
      var value = current[propertyName];
      if (value) {
        result[propertyName] = String(value);
      }
    });
    current = Object.getPrototypeOf(current);
  }
  return result;
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js
var delegateHandler = loggingErrorHandler();
function globalErrorHandler(ex) {
  try {
    delegateHandler(ex);
  } catch (_a91) {
  }
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/time.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/environment.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/environment.js
init_checked_fetch();
init_modules_watch_stub();
var import_api6 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/sampling.js
init_checked_fetch();
init_modules_watch_stub();
var TracesSamplerValues;
(function(TracesSamplerValues2) {
  TracesSamplerValues2["AlwaysOff"] = "always_off";
  TracesSamplerValues2["AlwaysOn"] = "always_on";
  TracesSamplerValues2["ParentBasedAlwaysOff"] = "parentbased_always_off";
  TracesSamplerValues2["ParentBasedAlwaysOn"] = "parentbased_always_on";
  TracesSamplerValues2["ParentBasedTraceIdRatio"] = "parentbased_traceidratio";
  TracesSamplerValues2["TraceIdRatio"] = "traceidratio";
})(TracesSamplerValues || (TracesSamplerValues = {}));

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/environment.js
var DEFAULT_LIST_SEPARATOR = ",";
var ENVIRONMENT_BOOLEAN_KEYS = ["OTEL_SDK_DISABLED"];
function isEnvVarABoolean(key) {
  return ENVIRONMENT_BOOLEAN_KEYS.indexOf(key) > -1;
}
var ENVIRONMENT_NUMBERS_KEYS = [
  "OTEL_BSP_EXPORT_TIMEOUT",
  "OTEL_BSP_MAX_EXPORT_BATCH_SIZE",
  "OTEL_BSP_MAX_QUEUE_SIZE",
  "OTEL_BSP_SCHEDULE_DELAY",
  "OTEL_BLRP_EXPORT_TIMEOUT",
  "OTEL_BLRP_MAX_EXPORT_BATCH_SIZE",
  "OTEL_BLRP_MAX_QUEUE_SIZE",
  "OTEL_BLRP_SCHEDULE_DELAY",
  "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT",
  "OTEL_ATTRIBUTE_COUNT_LIMIT",
  "OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT",
  "OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT",
  "OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT",
  "OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT",
  "OTEL_SPAN_EVENT_COUNT_LIMIT",
  "OTEL_SPAN_LINK_COUNT_LIMIT",
  "OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT",
  "OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT",
  "OTEL_EXPORTER_OTLP_TIMEOUT",
  "OTEL_EXPORTER_OTLP_TRACES_TIMEOUT",
  "OTEL_EXPORTER_OTLP_METRICS_TIMEOUT",
  "OTEL_EXPORTER_OTLP_LOGS_TIMEOUT",
  "OTEL_EXPORTER_JAEGER_AGENT_PORT"
];
function isEnvVarANumber(key) {
  return ENVIRONMENT_NUMBERS_KEYS.indexOf(key) > -1;
}
var ENVIRONMENT_LISTS_KEYS = [
  "OTEL_NO_PATCH_MODULES",
  "OTEL_PROPAGATORS"
];
function isEnvVarAList(key) {
  return ENVIRONMENT_LISTS_KEYS.indexOf(key) > -1;
}
var DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = Infinity;
var DEFAULT_ATTRIBUTE_COUNT_LIMIT = 128;
var DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT = 128;
var DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT = 128;
var DEFAULT_ENVIRONMENT = {
  OTEL_SDK_DISABLED: false,
  CONTAINER_NAME: "",
  ECS_CONTAINER_METADATA_URI_V4: "",
  ECS_CONTAINER_METADATA_URI: "",
  HOSTNAME: "",
  KUBERNETES_SERVICE_HOST: "",
  NAMESPACE: "",
  OTEL_BSP_EXPORT_TIMEOUT: 3e4,
  OTEL_BSP_MAX_EXPORT_BATCH_SIZE: 512,
  OTEL_BSP_MAX_QUEUE_SIZE: 2048,
  OTEL_BSP_SCHEDULE_DELAY: 5e3,
  OTEL_BLRP_EXPORT_TIMEOUT: 3e4,
  OTEL_BLRP_MAX_EXPORT_BATCH_SIZE: 512,
  OTEL_BLRP_MAX_QUEUE_SIZE: 2048,
  OTEL_BLRP_SCHEDULE_DELAY: 5e3,
  OTEL_EXPORTER_JAEGER_AGENT_HOST: "",
  OTEL_EXPORTER_JAEGER_AGENT_PORT: 6832,
  OTEL_EXPORTER_JAEGER_ENDPOINT: "",
  OTEL_EXPORTER_JAEGER_PASSWORD: "",
  OTEL_EXPORTER_JAEGER_USER: "",
  OTEL_EXPORTER_OTLP_ENDPOINT: "",
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "",
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: "",
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: "",
  OTEL_EXPORTER_OTLP_HEADERS: "",
  OTEL_EXPORTER_OTLP_TRACES_HEADERS: "",
  OTEL_EXPORTER_OTLP_METRICS_HEADERS: "",
  OTEL_EXPORTER_OTLP_LOGS_HEADERS: "",
  OTEL_EXPORTER_OTLP_TIMEOUT: 1e4,
  OTEL_EXPORTER_OTLP_TRACES_TIMEOUT: 1e4,
  OTEL_EXPORTER_OTLP_METRICS_TIMEOUT: 1e4,
  OTEL_EXPORTER_OTLP_LOGS_TIMEOUT: 1e4,
  OTEL_EXPORTER_ZIPKIN_ENDPOINT: "http://localhost:9411/api/v2/spans",
  OTEL_LOG_LEVEL: import_api6.DiagLogLevel.INFO,
  OTEL_NO_PATCH_MODULES: [],
  OTEL_PROPAGATORS: ["tracecontext", "baggage"],
  OTEL_RESOURCE_ATTRIBUTES: "",
  OTEL_SERVICE_NAME: "",
  OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT: DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
  OTEL_ATTRIBUTE_COUNT_LIMIT: DEFAULT_ATTRIBUTE_COUNT_LIMIT,
  OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT: DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
  OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT: DEFAULT_ATTRIBUTE_COUNT_LIMIT,
  OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT: DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
  OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT: DEFAULT_ATTRIBUTE_COUNT_LIMIT,
  OTEL_SPAN_EVENT_COUNT_LIMIT: 128,
  OTEL_SPAN_LINK_COUNT_LIMIT: 128,
  OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT: DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT,
  OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT: DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT,
  OTEL_TRACES_EXPORTER: "",
  OTEL_TRACES_SAMPLER: TracesSamplerValues.ParentBasedAlwaysOn,
  OTEL_TRACES_SAMPLER_ARG: "",
  OTEL_LOGS_EXPORTER: "",
  OTEL_EXPORTER_OTLP_INSECURE: "",
  OTEL_EXPORTER_OTLP_TRACES_INSECURE: "",
  OTEL_EXPORTER_OTLP_METRICS_INSECURE: "",
  OTEL_EXPORTER_OTLP_LOGS_INSECURE: "",
  OTEL_EXPORTER_OTLP_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_TRACES_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_METRICS_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_LOGS_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_COMPRESSION: "",
  OTEL_EXPORTER_OTLP_TRACES_COMPRESSION: "",
  OTEL_EXPORTER_OTLP_METRICS_COMPRESSION: "",
  OTEL_EXPORTER_OTLP_LOGS_COMPRESSION: "",
  OTEL_EXPORTER_OTLP_CLIENT_KEY: "",
  OTEL_EXPORTER_OTLP_TRACES_CLIENT_KEY: "",
  OTEL_EXPORTER_OTLP_METRICS_CLIENT_KEY: "",
  OTEL_EXPORTER_OTLP_LOGS_CLIENT_KEY: "",
  OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_TRACES_CLIENT_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_METRICS_CLIENT_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_LOGS_CLIENT_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_PROTOCOL: "http/protobuf",
  OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: "http/protobuf",
  OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: "http/protobuf",
  OTEL_EXPORTER_OTLP_LOGS_PROTOCOL: "http/protobuf",
  OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: "cumulative"
};
function parseBoolean(key, environment, values) {
  if (typeof values[key] === "undefined") {
    return;
  }
  var value = String(values[key]);
  environment[key] = value.toLowerCase() === "true";
}
function parseNumber(name, environment, values, min, max) {
  if (min === void 0) {
    min = -Infinity;
  }
  if (max === void 0) {
    max = Infinity;
  }
  if (typeof values[name] !== "undefined") {
    var value = Number(values[name]);
    if (!isNaN(value)) {
      if (value < min) {
        environment[name] = min;
      } else if (value > max) {
        environment[name] = max;
      } else {
        environment[name] = value;
      }
    }
  }
}
function parseStringList(name, output, input, separator) {
  if (separator === void 0) {
    separator = DEFAULT_LIST_SEPARATOR;
  }
  var givenValue = input[name];
  if (typeof givenValue === "string") {
    output[name] = givenValue.split(separator).map(function(v) {
      return v.trim();
    });
  }
}
var logLevelMap = {
  ALL: import_api6.DiagLogLevel.ALL,
  VERBOSE: import_api6.DiagLogLevel.VERBOSE,
  DEBUG: import_api6.DiagLogLevel.DEBUG,
  INFO: import_api6.DiagLogLevel.INFO,
  WARN: import_api6.DiagLogLevel.WARN,
  ERROR: import_api6.DiagLogLevel.ERROR,
  NONE: import_api6.DiagLogLevel.NONE
};
function setLogLevelFromEnv(key, environment, values) {
  var value = values[key];
  if (typeof value === "string") {
    var theLevel = logLevelMap[value.toUpperCase()];
    if (theLevel != null) {
      environment[key] = theLevel;
    }
  }
}
function parseEnvironment(values) {
  var environment = {};
  for (var env2 in DEFAULT_ENVIRONMENT) {
    var key = env2;
    switch (key) {
      case "OTEL_LOG_LEVEL":
        setLogLevelFromEnv(key, environment, values);
        break;
      default:
        if (isEnvVarABoolean(key)) {
          parseBoolean(key, environment, values);
        } else if (isEnvVarANumber(key)) {
          parseNumber(key, environment, values);
        } else if (isEnvVarAList(key)) {
          parseStringList(key, environment, values);
        } else {
          var value = values[key];
          if (typeof value !== "undefined" && value !== null) {
            environment[key] = String(value);
          }
        }
    }
  }
  return environment;
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/globalThis.js
init_checked_fetch();
init_modules_watch_stub();
var _globalThis = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/environment.js
function getEnv() {
  var globalEnv = parseEnvironment(_globalThis);
  return Object.assign({}, DEFAULT_ENVIRONMENT, globalEnv);
}
function getEnvWithoutDefaults() {
  return parseEnvironment(_globalThis);
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/hex-to-binary.js
init_checked_fetch();
init_modules_watch_stub();
function intValue(charCode) {
  if (charCode >= 48 && charCode <= 57) {
    return charCode - 48;
  }
  if (charCode >= 97 && charCode <= 102) {
    return charCode - 87;
  }
  return charCode - 55;
}
function hexToBinary(hexStr) {
  var buf = new Uint8Array(hexStr.length / 2);
  var offset = 0;
  for (var i = 0; i < hexStr.length; i += 2) {
    var hi = intValue(hexStr.charCodeAt(i));
    var lo = intValue(hexStr.charCodeAt(i + 1));
    buf[offset++] = hi << 4 | lo;
  }
  return buf;
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/performance.js
init_checked_fetch();
init_modules_watch_stub();
var otperformance = performance;

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/sdk-info.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/version.js
init_checked_fetch();
init_modules_watch_stub();
var VERSION = "1.25.1";

// ../../node_modules/.pnpm/@opentelemetry+semantic-conventions@1.25.1/node_modules/@opentelemetry/semantic-conventions/build/esm/trace/SemanticAttributes.js
init_checked_fetch();
init_modules_watch_stub();
var TMP_EXCEPTION_TYPE = "exception.type";
var TMP_EXCEPTION_MESSAGE = "exception.message";
var TMP_EXCEPTION_STACKTRACE = "exception.stacktrace";
var TMP_HTTP_SCHEME = "http.scheme";
var TMP_HTTP_RESPONSE_CONTENT_LENGTH = "http.response_content_length";
var SEMATTRS_EXCEPTION_TYPE = TMP_EXCEPTION_TYPE;
var SEMATTRS_EXCEPTION_MESSAGE = TMP_EXCEPTION_MESSAGE;
var SEMATTRS_EXCEPTION_STACKTRACE = TMP_EXCEPTION_STACKTRACE;
var SEMATTRS_HTTP_SCHEME = TMP_HTTP_SCHEME;
var SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = TMP_HTTP_RESPONSE_CONTENT_LENGTH;

// ../../node_modules/.pnpm/@opentelemetry+semantic-conventions@1.25.1/node_modules/@opentelemetry/semantic-conventions/build/esm/resource/SemanticResourceAttributes.js
init_checked_fetch();
init_modules_watch_stub();
var TMP_PROCESS_RUNTIME_NAME = "process.runtime.name";
var TMP_SERVICE_NAME = "service.name";
var TMP_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
var TMP_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
var TMP_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
var SEMRESATTRS_PROCESS_RUNTIME_NAME = TMP_PROCESS_RUNTIME_NAME;
var SEMRESATTRS_SERVICE_NAME = TMP_SERVICE_NAME;
var SEMRESATTRS_TELEMETRY_SDK_NAME = TMP_TELEMETRY_SDK_NAME;
var SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = TMP_TELEMETRY_SDK_LANGUAGE;
var SEMRESATTRS_TELEMETRY_SDK_VERSION = TMP_TELEMETRY_SDK_VERSION;
var TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS = "webjs";
var TELEMETRYSDKLANGUAGEVALUES_WEBJS = TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS;

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/sdk-info.js
var _a;
var SDK_INFO = (_a = {}, _a[SEMRESATTRS_TELEMETRY_SDK_NAME] = "opentelemetry", _a[SEMRESATTRS_PROCESS_RUNTIME_NAME] = "browser", _a[SEMRESATTRS_TELEMETRY_SDK_LANGUAGE] = TELEMETRYSDKLANGUAGEVALUES_WEBJS, _a[SEMRESATTRS_TELEMETRY_SDK_VERSION] = VERSION, _a);

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/timer-util.js
init_checked_fetch();
init_modules_watch_stub();
function unrefTimer(_timer) {
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/time.js
var NANOSECOND_DIGITS = 9;
var NANOSECOND_DIGITS_IN_MILLIS = 6;
var MILLISECONDS_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS_IN_MILLIS);
var SECOND_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS);
function millisToHrTime(epochMillis) {
  var epochSeconds = epochMillis / 1e3;
  var seconds = Math.trunc(epochSeconds);
  var nanos = Math.round(epochMillis % 1e3 * MILLISECONDS_TO_NANOSECONDS);
  return [seconds, nanos];
}
function getTimeOrigin() {
  var timeOrigin = otperformance.timeOrigin;
  if (typeof timeOrigin !== "number") {
    var perf = otperformance;
    timeOrigin = perf.timing && perf.timing.fetchStart;
  }
  return timeOrigin;
}
function hrTime(performanceNow) {
  var timeOrigin = millisToHrTime(getTimeOrigin());
  var now = millisToHrTime(typeof performanceNow === "number" ? performanceNow : otperformance.now());
  return addHrTimes(timeOrigin, now);
}
function hrTimeDuration(startTime, endTime) {
  var seconds = endTime[0] - startTime[0];
  var nanos = endTime[1] - startTime[1];
  if (nanos < 0) {
    seconds -= 1;
    nanos += SECOND_TO_NANOSECONDS;
  }
  return [seconds, nanos];
}
function hrTimeToNanoseconds(time) {
  return time[0] * SECOND_TO_NANOSECONDS + time[1];
}
function isTimeInputHrTime(value) {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
}
function isTimeInput(value) {
  return isTimeInputHrTime(value) || typeof value === "number" || value instanceof Date;
}
function addHrTimes(time1, time2) {
  var out = [time1[0] + time2[0], time1[1] + time2[1]];
  if (out[1] >= SECOND_TO_NANOSECONDS) {
    out[1] -= SECOND_TO_NANOSECONDS;
    out[0] += 1;
  }
  return out;
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/ExportResult.js
init_checked_fetch();
init_modules_watch_stub();
var ExportResultCode;
(function(ExportResultCode2) {
  ExportResultCode2[ExportResultCode2["SUCCESS"] = 0] = "SUCCESS";
  ExportResultCode2[ExportResultCode2["FAILED"] = 1] = "FAILED";
})(ExportResultCode || (ExportResultCode = {}));

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/propagation/composite.js
init_checked_fetch();
init_modules_watch_stub();
var import_api7 = __toESM(require_src());
var __values2 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var CompositePropagator = (
  /** @class */
  function() {
    function CompositePropagator2(config) {
      if (config === void 0) {
        config = {};
      }
      var _a91;
      this._propagators = (_a91 = config.propagators) !== null && _a91 !== void 0 ? _a91 : [];
      this._fields = Array.from(new Set(this._propagators.map(function(p) {
        return typeof p.fields === "function" ? p.fields() : [];
      }).reduce(function(x, y) {
        return x.concat(y);
      }, [])));
    }
    CompositePropagator2.prototype.inject = function(context8, carrier, setter) {
      var e_1, _a91;
      try {
        for (var _b = __values2(this._propagators), _c = _b.next(); !_c.done; _c = _b.next()) {
          var propagator = _c.value;
          try {
            propagator.inject(context8, carrier, setter);
          } catch (err) {
            import_api7.diag.warn("Failed to inject with " + propagator.constructor.name + ". Err: " + err.message);
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a91 = _b.return))
            _a91.call(_b);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
    };
    CompositePropagator2.prototype.extract = function(context8, carrier, getter) {
      return this._propagators.reduce(function(ctx, propagator) {
        try {
          return propagator.extract(ctx, carrier, getter);
        } catch (err) {
          import_api7.diag.warn("Failed to inject with " + propagator.constructor.name + ". Err: " + err.message);
        }
        return ctx;
      }, context8);
    };
    CompositePropagator2.prototype.fields = function() {
      return this._fields.slice();
    };
    return CompositePropagator2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/trace/W3CTraceContextPropagator.js
init_checked_fetch();
init_modules_watch_stub();
var import_api8 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/trace/TraceState.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/internal/validators.js
init_checked_fetch();
init_modules_watch_stub();
var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
var VALID_KEY = "[a-z]" + VALID_KEY_CHAR_RANGE + "{0,255}";
var VALID_VENDOR_KEY = "[a-z0-9]" + VALID_KEY_CHAR_RANGE + "{0,240}@[a-z]" + VALID_KEY_CHAR_RANGE + "{0,13}";
var VALID_KEY_REGEX = new RegExp("^(?:" + VALID_KEY + "|" + VALID_VENDOR_KEY + ")$");
var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
function validateKey(key) {
  return VALID_KEY_REGEX.test(key);
}
function validateValue(value) {
  return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/trace/TraceState.js
var MAX_TRACE_STATE_ITEMS = 32;
var MAX_TRACE_STATE_LEN = 512;
var LIST_MEMBERS_SEPARATOR = ",";
var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
var TraceState = (
  /** @class */
  function() {
    function TraceState2(rawTraceState) {
      this._internalState = /* @__PURE__ */ new Map();
      if (rawTraceState)
        this._parse(rawTraceState);
    }
    TraceState2.prototype.set = function(key, value) {
      var traceState = this._clone();
      if (traceState._internalState.has(key)) {
        traceState._internalState.delete(key);
      }
      traceState._internalState.set(key, value);
      return traceState;
    };
    TraceState2.prototype.unset = function(key) {
      var traceState = this._clone();
      traceState._internalState.delete(key);
      return traceState;
    };
    TraceState2.prototype.get = function(key) {
      return this._internalState.get(key);
    };
    TraceState2.prototype.serialize = function() {
      var _this = this;
      return this._keys().reduce(function(agg, key) {
        agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + _this.get(key));
        return agg;
      }, []).join(LIST_MEMBERS_SEPARATOR);
    };
    TraceState2.prototype._parse = function(rawTraceState) {
      if (rawTraceState.length > MAX_TRACE_STATE_LEN)
        return;
      this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce(function(agg, part) {
        var listMember = part.trim();
        var i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
        if (i !== -1) {
          var key = listMember.slice(0, i);
          var value = listMember.slice(i + 1, part.length);
          if (validateKey(key) && validateValue(value)) {
            agg.set(key, value);
          } else {
          }
        }
        return agg;
      }, /* @__PURE__ */ new Map());
      if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
        this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
      }
    };
    TraceState2.prototype._keys = function() {
      return Array.from(this._internalState.keys()).reverse();
    };
    TraceState2.prototype._clone = function() {
      var traceState = new TraceState2();
      traceState._internalState = new Map(this._internalState);
      return traceState;
    };
    return TraceState2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/trace/W3CTraceContextPropagator.js
var TRACE_PARENT_HEADER = "traceparent";
var TRACE_STATE_HEADER = "tracestate";
var VERSION2 = "00";
var VERSION_PART = "(?!ff)[\\da-f]{2}";
var TRACE_ID_PART = "(?![0]{32})[\\da-f]{32}";
var PARENT_ID_PART = "(?![0]{16})[\\da-f]{16}";
var FLAGS_PART = "[\\da-f]{2}";
var TRACE_PARENT_REGEX = new RegExp("^\\s?(" + VERSION_PART + ")-(" + TRACE_ID_PART + ")-(" + PARENT_ID_PART + ")-(" + FLAGS_PART + ")(-.*)?\\s?$");
function parseTraceParent(traceParent) {
  var match = TRACE_PARENT_REGEX.exec(traceParent);
  if (!match)
    return null;
  if (match[1] === "00" && match[5])
    return null;
  return {
    traceId: match[2],
    spanId: match[3],
    traceFlags: parseInt(match[4], 16)
  };
}
var W3CTraceContextPropagator = (
  /** @class */
  function() {
    function W3CTraceContextPropagator2() {
    }
    W3CTraceContextPropagator2.prototype.inject = function(context8, carrier, setter) {
      var spanContext = import_api8.trace.getSpanContext(context8);
      if (!spanContext || isTracingSuppressed(context8) || !(0, import_api8.isSpanContextValid)(spanContext))
        return;
      var traceParent = VERSION2 + "-" + spanContext.traceId + "-" + spanContext.spanId + "-0" + Number(spanContext.traceFlags || import_api8.TraceFlags.NONE).toString(16);
      setter.set(carrier, TRACE_PARENT_HEADER, traceParent);
      if (spanContext.traceState) {
        setter.set(carrier, TRACE_STATE_HEADER, spanContext.traceState.serialize());
      }
    };
    W3CTraceContextPropagator2.prototype.extract = function(context8, carrier, getter) {
      var traceParentHeader = getter.get(carrier, TRACE_PARENT_HEADER);
      if (!traceParentHeader)
        return context8;
      var traceParent = Array.isArray(traceParentHeader) ? traceParentHeader[0] : traceParentHeader;
      if (typeof traceParent !== "string")
        return context8;
      var spanContext = parseTraceParent(traceParent);
      if (!spanContext)
        return context8;
      spanContext.isRemote = true;
      var traceStateHeader = getter.get(carrier, TRACE_STATE_HEADER);
      if (traceStateHeader) {
        var state = Array.isArray(traceStateHeader) ? traceStateHeader.join(",") : traceStateHeader;
        spanContext.traceState = new TraceState(typeof state === "string" ? state : void 0);
      }
      return import_api8.trace.setSpanContext(context8, spanContext);
    };
    W3CTraceContextPropagator2.prototype.fields = function() {
      return [TRACE_PARENT_HEADER, TRACE_STATE_HEADER];
    };
    return W3CTraceContextPropagator2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/merge.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/lodash.merge.js
init_checked_fetch();
init_modules_watch_stub();
var objectTag = "[object Object]";
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
var objectCtorString = funcToString.call(Object);
var getPrototype = overArg(Object.getPrototypeOf, Object);
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
var nativeObjectToString = objectProto.toString;
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) !== objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) === objectCtorString;
}
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  var unmasked = false;
  try {
    value[symToStringTag] = void 0;
    unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
function objectToString(value) {
  return nativeObjectToString.call(value);
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/merge.js
var MAX_LEVEL = 20;
function merge() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var result = args.shift();
  var objects = /* @__PURE__ */ new WeakMap();
  while (args.length > 0) {
    result = mergeTwoObjects(result, args.shift(), 0, objects);
  }
  return result;
}
function takeValue(value) {
  if (isArray(value)) {
    return value.slice();
  }
  return value;
}
function mergeTwoObjects(one, two, level, objects) {
  if (level === void 0) {
    level = 0;
  }
  var result;
  if (level > MAX_LEVEL) {
    return void 0;
  }
  level++;
  if (isPrimitive(one) || isPrimitive(two) || isFunction(two)) {
    result = takeValue(two);
  } else if (isArray(one)) {
    result = one.slice();
    if (isArray(two)) {
      for (var i = 0, j = two.length; i < j; i++) {
        result.push(takeValue(two[i]));
      }
    } else if (isObject(two)) {
      var keys = Object.keys(two);
      for (var i = 0, j = keys.length; i < j; i++) {
        var key = keys[i];
        result[key] = takeValue(two[key]);
      }
    }
  } else if (isObject(one)) {
    if (isObject(two)) {
      if (!shouldMerge(one, two)) {
        return two;
      }
      result = Object.assign({}, one);
      var keys = Object.keys(two);
      for (var i = 0, j = keys.length; i < j; i++) {
        var key = keys[i];
        var twoValue = two[key];
        if (isPrimitive(twoValue)) {
          if (typeof twoValue === "undefined") {
            delete result[key];
          } else {
            result[key] = twoValue;
          }
        } else {
          var obj1 = result[key];
          var obj2 = twoValue;
          if (wasObjectReferenced(one, key, objects) || wasObjectReferenced(two, key, objects)) {
            delete result[key];
          } else {
            if (isObject(obj1) && isObject(obj2)) {
              var arr1 = objects.get(obj1) || [];
              var arr2 = objects.get(obj2) || [];
              arr1.push({ obj: one, key });
              arr2.push({ obj: two, key });
              objects.set(obj1, arr1);
              objects.set(obj2, arr2);
            }
            result[key] = mergeTwoObjects(result[key], twoValue, level, objects);
          }
        }
      }
    } else {
      result = two;
    }
  }
  return result;
}
function wasObjectReferenced(obj, key, objects) {
  var arr = objects.get(obj[key]) || [];
  for (var i = 0, j = arr.length; i < j; i++) {
    var info = arr[i];
    if (info.key === key && info.obj === obj) {
      return true;
    }
  }
  return false;
}
function isArray(value) {
  return Array.isArray(value);
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return !isPrimitive(value) && !isArray(value) && !isFunction(value) && typeof value === "object";
}
function isPrimitive(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "undefined" || value instanceof Date || value instanceof RegExp || value === null;
}
function shouldMerge(one, two) {
  if (!isPlainObject(one) || !isPlainObject(two)) {
    return false;
  }
  return true;
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/callback.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/promise.js
init_checked_fetch();
init_modules_watch_stub();
var Deferred = (
  /** @class */
  function() {
    function Deferred2() {
      var _this = this;
      this._promise = new Promise(function(resolve, reject) {
        _this._resolve = resolve;
        _this._reject = reject;
      });
    }
    Object.defineProperty(Deferred2.prototype, "promise", {
      get: function() {
        return this._promise;
      },
      enumerable: false,
      configurable: true
    });
    Deferred2.prototype.resolve = function(val) {
      this._resolve(val);
    };
    Deferred2.prototype.reject = function(err) {
      this._reject(err);
    };
    return Deferred2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/callback.js
var __read3 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
var __spreadArray = function(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var BindOnceFuture = (
  /** @class */
  function() {
    function BindOnceFuture2(_callback, _that) {
      this._callback = _callback;
      this._that = _that;
      this._isCalled = false;
      this._deferred = new Deferred();
    }
    Object.defineProperty(BindOnceFuture2.prototype, "isCalled", {
      get: function() {
        return this._isCalled;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BindOnceFuture2.prototype, "promise", {
      get: function() {
        return this._deferred.promise;
      },
      enumerable: false,
      configurable: true
    });
    BindOnceFuture2.prototype.call = function() {
      var _a91;
      var _this = this;
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      if (!this._isCalled) {
        this._isCalled = true;
        try {
          Promise.resolve((_a91 = this._callback).call.apply(_a91, __spreadArray([this._that], __read3(args), false))).then(function(val) {
            return _this._deferred.resolve(val);
          }, function(err) {
            return _this._deferred.reject(err);
          });
        } catch (err) {
          this._deferred.reject(err);
        }
      }
      return this._deferred.promise;
    };
    return BindOnceFuture2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/internal/exporter.js
init_checked_fetch();
init_modules_watch_stub();
var import_api9 = __toESM(require_src());
function _export(exporter, arg) {
  return new Promise(function(resolve) {
    import_api9.context.with(suppressTracing(import_api9.context.active()), function() {
      exporter.export(arg, function(result) {
        resolve(result);
      });
    });
  });
}

// ../../node_modules/.pnpm/@opentelemetry+core@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/index.js
var internal = {
  _export
};

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/platform/browser/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/platform/browser/OTLPExporterBrowserBase.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/OTLPExporterBase.js
init_checked_fetch();
init_modules_watch_stub();
var import_api11 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/util.js
init_checked_fetch();
init_modules_watch_stub();
var import_api10 = __toESM(require_src());
var __read4 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
var DEFAULT_TRACE_TIMEOUT = 1e4;
var DEFAULT_EXPORT_MAX_ATTEMPTS = 5;
var DEFAULT_EXPORT_INITIAL_BACKOFF = 1e3;
var DEFAULT_EXPORT_MAX_BACKOFF = 5e3;
var DEFAULT_EXPORT_BACKOFF_MULTIPLIER = 1.5;
function parseHeaders(partialHeaders) {
  if (partialHeaders === void 0) {
    partialHeaders = {};
  }
  var headers = {};
  Object.entries(partialHeaders).forEach(function(_a91) {
    var _b = __read4(_a91, 2), key = _b[0], value = _b[1];
    if (typeof value !== "undefined") {
      headers[key] = String(value);
    } else {
      import_api10.diag.warn('Header "' + key + '" has invalid value (' + value + ") and will be ignored");
    }
  });
  return headers;
}
function appendResourcePathToUrl(url, path) {
  if (!url.endsWith("/")) {
    url = url + "/";
  }
  return url + path;
}
function appendRootPathToUrlIfNeeded(url) {
  try {
    var parsedUrl = new URL(url);
    if (parsedUrl.pathname === "") {
      parsedUrl.pathname = parsedUrl.pathname + "/";
    }
    return parsedUrl.toString();
  } catch (_a91) {
    import_api10.diag.warn("Could not parse export URL: '" + url + "'");
    return url;
  }
}
function configureExporterTimeout(timeoutMillis) {
  if (typeof timeoutMillis === "number") {
    if (timeoutMillis <= 0) {
      return invalidTimeout(timeoutMillis, DEFAULT_TRACE_TIMEOUT);
    }
    return timeoutMillis;
  } else {
    return getExporterTimeoutFromEnv();
  }
}
function getExporterTimeoutFromEnv() {
  var _a91;
  var definedTimeout = Number((_a91 = getEnv().OTEL_EXPORTER_OTLP_TRACES_TIMEOUT) !== null && _a91 !== void 0 ? _a91 : getEnv().OTEL_EXPORTER_OTLP_TIMEOUT);
  if (definedTimeout <= 0) {
    return invalidTimeout(definedTimeout, DEFAULT_TRACE_TIMEOUT);
  } else {
    return definedTimeout;
  }
}
function invalidTimeout(timeout, defaultTimeout) {
  import_api10.diag.warn("Timeout must be greater than 0", timeout);
  return defaultTimeout;
}
function isExportRetryable(statusCode) {
  var retryCodes = [429, 502, 503, 504];
  return retryCodes.includes(statusCode);
}
function parseRetryAfterToMills(retryAfter) {
  if (retryAfter == null) {
    return -1;
  }
  var seconds = Number.parseInt(retryAfter, 10);
  if (Number.isInteger(seconds)) {
    return seconds > 0 ? seconds * 1e3 : -1;
  }
  var delay = new Date(retryAfter).getTime() - Date.now();
  if (delay >= 0) {
    return delay;
  }
  return 0;
}

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/OTLPExporterBase.js
var OTLPExporterBase = (
  /** @class */
  function() {
    function OTLPExporterBase2(config) {
      if (config === void 0) {
        config = {};
      }
      this._sendingPromises = [];
      this.url = this.getDefaultUrl(config);
      if (typeof config.hostname === "string") {
        this.hostname = config.hostname;
      }
      this.shutdown = this.shutdown.bind(this);
      this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
      this._concurrencyLimit = typeof config.concurrencyLimit === "number" ? config.concurrencyLimit : 30;
      this.timeoutMillis = configureExporterTimeout(config.timeoutMillis);
      this.onInit(config);
    }
    OTLPExporterBase2.prototype.export = function(items, resultCallback) {
      if (this._shutdownOnce.isCalled) {
        resultCallback({
          code: ExportResultCode.FAILED,
          error: new Error("Exporter has been shutdown")
        });
        return;
      }
      if (this._sendingPromises.length >= this._concurrencyLimit) {
        resultCallback({
          code: ExportResultCode.FAILED,
          error: new Error("Concurrent export limit reached")
        });
        return;
      }
      this._export(items).then(function() {
        resultCallback({ code: ExportResultCode.SUCCESS });
      }).catch(function(error) {
        resultCallback({ code: ExportResultCode.FAILED, error });
      });
    };
    OTLPExporterBase2.prototype._export = function(items) {
      var _this = this;
      return new Promise(function(resolve, reject) {
        try {
          import_api11.diag.debug("items to be sent", items);
          _this.send(items, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    };
    OTLPExporterBase2.prototype.shutdown = function() {
      return this._shutdownOnce.call();
    };
    OTLPExporterBase2.prototype.forceFlush = function() {
      return Promise.all(this._sendingPromises).then(function() {
      });
    };
    OTLPExporterBase2.prototype._shutdown = function() {
      import_api11.diag.debug("shutdown started");
      this.onShutdown();
      return this.forceFlush();
    };
    return OTLPExporterBase2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/platform/browser/util.js
init_checked_fetch();
init_modules_watch_stub();
var import_api12 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/types.js
init_checked_fetch();
init_modules_watch_stub();
var __extends = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var OTLPExporterError = (
  /** @class */
  function(_super) {
    __extends(OTLPExporterError2, _super);
    function OTLPExporterError2(message, code, data) {
      var _this = _super.call(this, message) || this;
      _this.name = "OTLPExporterError";
      _this.data = data;
      _this.code = code;
      return _this;
    }
    return OTLPExporterError2;
  }(Error)
);

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/platform/browser/util.js
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __read5 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function sendWithBeacon(body, url, blobPropertyBag, onSuccess, onError) {
  if (navigator.sendBeacon(url, new Blob([body], blobPropertyBag))) {
    import_api12.diag.debug("sendBeacon - can send", body);
    onSuccess();
  } else {
    var error = new OTLPExporterError("sendBeacon - cannot send " + body);
    onError(error);
  }
}
function sendWithXhr(body, url, headers, exporterTimeout, onSuccess, onError) {
  var retryTimer;
  var xhr;
  var reqIsDestroyed = false;
  var exporterTimer = setTimeout(function() {
    clearTimeout(retryTimer);
    reqIsDestroyed = true;
    if (xhr.readyState === XMLHttpRequest.DONE) {
      var err = new OTLPExporterError("Request Timeout");
      onError(err);
    } else {
      xhr.abort();
    }
  }, exporterTimeout);
  var sendWithRetry = function(retries, minDelay) {
    if (retries === void 0) {
      retries = DEFAULT_EXPORT_MAX_ATTEMPTS;
    }
    if (minDelay === void 0) {
      minDelay = DEFAULT_EXPORT_INITIAL_BACKOFF;
    }
    xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    var defaultHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    Object.entries(__assign(__assign({}, defaultHeaders), headers)).forEach(function(_a91) {
      var _b = __read5(_a91, 2), k = _b[0], v = _b[1];
      xhr.setRequestHeader(k, v);
    });
    xhr.send(body);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE && reqIsDestroyed === false) {
        if (xhr.status >= 200 && xhr.status <= 299) {
          import_api12.diag.debug("xhr success", body);
          onSuccess();
          clearTimeout(exporterTimer);
          clearTimeout(retryTimer);
        } else if (xhr.status && isExportRetryable(xhr.status) && retries > 0) {
          var retryTime = void 0;
          minDelay = DEFAULT_EXPORT_BACKOFF_MULTIPLIER * minDelay;
          if (xhr.getResponseHeader("Retry-After")) {
            retryTime = parseRetryAfterToMills(xhr.getResponseHeader("Retry-After"));
          } else {
            retryTime = Math.round(Math.random() * (DEFAULT_EXPORT_MAX_BACKOFF - minDelay) + minDelay);
          }
          retryTimer = setTimeout(function() {
            sendWithRetry(retries - 1, minDelay);
          }, retryTime);
        } else {
          var error = new OTLPExporterError("Failed to export with XHR (status: " + xhr.status + ")", xhr.status);
          onError(error);
          clearTimeout(exporterTimer);
          clearTimeout(retryTimer);
        }
      }
    };
    xhr.onabort = function() {
      if (reqIsDestroyed) {
        var err = new OTLPExporterError("Request Timeout");
        onError(err);
      }
      clearTimeout(exporterTimer);
      clearTimeout(retryTimer);
    };
    xhr.onerror = function() {
      if (reqIsDestroyed) {
        var err = new OTLPExporterError("Request Timeout");
        onError(err);
      }
      clearTimeout(exporterTimer);
      clearTimeout(retryTimer);
    };
  };
  sendWithRetry();
}

// ../../node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-exporter-base/build/esm/platform/browser/OTLPExporterBrowserBase.js
var import_api13 = __toESM(require_src());
var __extends2 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __assign2 = function() {
  __assign2 = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign2.apply(this, arguments);
};
var OTLPExporterBrowserBase = (
  /** @class */
  function(_super) {
    __extends2(OTLPExporterBrowserBase2, _super);
    function OTLPExporterBrowserBase2(config, serializer, contentType) {
      if (config === void 0) {
        config = {};
      }
      var _this = _super.call(this, config) || this;
      _this._useXHR = false;
      _this._serializer = serializer;
      _this._contentType = contentType;
      _this._useXHR = !!config.headers || typeof navigator.sendBeacon !== "function";
      if (_this._useXHR) {
        _this._headers = Object.assign({}, parseHeaders(config.headers), utils_exports.parseKeyPairsIntoRecord(getEnv().OTEL_EXPORTER_OTLP_HEADERS));
      } else {
        _this._headers = {};
      }
      return _this;
    }
    OTLPExporterBrowserBase2.prototype.onInit = function() {
    };
    OTLPExporterBrowserBase2.prototype.onShutdown = function() {
    };
    OTLPExporterBrowserBase2.prototype.send = function(items, onSuccess, onError) {
      var _this = this;
      var _a91;
      if (this._shutdownOnce.isCalled) {
        import_api13.diag.debug("Shutdown already started. Cannot send objects");
        return;
      }
      var body = (_a91 = this._serializer.serializeRequest(items)) !== null && _a91 !== void 0 ? _a91 : new Uint8Array();
      var promise = new Promise(function(resolve, reject) {
        if (_this._useXHR) {
          sendWithXhr(body, _this.url, __assign2(__assign2({}, _this._headers), { "Content-Type": _this._contentType }), _this.timeoutMillis, resolve, reject);
        } else {
          sendWithBeacon(body, _this.url, { type: _this._contentType }, resolve, reject);
        }
      }).then(onSuccess, onError);
      this._sendingPromises.push(promise);
      var popPromise = function() {
        var index = _this._sendingPromises.indexOf(promise);
        _this._sendingPromises.splice(index, 1);
      };
      promise.then(popPromise, popPromise);
    };
    return OTLPExporterBrowserBase2;
  }(OTLPExporterBase)
);

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/common/index.js
init_checked_fetch();
init_modules_watch_stub();
function hrTimeToNanos(hrTime2) {
  var NANOSECONDS = BigInt(1e9);
  return BigInt(hrTime2[0]) * NANOSECONDS + BigInt(hrTime2[1]);
}
function toLongBits(value) {
  var low = Number(BigInt.asUintN(32, value));
  var high = Number(BigInt.asUintN(32, value >> BigInt(32)));
  return { low, high };
}
function encodeAsLongBits(hrTime2) {
  var nanos = hrTimeToNanos(hrTime2);
  return toLongBits(nanos);
}
function encodeAsString(hrTime2) {
  var nanos = hrTimeToNanos(hrTime2);
  return nanos.toString();
}
var encodeTimestamp = typeof BigInt !== "undefined" ? encodeAsString : hrTimeToNanoseconds;
function identity(value) {
  return value;
}
function optionalHexToBinary(str) {
  if (str === void 0)
    return void 0;
  return hexToBinary(str);
}
var DEFAULT_ENCODER = {
  encodeHrTime: encodeAsLongBits,
  encodeSpanContext: hexToBinary,
  encodeOptionalSpanContext: optionalHexToBinary
};
function getOtlpEncoder(options) {
  var _a91, _b;
  if (options === void 0) {
    return DEFAULT_ENCODER;
  }
  var useLongBits = (_a91 = options.useLongBits) !== null && _a91 !== void 0 ? _a91 : true;
  var useHex = (_b = options.useHex) !== null && _b !== void 0 ? _b : false;
  return {
    encodeHrTime: useLongBits ? encodeAsLongBits : encodeTimestamp,
    encodeSpanContext: useHex ? identity : hexToBinary,
    encodeOptionalSpanContext: useHex ? identity : optionalHexToBinary
  };
}

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/trace/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/trace/internal.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/common/internal.js
init_checked_fetch();
init_modules_watch_stub();
var __read6 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function createInstrumentationScope(scope) {
  return {
    name: scope.name,
    version: scope.version
  };
}
function toAttributes(attributes) {
  return Object.keys(attributes).map(function(key) {
    return toKeyValue(key, attributes[key]);
  });
}
function toKeyValue(key, value) {
  return {
    key,
    value: toAnyValue(value)
  };
}
function toAnyValue(value) {
  var t = typeof value;
  if (t === "string")
    return { stringValue: value };
  if (t === "number") {
    if (!Number.isInteger(value))
      return { doubleValue: value };
    return { intValue: value };
  }
  if (t === "boolean")
    return { boolValue: value };
  if (value instanceof Uint8Array)
    return { bytesValue: value };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(toAnyValue) } };
  if (t === "object" && value != null)
    return {
      kvlistValue: {
        values: Object.entries(value).map(function(_a91) {
          var _b = __read6(_a91, 2), k = _b[0], v = _b[1];
          return toKeyValue(k, v);
        })
      }
    };
  return {};
}

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/trace/internal.js
function sdkSpanToOtlpSpan(span, encoder) {
  var _a91;
  var ctx = span.spanContext();
  var status = span.status;
  return {
    traceId: encoder.encodeSpanContext(ctx.traceId),
    spanId: encoder.encodeSpanContext(ctx.spanId),
    parentSpanId: encoder.encodeOptionalSpanContext(span.parentSpanId),
    traceState: (_a91 = ctx.traceState) === null || _a91 === void 0 ? void 0 : _a91.serialize(),
    name: span.name,
    // Span kind is offset by 1 because the API does not define a value for unset
    kind: span.kind == null ? 0 : span.kind + 1,
    startTimeUnixNano: encoder.encodeHrTime(span.startTime),
    endTimeUnixNano: encoder.encodeHrTime(span.endTime),
    attributes: toAttributes(span.attributes),
    droppedAttributesCount: span.droppedAttributesCount,
    events: span.events.map(function(event) {
      return toOtlpSpanEvent(event, encoder);
    }),
    droppedEventsCount: span.droppedEventsCount,
    status: {
      // API and proto enums share the same values
      code: status.code,
      message: status.message
    },
    links: span.links.map(function(link) {
      return toOtlpLink(link, encoder);
    }),
    droppedLinksCount: span.droppedLinksCount
  };
}
function toOtlpLink(link, encoder) {
  var _a91;
  return {
    attributes: link.attributes ? toAttributes(link.attributes) : [],
    spanId: encoder.encodeSpanContext(link.context.spanId),
    traceId: encoder.encodeSpanContext(link.context.traceId),
    traceState: (_a91 = link.context.traceState) === null || _a91 === void 0 ? void 0 : _a91.serialize(),
    droppedAttributesCount: link.droppedAttributesCount || 0
  };
}
function toOtlpSpanEvent(timedEvent, encoder) {
  return {
    attributes: timedEvent.attributes ? toAttributes(timedEvent.attributes) : [],
    name: timedEvent.name,
    timeUnixNano: encoder.encodeHrTime(timedEvent.time),
    droppedAttributesCount: timedEvent.droppedAttributesCount || 0
  };
}

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/resource/internal.js
init_checked_fetch();
init_modules_watch_stub();
function createResource(resource) {
  return {
    attributes: toAttributes(resource.attributes),
    droppedAttributesCount: 0
  };
}

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/trace/index.js
var __values3 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read7 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function createExportTraceServiceRequest(spans, options) {
  var encoder = getOtlpEncoder(options);
  return {
    resourceSpans: spanRecordsToResourceSpans(spans, encoder)
  };
}
function createResourceMap(readableSpans) {
  var e_1, _a91;
  var resourceMap = /* @__PURE__ */ new Map();
  try {
    for (var readableSpans_1 = __values3(readableSpans), readableSpans_1_1 = readableSpans_1.next(); !readableSpans_1_1.done; readableSpans_1_1 = readableSpans_1.next()) {
      var record = readableSpans_1_1.value;
      var ilmMap = resourceMap.get(record.resource);
      if (!ilmMap) {
        ilmMap = /* @__PURE__ */ new Map();
        resourceMap.set(record.resource, ilmMap);
      }
      var instrumentationLibraryKey = record.instrumentationLibrary.name + "@" + (record.instrumentationLibrary.version || "") + ":" + (record.instrumentationLibrary.schemaUrl || "");
      var records = ilmMap.get(instrumentationLibraryKey);
      if (!records) {
        records = [];
        ilmMap.set(instrumentationLibraryKey, records);
      }
      records.push(record);
    }
  } catch (e_1_1) {
    e_1 = { error: e_1_1 };
  } finally {
    try {
      if (readableSpans_1_1 && !readableSpans_1_1.done && (_a91 = readableSpans_1.return))
        _a91.call(readableSpans_1);
    } finally {
      if (e_1)
        throw e_1.error;
    }
  }
  return resourceMap;
}
function spanRecordsToResourceSpans(readableSpans, encoder) {
  var resourceMap = createResourceMap(readableSpans);
  var out = [];
  var entryIterator = resourceMap.entries();
  var entry = entryIterator.next();
  while (!entry.done) {
    var _a91 = __read7(entry.value, 2), resource = _a91[0], ilmMap = _a91[1];
    var scopeResourceSpans = [];
    var ilmIterator = ilmMap.values();
    var ilmEntry = ilmIterator.next();
    while (!ilmEntry.done) {
      var scopeSpans = ilmEntry.value;
      if (scopeSpans.length > 0) {
        var spans = scopeSpans.map(function(readableSpan) {
          return sdkSpanToOtlpSpan(readableSpan, encoder);
        });
        scopeResourceSpans.push({
          scope: createInstrumentationScope(scopeSpans[0].instrumentationLibrary),
          spans,
          schemaUrl: scopeSpans[0].instrumentationLibrary.schemaUrl
        });
      }
      ilmEntry = ilmIterator.next();
    }
    var transformedSpans = {
      resource: createResource(resource),
      scopeSpans: scopeResourceSpans,
      schemaUrl: void 0
    };
    out.push(transformedSpans);
    entry = entryIterator.next();
  }
  return out;
}

// ../../node_modules/.pnpm/@opentelemetry+resources@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+resources@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/Resource.js
init_checked_fetch();
init_modules_watch_stub();
var import_api14 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+resources@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/platform/browser/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+resources@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/platform/browser/default-service-name.js
init_checked_fetch();
init_modules_watch_stub();
function defaultServiceName() {
  return "unknown_service";
}

// ../../node_modules/.pnpm/@opentelemetry+resources@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/Resource.js
var __assign3 = function() {
  __assign3 = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign3.apply(this, arguments);
};
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var __read8 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
var Resource = (
  /** @class */
  function() {
    function Resource2(attributes, asyncAttributesPromise) {
      var _this = this;
      var _a91;
      this._attributes = attributes;
      this.asyncAttributesPending = asyncAttributesPromise != null;
      this._syncAttributes = (_a91 = this._attributes) !== null && _a91 !== void 0 ? _a91 : {};
      this._asyncAttributesPromise = asyncAttributesPromise === null || asyncAttributesPromise === void 0 ? void 0 : asyncAttributesPromise.then(function(asyncAttributes) {
        _this._attributes = Object.assign({}, _this._attributes, asyncAttributes);
        _this.asyncAttributesPending = false;
        return asyncAttributes;
      }, function(err) {
        import_api14.diag.debug("a resource's async attributes promise rejected: %s", err);
        _this.asyncAttributesPending = false;
        return {};
      });
    }
    Resource2.empty = function() {
      return Resource2.EMPTY;
    };
    Resource2.default = function() {
      var _a91;
      return new Resource2((_a91 = {}, _a91[SEMRESATTRS_SERVICE_NAME] = defaultServiceName(), _a91[SEMRESATTRS_TELEMETRY_SDK_LANGUAGE] = SDK_INFO[SEMRESATTRS_TELEMETRY_SDK_LANGUAGE], _a91[SEMRESATTRS_TELEMETRY_SDK_NAME] = SDK_INFO[SEMRESATTRS_TELEMETRY_SDK_NAME], _a91[SEMRESATTRS_TELEMETRY_SDK_VERSION] = SDK_INFO[SEMRESATTRS_TELEMETRY_SDK_VERSION], _a91));
    };
    Object.defineProperty(Resource2.prototype, "attributes", {
      get: function() {
        var _a91;
        if (this.asyncAttributesPending) {
          import_api14.diag.error("Accessing resource attributes before async attributes settled");
        }
        return (_a91 = this._attributes) !== null && _a91 !== void 0 ? _a91 : {};
      },
      enumerable: false,
      configurable: true
    });
    Resource2.prototype.waitForAsyncAttributes = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a91) {
          switch (_a91.label) {
            case 0:
              if (!this.asyncAttributesPending)
                return [3, 2];
              return [4, this._asyncAttributesPromise];
            case 1:
              _a91.sent();
              _a91.label = 2;
            case 2:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    Resource2.prototype.merge = function(other) {
      var _this = this;
      var _a91;
      if (!other)
        return this;
      var mergedSyncAttributes = __assign3(__assign3({}, this._syncAttributes), (_a91 = other._syncAttributes) !== null && _a91 !== void 0 ? _a91 : other.attributes);
      if (!this._asyncAttributesPromise && !other._asyncAttributesPromise) {
        return new Resource2(mergedSyncAttributes);
      }
      var mergedAttributesPromise = Promise.all([
        this._asyncAttributesPromise,
        other._asyncAttributesPromise
      ]).then(function(_a92) {
        var _b;
        var _c = __read8(_a92, 2), thisAsyncAttributes = _c[0], otherAsyncAttributes = _c[1];
        return __assign3(__assign3(__assign3(__assign3({}, _this._syncAttributes), thisAsyncAttributes), (_b = other._syncAttributes) !== null && _b !== void 0 ? _b : other.attributes), otherAsyncAttributes);
      });
      return new Resource2(mergedSyncAttributes, mergedAttributesPromise);
    };
    Resource2.EMPTY = new Resource2({});
    return Resource2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+otlp-transformer@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/otlp-transformer/build/esm/json/serializers.js
init_checked_fetch();
init_modules_watch_stub();
var JsonTraceSerializer = {
  serializeRequest: function(arg) {
    var request = createExportTraceServiceRequest(arg, {
      useHex: true,
      useLongBits: false
    });
    var encoder = new TextEncoder();
    return encoder.encode(JSON.stringify(request));
  },
  deserializeResponse: function(arg) {
    var decoder = new TextDecoder();
    return JSON.parse(decoder.decode(arg));
  }
};

// ../../node_modules/.pnpm/@opentelemetry+exporter-trace-otlp-http@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/exporter-trace-otlp-http/build/esm/platform/browser/OTLPTraceExporter.js
var __extends3 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var DEFAULT_COLLECTOR_RESOURCE_PATH = "v1/traces";
var DEFAULT_COLLECTOR_URL = "http://localhost:4318/" + DEFAULT_COLLECTOR_RESOURCE_PATH;
var OTLPTraceExporter = (
  /** @class */
  function(_super) {
    __extends3(OTLPTraceExporter2, _super);
    function OTLPTraceExporter2(config) {
      if (config === void 0) {
        config = {};
      }
      var _this = _super.call(this, config, JsonTraceSerializer, "application/json") || this;
      _this._headers = Object.assign(_this._headers, utils_exports.parseKeyPairsIntoRecord(getEnv().OTEL_EXPORTER_OTLP_TRACES_HEADERS));
      return _this;
    }
    OTLPTraceExporter2.prototype.getDefaultUrl = function(config) {
      return typeof config.url === "string" ? config.url : getEnv().OTEL_EXPORTER_OTLP_TRACES_ENDPOINT.length > 0 ? appendRootPathToUrlIfNeeded(getEnv().OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) : getEnv().OTEL_EXPORTER_OTLP_ENDPOINT.length > 0 ? appendResourcePathToUrl(getEnv().OTEL_EXPORTER_OTLP_ENDPOINT, DEFAULT_COLLECTOR_RESOURCE_PATH) : DEFAULT_COLLECTOR_URL;
    };
    return OTLPTraceExporter2;
  }(OTLPExporterBrowserBase)
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/Tracer.js
init_checked_fetch();
init_modules_watch_stub();
var api = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/Span.js
init_checked_fetch();
init_modules_watch_stub();
var import_api15 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/enums.js
init_checked_fetch();
init_modules_watch_stub();
var ExceptionEventName = "exception";

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/Span.js
var __values4 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read9 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
var __spreadArray2 = function(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var Span = (
  /** @class */
  function() {
    function Span2(parentTracer, context8, spanName, spanContext, kind, parentSpanId, links, startTime, _deprecatedClock, attributes) {
      if (links === void 0) {
        links = [];
      }
      this.attributes = {};
      this.links = [];
      this.events = [];
      this._droppedAttributesCount = 0;
      this._droppedEventsCount = 0;
      this._droppedLinksCount = 0;
      this.status = {
        code: import_api15.SpanStatusCode.UNSET
      };
      this.endTime = [0, 0];
      this._ended = false;
      this._duration = [-1, -1];
      this.name = spanName;
      this._spanContext = spanContext;
      this.parentSpanId = parentSpanId;
      this.kind = kind;
      this.links = links;
      var now = Date.now();
      this._performanceStartTime = otperformance.now();
      this._performanceOffset = now - (this._performanceStartTime + getTimeOrigin());
      this._startTimeProvided = startTime != null;
      this.startTime = this._getTime(startTime !== null && startTime !== void 0 ? startTime : now);
      this.resource = parentTracer.resource;
      this.instrumentationLibrary = parentTracer.instrumentationLibrary;
      this._spanLimits = parentTracer.getSpanLimits();
      this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit || 0;
      if (attributes != null) {
        this.setAttributes(attributes);
      }
      this._spanProcessor = parentTracer.getActiveSpanProcessor();
      this._spanProcessor.onStart(this, context8);
    }
    Span2.prototype.spanContext = function() {
      return this._spanContext;
    };
    Span2.prototype.setAttribute = function(key, value) {
      if (value == null || this._isSpanEnded())
        return this;
      if (key.length === 0) {
        import_api15.diag.warn("Invalid attribute key: " + key);
        return this;
      }
      if (!isAttributeValue(value)) {
        import_api15.diag.warn("Invalid attribute value set for key: " + key);
        return this;
      }
      if (Object.keys(this.attributes).length >= this._spanLimits.attributeCountLimit && !Object.prototype.hasOwnProperty.call(this.attributes, key)) {
        this._droppedAttributesCount++;
        return this;
      }
      this.attributes[key] = this._truncateToSize(value);
      return this;
    };
    Span2.prototype.setAttributes = function(attributes) {
      var e_1, _a91;
      try {
        for (var _b = __values4(Object.entries(attributes)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var _d = __read9(_c.value, 2), k = _d[0], v = _d[1];
          this.setAttribute(k, v);
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a91 = _b.return))
            _a91.call(_b);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
      return this;
    };
    Span2.prototype.addEvent = function(name, attributesOrStartTime, timeStamp) {
      if (this._isSpanEnded())
        return this;
      if (this._spanLimits.eventCountLimit === 0) {
        import_api15.diag.warn("No events allowed.");
        this._droppedEventsCount++;
        return this;
      }
      if (this.events.length >= this._spanLimits.eventCountLimit) {
        if (this._droppedEventsCount === 0) {
          import_api15.diag.debug("Dropping extra events.");
        }
        this.events.shift();
        this._droppedEventsCount++;
      }
      if (isTimeInput(attributesOrStartTime)) {
        if (!isTimeInput(timeStamp)) {
          timeStamp = attributesOrStartTime;
        }
        attributesOrStartTime = void 0;
      }
      var attributes = sanitizeAttributes(attributesOrStartTime);
      this.events.push({
        name,
        attributes,
        time: this._getTime(timeStamp),
        droppedAttributesCount: 0
      });
      return this;
    };
    Span2.prototype.addLink = function(link) {
      this.links.push(link);
      return this;
    };
    Span2.prototype.addLinks = function(links) {
      var _a91;
      (_a91 = this.links).push.apply(_a91, __spreadArray2([], __read9(links), false));
      return this;
    };
    Span2.prototype.setStatus = function(status) {
      if (this._isSpanEnded())
        return this;
      this.status = status;
      return this;
    };
    Span2.prototype.updateName = function(name) {
      if (this._isSpanEnded())
        return this;
      this.name = name;
      return this;
    };
    Span2.prototype.end = function(endTime) {
      if (this._isSpanEnded()) {
        import_api15.diag.error(this.name + " " + this._spanContext.traceId + "-" + this._spanContext.spanId + " - You can only call end() on a span once.");
        return;
      }
      this._ended = true;
      this.endTime = this._getTime(endTime);
      this._duration = hrTimeDuration(this.startTime, this.endTime);
      if (this._duration[0] < 0) {
        import_api15.diag.warn("Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.", this.startTime, this.endTime);
        this.endTime = this.startTime.slice();
        this._duration = [0, 0];
      }
      if (this._droppedEventsCount > 0) {
        import_api15.diag.warn("Dropped " + this._droppedEventsCount + " events because eventCountLimit reached");
      }
      this._spanProcessor.onEnd(this);
    };
    Span2.prototype._getTime = function(inp) {
      if (typeof inp === "number" && inp < otperformance.now()) {
        return hrTime(inp + this._performanceOffset);
      }
      if (typeof inp === "number") {
        return millisToHrTime(inp);
      }
      if (inp instanceof Date) {
        return millisToHrTime(inp.getTime());
      }
      if (isTimeInputHrTime(inp)) {
        return inp;
      }
      if (this._startTimeProvided) {
        return millisToHrTime(Date.now());
      }
      var msDuration = otperformance.now() - this._performanceStartTime;
      return addHrTimes(this.startTime, millisToHrTime(msDuration));
    };
    Span2.prototype.isRecording = function() {
      return this._ended === false;
    };
    Span2.prototype.recordException = function(exception, time) {
      var attributes = {};
      if (typeof exception === "string") {
        attributes[SEMATTRS_EXCEPTION_MESSAGE] = exception;
      } else if (exception) {
        if (exception.code) {
          attributes[SEMATTRS_EXCEPTION_TYPE] = exception.code.toString();
        } else if (exception.name) {
          attributes[SEMATTRS_EXCEPTION_TYPE] = exception.name;
        }
        if (exception.message) {
          attributes[SEMATTRS_EXCEPTION_MESSAGE] = exception.message;
        }
        if (exception.stack) {
          attributes[SEMATTRS_EXCEPTION_STACKTRACE] = exception.stack;
        }
      }
      if (attributes[SEMATTRS_EXCEPTION_TYPE] || attributes[SEMATTRS_EXCEPTION_MESSAGE]) {
        this.addEvent(ExceptionEventName, attributes, time);
      } else {
        import_api15.diag.warn("Failed to record an exception " + exception);
      }
    };
    Object.defineProperty(Span2.prototype, "duration", {
      get: function() {
        return this._duration;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Span2.prototype, "ended", {
      get: function() {
        return this._ended;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Span2.prototype, "droppedAttributesCount", {
      get: function() {
        return this._droppedAttributesCount;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Span2.prototype, "droppedEventsCount", {
      get: function() {
        return this._droppedEventsCount;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Span2.prototype, "droppedLinksCount", {
      get: function() {
        return this._droppedLinksCount;
      },
      enumerable: false,
      configurable: true
    });
    Span2.prototype._isSpanEnded = function() {
      if (this._ended) {
        import_api15.diag.warn("Can not execute the operation on ended Span {traceId: " + this._spanContext.traceId + ", spanId: " + this._spanContext.spanId + "}");
      }
      return this._ended;
    };
    Span2.prototype._truncateToLimitUtil = function(value, limit) {
      if (value.length <= limit) {
        return value;
      }
      return value.substr(0, limit);
    };
    Span2.prototype._truncateToSize = function(value) {
      var _this = this;
      var limit = this._attributeValueLengthLimit;
      if (limit <= 0) {
        import_api15.diag.warn("Attribute value limit must be positive, got " + limit);
        return value;
      }
      if (typeof value === "string") {
        return this._truncateToLimitUtil(value, limit);
      }
      if (Array.isArray(value)) {
        return value.map(function(val) {
          return typeof val === "string" ? _this._truncateToLimitUtil(val, limit) : val;
        });
      }
      return value;
    };
    return Span2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/utility.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
init_checked_fetch();
init_modules_watch_stub();
var import_api18 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOffSampler.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/Sampler.js
init_checked_fetch();
init_modules_watch_stub();
var SamplingDecision;
(function(SamplingDecision3) {
  SamplingDecision3[SamplingDecision3["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision3[SamplingDecision3["RECORD"] = 1] = "RECORD";
  SamplingDecision3[SamplingDecision3["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision || (SamplingDecision = {}));

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOffSampler.js
var AlwaysOffSampler = (
  /** @class */
  function() {
    function AlwaysOffSampler2() {
    }
    AlwaysOffSampler2.prototype.shouldSample = function() {
      return {
        decision: SamplingDecision.NOT_RECORD
      };
    };
    AlwaysOffSampler2.prototype.toString = function() {
      return "AlwaysOffSampler";
    };
    return AlwaysOffSampler2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOnSampler.js
init_checked_fetch();
init_modules_watch_stub();
var AlwaysOnSampler = (
  /** @class */
  function() {
    function AlwaysOnSampler2() {
    }
    AlwaysOnSampler2.prototype.shouldSample = function() {
      return {
        decision: SamplingDecision.RECORD_AND_SAMPLED
      };
    };
    AlwaysOnSampler2.prototype.toString = function() {
      return "AlwaysOnSampler";
    };
    return AlwaysOnSampler2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/ParentBasedSampler.js
init_checked_fetch();
init_modules_watch_stub();
var import_api16 = __toESM(require_src());
var ParentBasedSampler = (
  /** @class */
  function() {
    function ParentBasedSampler2(config) {
      var _a91, _b, _c, _d;
      this._root = config.root;
      if (!this._root) {
        globalErrorHandler(new Error("ParentBasedSampler must have a root sampler configured"));
        this._root = new AlwaysOnSampler();
      }
      this._remoteParentSampled = (_a91 = config.remoteParentSampled) !== null && _a91 !== void 0 ? _a91 : new AlwaysOnSampler();
      this._remoteParentNotSampled = (_b = config.remoteParentNotSampled) !== null && _b !== void 0 ? _b : new AlwaysOffSampler();
      this._localParentSampled = (_c = config.localParentSampled) !== null && _c !== void 0 ? _c : new AlwaysOnSampler();
      this._localParentNotSampled = (_d = config.localParentNotSampled) !== null && _d !== void 0 ? _d : new AlwaysOffSampler();
    }
    ParentBasedSampler2.prototype.shouldSample = function(context8, traceId, spanName, spanKind, attributes, links) {
      var parentContext = import_api16.trace.getSpanContext(context8);
      if (!parentContext || !(0, import_api16.isSpanContextValid)(parentContext)) {
        return this._root.shouldSample(context8, traceId, spanName, spanKind, attributes, links);
      }
      if (parentContext.isRemote) {
        if (parentContext.traceFlags & import_api16.TraceFlags.SAMPLED) {
          return this._remoteParentSampled.shouldSample(context8, traceId, spanName, spanKind, attributes, links);
        }
        return this._remoteParentNotSampled.shouldSample(context8, traceId, spanName, spanKind, attributes, links);
      }
      if (parentContext.traceFlags & import_api16.TraceFlags.SAMPLED) {
        return this._localParentSampled.shouldSample(context8, traceId, spanName, spanKind, attributes, links);
      }
      return this._localParentNotSampled.shouldSample(context8, traceId, spanName, spanKind, attributes, links);
    };
    ParentBasedSampler2.prototype.toString = function() {
      return "ParentBased{root=" + this._root.toString() + ", remoteParentSampled=" + this._remoteParentSampled.toString() + ", remoteParentNotSampled=" + this._remoteParentNotSampled.toString() + ", localParentSampled=" + this._localParentSampled.toString() + ", localParentNotSampled=" + this._localParentNotSampled.toString() + "}";
    };
    return ParentBasedSampler2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/TraceIdRatioBasedSampler.js
init_checked_fetch();
init_modules_watch_stub();
var import_api17 = __toESM(require_src());
var TraceIdRatioBasedSampler = (
  /** @class */
  function() {
    function TraceIdRatioBasedSampler2(_ratio) {
      if (_ratio === void 0) {
        _ratio = 0;
      }
      this._ratio = _ratio;
      this._ratio = this._normalize(_ratio);
      this._upperBound = Math.floor(this._ratio * 4294967295);
    }
    TraceIdRatioBasedSampler2.prototype.shouldSample = function(context8, traceId) {
      return {
        decision: (0, import_api17.isValidTraceId)(traceId) && this._accumulate(traceId) < this._upperBound ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD
      };
    };
    TraceIdRatioBasedSampler2.prototype.toString = function() {
      return "TraceIdRatioBased{" + this._ratio + "}";
    };
    TraceIdRatioBasedSampler2.prototype._normalize = function(ratio) {
      if (typeof ratio !== "number" || isNaN(ratio))
        return 0;
      return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
    };
    TraceIdRatioBasedSampler2.prototype._accumulate = function(traceId) {
      var accumulation = 0;
      for (var i = 0; i < traceId.length / 8; i++) {
        var pos = i * 8;
        var part = parseInt(traceId.slice(pos, pos + 8), 16);
        accumulation = (accumulation ^ part) >>> 0;
      }
      return accumulation;
    };
    return TraceIdRatioBasedSampler2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
var env = getEnv();
var FALLBACK_OTEL_TRACES_SAMPLER = TracesSamplerValues.AlwaysOn;
var DEFAULT_RATIO = 1;
function loadDefaultConfig() {
  return {
    sampler: buildSamplerFromEnv(env),
    forceFlushTimeoutMillis: 3e4,
    generalLimits: {
      attributeValueLengthLimit: getEnv().OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: getEnv().OTEL_ATTRIBUTE_COUNT_LIMIT
    },
    spanLimits: {
      attributeValueLengthLimit: getEnv().OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: getEnv().OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT,
      linkCountLimit: getEnv().OTEL_SPAN_LINK_COUNT_LIMIT,
      eventCountLimit: getEnv().OTEL_SPAN_EVENT_COUNT_LIMIT,
      attributePerEventCountLimit: getEnv().OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT,
      attributePerLinkCountLimit: getEnv().OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT
    }
  };
}
function buildSamplerFromEnv(environment) {
  if (environment === void 0) {
    environment = getEnv();
  }
  switch (environment.OTEL_TRACES_SAMPLER) {
    case TracesSamplerValues.AlwaysOn:
      return new AlwaysOnSampler();
    case TracesSamplerValues.AlwaysOff:
      return new AlwaysOffSampler();
    case TracesSamplerValues.ParentBasedAlwaysOn:
      return new ParentBasedSampler({
        root: new AlwaysOnSampler()
      });
    case TracesSamplerValues.ParentBasedAlwaysOff:
      return new ParentBasedSampler({
        root: new AlwaysOffSampler()
      });
    case TracesSamplerValues.TraceIdRatio:
      return new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv(environment));
    case TracesSamplerValues.ParentBasedTraceIdRatio:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv(environment))
      });
    default:
      import_api18.diag.error('OTEL_TRACES_SAMPLER value "' + environment.OTEL_TRACES_SAMPLER + " invalid, defaulting to " + FALLBACK_OTEL_TRACES_SAMPLER + '".');
      return new AlwaysOnSampler();
  }
}
function getSamplerProbabilityFromEnv(environment) {
  if (environment.OTEL_TRACES_SAMPLER_ARG === void 0 || environment.OTEL_TRACES_SAMPLER_ARG === "") {
    import_api18.diag.error("OTEL_TRACES_SAMPLER_ARG is blank, defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  var probability = Number(environment.OTEL_TRACES_SAMPLER_ARG);
  if (isNaN(probability)) {
    import_api18.diag.error("OTEL_TRACES_SAMPLER_ARG=" + environment.OTEL_TRACES_SAMPLER_ARG + " was given, but it is invalid, defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  if (probability < 0 || probability > 1) {
    import_api18.diag.error("OTEL_TRACES_SAMPLER_ARG=" + environment.OTEL_TRACES_SAMPLER_ARG + " was given, but it is out of range ([0..1]), defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  return probability;
}

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/utility.js
function mergeConfig(userConfig) {
  var perInstanceDefaults = {
    sampler: buildSamplerFromEnv()
  };
  var DEFAULT_CONFIG = loadDefaultConfig();
  var target = Object.assign({}, DEFAULT_CONFIG, perInstanceDefaults, userConfig);
  target.generalLimits = Object.assign({}, DEFAULT_CONFIG.generalLimits, userConfig.generalLimits || {});
  target.spanLimits = Object.assign({}, DEFAULT_CONFIG.spanLimits, userConfig.spanLimits || {});
  return target;
}
function reconfigureLimits(userConfig) {
  var _a91, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
  var spanLimits = Object.assign({}, userConfig.spanLimits);
  var parsedEnvConfig = getEnvWithoutDefaults();
  spanLimits.attributeCountLimit = (_f = (_e = (_d = (_b = (_a91 = userConfig.spanLimits) === null || _a91 === void 0 ? void 0 : _a91.attributeCountLimit) !== null && _b !== void 0 ? _b : (_c = userConfig.generalLimits) === null || _c === void 0 ? void 0 : _c.attributeCountLimit) !== null && _d !== void 0 ? _d : parsedEnvConfig.OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT) !== null && _e !== void 0 ? _e : parsedEnvConfig.OTEL_ATTRIBUTE_COUNT_LIMIT) !== null && _f !== void 0 ? _f : DEFAULT_ATTRIBUTE_COUNT_LIMIT;
  spanLimits.attributeValueLengthLimit = (_m = (_l = (_k = (_h = (_g = userConfig.spanLimits) === null || _g === void 0 ? void 0 : _g.attributeValueLengthLimit) !== null && _h !== void 0 ? _h : (_j = userConfig.generalLimits) === null || _j === void 0 ? void 0 : _j.attributeValueLengthLimit) !== null && _k !== void 0 ? _k : parsedEnvConfig.OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT) !== null && _l !== void 0 ? _l : parsedEnvConfig.OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT) !== null && _m !== void 0 ? _m : DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT;
  return Object.assign({}, userConfig, { spanLimits });
}

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/browser/export/BatchSpanProcessor.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/export/BatchSpanProcessorBase.js
init_checked_fetch();
init_modules_watch_stub();
var import_api19 = __toESM(require_src());
var BatchSpanProcessorBase = (
  /** @class */
  function() {
    function BatchSpanProcessorBase2(_exporter, config) {
      this._exporter = _exporter;
      this._isExporting = false;
      this._finishedSpans = [];
      this._droppedSpansCount = 0;
      var env2 = getEnv();
      this._maxExportBatchSize = typeof (config === null || config === void 0 ? void 0 : config.maxExportBatchSize) === "number" ? config.maxExportBatchSize : env2.OTEL_BSP_MAX_EXPORT_BATCH_SIZE;
      this._maxQueueSize = typeof (config === null || config === void 0 ? void 0 : config.maxQueueSize) === "number" ? config.maxQueueSize : env2.OTEL_BSP_MAX_QUEUE_SIZE;
      this._scheduledDelayMillis = typeof (config === null || config === void 0 ? void 0 : config.scheduledDelayMillis) === "number" ? config.scheduledDelayMillis : env2.OTEL_BSP_SCHEDULE_DELAY;
      this._exportTimeoutMillis = typeof (config === null || config === void 0 ? void 0 : config.exportTimeoutMillis) === "number" ? config.exportTimeoutMillis : env2.OTEL_BSP_EXPORT_TIMEOUT;
      this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
      if (this._maxExportBatchSize > this._maxQueueSize) {
        import_api19.diag.warn("BatchSpanProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize");
        this._maxExportBatchSize = this._maxQueueSize;
      }
    }
    BatchSpanProcessorBase2.prototype.forceFlush = function() {
      if (this._shutdownOnce.isCalled) {
        return this._shutdownOnce.promise;
      }
      return this._flushAll();
    };
    BatchSpanProcessorBase2.prototype.onStart = function(_span, _parentContext) {
    };
    BatchSpanProcessorBase2.prototype.onEnd = function(span) {
      if (this._shutdownOnce.isCalled) {
        return;
      }
      if ((span.spanContext().traceFlags & import_api19.TraceFlags.SAMPLED) === 0) {
        return;
      }
      this._addToBuffer(span);
    };
    BatchSpanProcessorBase2.prototype.shutdown = function() {
      return this._shutdownOnce.call();
    };
    BatchSpanProcessorBase2.prototype._shutdown = function() {
      var _this = this;
      return Promise.resolve().then(function() {
        return _this.onShutdown();
      }).then(function() {
        return _this._flushAll();
      }).then(function() {
        return _this._exporter.shutdown();
      });
    };
    BatchSpanProcessorBase2.prototype._addToBuffer = function(span) {
      if (this._finishedSpans.length >= this._maxQueueSize) {
        if (this._droppedSpansCount === 0) {
          import_api19.diag.debug("maxQueueSize reached, dropping spans");
        }
        this._droppedSpansCount++;
        return;
      }
      if (this._droppedSpansCount > 0) {
        import_api19.diag.warn("Dropped " + this._droppedSpansCount + " spans because maxQueueSize reached");
        this._droppedSpansCount = 0;
      }
      this._finishedSpans.push(span);
      this._maybeStartTimer();
    };
    BatchSpanProcessorBase2.prototype._flushAll = function() {
      var _this = this;
      return new Promise(function(resolve, reject) {
        var promises = [];
        var count = Math.ceil(_this._finishedSpans.length / _this._maxExportBatchSize);
        for (var i = 0, j = count; i < j; i++) {
          promises.push(_this._flushOneBatch());
        }
        Promise.all(promises).then(function() {
          resolve();
        }).catch(reject);
      });
    };
    BatchSpanProcessorBase2.prototype._flushOneBatch = function() {
      var _this = this;
      this._clearTimer();
      if (this._finishedSpans.length === 0) {
        return Promise.resolve();
      }
      return new Promise(function(resolve, reject) {
        var timer = setTimeout(function() {
          reject(new Error("Timeout"));
        }, _this._exportTimeoutMillis);
        import_api19.context.with(suppressTracing(import_api19.context.active()), function() {
          var spans;
          if (_this._finishedSpans.length <= _this._maxExportBatchSize) {
            spans = _this._finishedSpans;
            _this._finishedSpans = [];
          } else {
            spans = _this._finishedSpans.splice(0, _this._maxExportBatchSize);
          }
          var doExport = function() {
            return _this._exporter.export(spans, function(result) {
              var _a91;
              clearTimeout(timer);
              if (result.code === ExportResultCode.SUCCESS) {
                resolve();
              } else {
                reject((_a91 = result.error) !== null && _a91 !== void 0 ? _a91 : new Error("BatchSpanProcessor: span export failed"));
              }
            });
          };
          var pendingResources = null;
          for (var i = 0, len = spans.length; i < len; i++) {
            var span = spans[i];
            if (span.resource.asyncAttributesPending && span.resource.waitForAsyncAttributes) {
              pendingResources !== null && pendingResources !== void 0 ? pendingResources : pendingResources = [];
              pendingResources.push(span.resource.waitForAsyncAttributes());
            }
          }
          if (pendingResources === null) {
            doExport();
          } else {
            Promise.all(pendingResources).then(doExport, function(err) {
              globalErrorHandler(err);
              reject(err);
            });
          }
        });
      });
    };
    BatchSpanProcessorBase2.prototype._maybeStartTimer = function() {
      var _this = this;
      if (this._isExporting)
        return;
      var flush = function() {
        _this._isExporting = true;
        _this._flushOneBatch().finally(function() {
          _this._isExporting = false;
          if (_this._finishedSpans.length > 0) {
            _this._clearTimer();
            _this._maybeStartTimer();
          }
        }).catch(function(e) {
          _this._isExporting = false;
          globalErrorHandler(e);
        });
      };
      if (this._finishedSpans.length >= this._maxExportBatchSize) {
        return flush();
      }
      if (this._timer !== void 0)
        return;
      this._timer = setTimeout(function() {
        return flush();
      }, this._scheduledDelayMillis);
      unrefTimer(this._timer);
    };
    BatchSpanProcessorBase2.prototype._clearTimer = function() {
      if (this._timer !== void 0) {
        clearTimeout(this._timer);
        this._timer = void 0;
      }
    };
    return BatchSpanProcessorBase2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/browser/export/BatchSpanProcessor.js
var __extends4 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var BatchSpanProcessor = (
  /** @class */
  function(_super) {
    __extends4(BatchSpanProcessor2, _super);
    function BatchSpanProcessor2(_exporter, config) {
      var _this = _super.call(this, _exporter, config) || this;
      _this.onInit(config);
      return _this;
    }
    BatchSpanProcessor2.prototype.onInit = function(config) {
      var _this = this;
      if ((config === null || config === void 0 ? void 0 : config.disableAutoFlushOnDocumentHide) !== true && typeof document !== "undefined") {
        this._visibilityChangeListener = function() {
          if (document.visibilityState === "hidden") {
            void _this.forceFlush();
          }
        };
        this._pageHideListener = function() {
          void _this.forceFlush();
        };
        document.addEventListener("visibilitychange", this._visibilityChangeListener);
        document.addEventListener("pagehide", this._pageHideListener);
      }
    };
    BatchSpanProcessor2.prototype.onShutdown = function() {
      if (typeof document !== "undefined") {
        if (this._visibilityChangeListener) {
          document.removeEventListener("visibilitychange", this._visibilityChangeListener);
        }
        if (this._pageHideListener) {
          document.removeEventListener("pagehide", this._pageHideListener);
        }
      }
    };
    return BatchSpanProcessor2;
  }(BatchSpanProcessorBase)
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/browser/RandomIdGenerator.js
init_checked_fetch();
init_modules_watch_stub();
var SPAN_ID_BYTES = 8;
var TRACE_ID_BYTES = 16;
var RandomIdGenerator = (
  /** @class */
  function() {
    function RandomIdGenerator2() {
      this.generateTraceId = getIdGenerator(TRACE_ID_BYTES);
      this.generateSpanId = getIdGenerator(SPAN_ID_BYTES);
    }
    return RandomIdGenerator2;
  }()
);
var SHARED_CHAR_CODES_ARRAY = Array(32);
function getIdGenerator(bytes) {
  return function generateId() {
    for (var i = 0; i < bytes * 2; i++) {
      SHARED_CHAR_CODES_ARRAY[i] = Math.floor(Math.random() * 16) + 48;
      if (SHARED_CHAR_CODES_ARRAY[i] >= 58) {
        SHARED_CHAR_CODES_ARRAY[i] += 39;
      }
    }
    return String.fromCharCode.apply(null, SHARED_CHAR_CODES_ARRAY.slice(0, bytes * 2));
  };
}

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/Tracer.js
var Tracer = (
  /** @class */
  function() {
    function Tracer2(instrumentationLibrary, config, _tracerProvider) {
      this._tracerProvider = _tracerProvider;
      var localConfig = mergeConfig(config);
      this._sampler = localConfig.sampler;
      this._generalLimits = localConfig.generalLimits;
      this._spanLimits = localConfig.spanLimits;
      this._idGenerator = config.idGenerator || new RandomIdGenerator();
      this.resource = _tracerProvider.resource;
      this.instrumentationLibrary = instrumentationLibrary;
    }
    Tracer2.prototype.startSpan = function(name, options, context8) {
      var _a91, _b, _c;
      if (options === void 0) {
        options = {};
      }
      if (context8 === void 0) {
        context8 = api.context.active();
      }
      if (options.root) {
        context8 = api.trace.deleteSpan(context8);
      }
      var parentSpan = api.trace.getSpan(context8);
      if (isTracingSuppressed(context8)) {
        api.diag.debug("Instrumentation suppressed, returning Noop Span");
        var nonRecordingSpan = api.trace.wrapSpanContext(api.INVALID_SPAN_CONTEXT);
        return nonRecordingSpan;
      }
      var parentSpanContext = parentSpan === null || parentSpan === void 0 ? void 0 : parentSpan.spanContext();
      var spanId = this._idGenerator.generateSpanId();
      var traceId;
      var traceState;
      var parentSpanId;
      if (!parentSpanContext || !api.trace.isSpanContextValid(parentSpanContext)) {
        traceId = this._idGenerator.generateTraceId();
      } else {
        traceId = parentSpanContext.traceId;
        traceState = parentSpanContext.traceState;
        parentSpanId = parentSpanContext.spanId;
      }
      var spanKind = (_a91 = options.kind) !== null && _a91 !== void 0 ? _a91 : api.SpanKind.INTERNAL;
      var links = ((_b = options.links) !== null && _b !== void 0 ? _b : []).map(function(link) {
        return {
          context: link.context,
          attributes: sanitizeAttributes(link.attributes)
        };
      });
      var attributes = sanitizeAttributes(options.attributes);
      var samplingResult = this._sampler.shouldSample(context8, traceId, name, spanKind, attributes, links);
      traceState = (_c = samplingResult.traceState) !== null && _c !== void 0 ? _c : traceState;
      var traceFlags = samplingResult.decision === api.SamplingDecision.RECORD_AND_SAMPLED ? api.TraceFlags.SAMPLED : api.TraceFlags.NONE;
      var spanContext = { traceId, spanId, traceFlags, traceState };
      if (samplingResult.decision === api.SamplingDecision.NOT_RECORD) {
        api.diag.debug("Recording is off, propagating context in a non-recording span");
        var nonRecordingSpan = api.trace.wrapSpanContext(spanContext);
        return nonRecordingSpan;
      }
      var initAttributes = sanitizeAttributes(Object.assign(attributes, samplingResult.attributes));
      var span = new Span(this, context8, name, spanContext, spanKind, parentSpanId, links, options.startTime, void 0, initAttributes);
      return span;
    };
    Tracer2.prototype.startActiveSpan = function(name, arg2, arg3, arg4) {
      var opts;
      var ctx;
      var fn;
      if (arguments.length < 2) {
        return;
      } else if (arguments.length === 2) {
        fn = arg2;
      } else if (arguments.length === 3) {
        opts = arg2;
        fn = arg3;
      } else {
        opts = arg2;
        ctx = arg3;
        fn = arg4;
      }
      var parentContext = ctx !== null && ctx !== void 0 ? ctx : api.context.active();
      var span = this.startSpan(name, opts, parentContext);
      var contextWithSpanSet = api.trace.setSpan(parentContext, span);
      return api.context.with(contextWithSpanSet, fn, void 0, span);
    };
    Tracer2.prototype.getGeneralLimits = function() {
      return this._generalLimits;
    };
    Tracer2.prototype.getSpanLimits = function() {
      return this._spanLimits;
    };
    Tracer2.prototype.getActiveSpanProcessor = function() {
      return this._tracerProvider.getActiveSpanProcessor();
    };
    return Tracer2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/BasicTracerProvider.js
init_checked_fetch();
init_modules_watch_stub();
var import_api20 = __toESM(require_src());

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/MultiSpanProcessor.js
init_checked_fetch();
init_modules_watch_stub();
var __values5 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var MultiSpanProcessor = (
  /** @class */
  function() {
    function MultiSpanProcessor2(_spanProcessors) {
      this._spanProcessors = _spanProcessors;
    }
    MultiSpanProcessor2.prototype.forceFlush = function() {
      var e_1, _a91;
      var promises = [];
      try {
        for (var _b = __values5(this._spanProcessors), _c = _b.next(); !_c.done; _c = _b.next()) {
          var spanProcessor = _c.value;
          promises.push(spanProcessor.forceFlush());
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a91 = _b.return))
            _a91.call(_b);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
      return new Promise(function(resolve) {
        Promise.all(promises).then(function() {
          resolve();
        }).catch(function(error) {
          globalErrorHandler(error || new Error("MultiSpanProcessor: forceFlush failed"));
          resolve();
        });
      });
    };
    MultiSpanProcessor2.prototype.onStart = function(span, context8) {
      var e_2, _a91;
      try {
        for (var _b = __values5(this._spanProcessors), _c = _b.next(); !_c.done; _c = _b.next()) {
          var spanProcessor = _c.value;
          spanProcessor.onStart(span, context8);
        }
      } catch (e_2_1) {
        e_2 = { error: e_2_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a91 = _b.return))
            _a91.call(_b);
        } finally {
          if (e_2)
            throw e_2.error;
        }
      }
    };
    MultiSpanProcessor2.prototype.onEnd = function(span) {
      var e_3, _a91;
      try {
        for (var _b = __values5(this._spanProcessors), _c = _b.next(); !_c.done; _c = _b.next()) {
          var spanProcessor = _c.value;
          spanProcessor.onEnd(span);
        }
      } catch (e_3_1) {
        e_3 = { error: e_3_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a91 = _b.return))
            _a91.call(_b);
        } finally {
          if (e_3)
            throw e_3.error;
        }
      }
    };
    MultiSpanProcessor2.prototype.shutdown = function() {
      var e_4, _a91;
      var promises = [];
      try {
        for (var _b = __values5(this._spanProcessors), _c = _b.next(); !_c.done; _c = _b.next()) {
          var spanProcessor = _c.value;
          promises.push(spanProcessor.shutdown());
        }
      } catch (e_4_1) {
        e_4 = { error: e_4_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a91 = _b.return))
            _a91.call(_b);
        } finally {
          if (e_4)
            throw e_4.error;
        }
      }
      return new Promise(function(resolve, reject) {
        Promise.all(promises).then(function() {
          resolve();
        }, reject);
      });
    };
    return MultiSpanProcessor2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/export/NoopSpanProcessor.js
init_checked_fetch();
init_modules_watch_stub();
var NoopSpanProcessor = (
  /** @class */
  function() {
    function NoopSpanProcessor2() {
    }
    NoopSpanProcessor2.prototype.onStart = function(_span, _context) {
    };
    NoopSpanProcessor2.prototype.onEnd = function(_span) {
    };
    NoopSpanProcessor2.prototype.shutdown = function() {
      return Promise.resolve();
    };
    NoopSpanProcessor2.prototype.forceFlush = function() {
      return Promise.resolve();
    };
    return NoopSpanProcessor2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/BasicTracerProvider.js
var ForceFlushState;
(function(ForceFlushState2) {
  ForceFlushState2[ForceFlushState2["resolved"] = 0] = "resolved";
  ForceFlushState2[ForceFlushState2["timeout"] = 1] = "timeout";
  ForceFlushState2[ForceFlushState2["error"] = 2] = "error";
  ForceFlushState2[ForceFlushState2["unresolved"] = 3] = "unresolved";
})(ForceFlushState || (ForceFlushState = {}));
var BasicTracerProvider = (
  /** @class */
  function() {
    function BasicTracerProvider2(config) {
      if (config === void 0) {
        config = {};
      }
      var _a91;
      this._registeredSpanProcessors = [];
      this._tracers = /* @__PURE__ */ new Map();
      var mergedConfig = merge({}, loadDefaultConfig(), reconfigureLimits(config));
      this.resource = (_a91 = mergedConfig.resource) !== null && _a91 !== void 0 ? _a91 : Resource.empty();
      this.resource = Resource.default().merge(this.resource);
      this._config = Object.assign({}, mergedConfig, {
        resource: this.resource
      });
      var defaultExporter = this._buildExporterFromEnv();
      if (defaultExporter !== void 0) {
        var batchProcessor = new BatchSpanProcessor(defaultExporter);
        this.activeSpanProcessor = batchProcessor;
      } else {
        this.activeSpanProcessor = new NoopSpanProcessor();
      }
    }
    BasicTracerProvider2.prototype.getTracer = function(name, version2, options) {
      var key = name + "@" + (version2 || "") + ":" + ((options === null || options === void 0 ? void 0 : options.schemaUrl) || "");
      if (!this._tracers.has(key)) {
        this._tracers.set(key, new Tracer({ name, version: version2, schemaUrl: options === null || options === void 0 ? void 0 : options.schemaUrl }, this._config, this));
      }
      return this._tracers.get(key);
    };
    BasicTracerProvider2.prototype.addSpanProcessor = function(spanProcessor) {
      if (this._registeredSpanProcessors.length === 0) {
        this.activeSpanProcessor.shutdown().catch(function(err) {
          return import_api20.diag.error("Error while trying to shutdown current span processor", err);
        });
      }
      this._registeredSpanProcessors.push(spanProcessor);
      this.activeSpanProcessor = new MultiSpanProcessor(this._registeredSpanProcessors);
    };
    BasicTracerProvider2.prototype.getActiveSpanProcessor = function() {
      return this.activeSpanProcessor;
    };
    BasicTracerProvider2.prototype.register = function(config) {
      if (config === void 0) {
        config = {};
      }
      import_api20.trace.setGlobalTracerProvider(this);
      if (config.propagator === void 0) {
        config.propagator = this._buildPropagatorFromEnv();
      }
      if (config.contextManager) {
        import_api20.context.setGlobalContextManager(config.contextManager);
      }
      if (config.propagator) {
        import_api20.propagation.setGlobalPropagator(config.propagator);
      }
    };
    BasicTracerProvider2.prototype.forceFlush = function() {
      var timeout = this._config.forceFlushTimeoutMillis;
      var promises = this._registeredSpanProcessors.map(function(spanProcessor) {
        return new Promise(function(resolve) {
          var state;
          var timeoutInterval = setTimeout(function() {
            resolve(new Error("Span processor did not completed within timeout period of " + timeout + " ms"));
            state = ForceFlushState.timeout;
          }, timeout);
          spanProcessor.forceFlush().then(function() {
            clearTimeout(timeoutInterval);
            if (state !== ForceFlushState.timeout) {
              state = ForceFlushState.resolved;
              resolve(state);
            }
          }).catch(function(error) {
            clearTimeout(timeoutInterval);
            state = ForceFlushState.error;
            resolve(error);
          });
        });
      });
      return new Promise(function(resolve, reject) {
        Promise.all(promises).then(function(results) {
          var errors = results.filter(function(result) {
            return result !== ForceFlushState.resolved;
          });
          if (errors.length > 0) {
            reject(errors);
          } else {
            resolve();
          }
        }).catch(function(error) {
          return reject([error]);
        });
      });
    };
    BasicTracerProvider2.prototype.shutdown = function() {
      return this.activeSpanProcessor.shutdown();
    };
    BasicTracerProvider2.prototype._getPropagator = function(name) {
      var _a91;
      return (_a91 = this.constructor._registeredPropagators.get(name)) === null || _a91 === void 0 ? void 0 : _a91();
    };
    BasicTracerProvider2.prototype._getSpanExporter = function(name) {
      var _a91;
      return (_a91 = this.constructor._registeredExporters.get(name)) === null || _a91 === void 0 ? void 0 : _a91();
    };
    BasicTracerProvider2.prototype._buildPropagatorFromEnv = function() {
      var _this = this;
      var uniquePropagatorNames = Array.from(new Set(getEnv().OTEL_PROPAGATORS));
      var propagators = uniquePropagatorNames.map(function(name) {
        var propagator = _this._getPropagator(name);
        if (!propagator) {
          import_api20.diag.warn('Propagator "' + name + '" requested through environment variable is unavailable.');
        }
        return propagator;
      });
      var validPropagators = propagators.reduce(function(list, item) {
        if (item) {
          list.push(item);
        }
        return list;
      }, []);
      if (validPropagators.length === 0) {
        return;
      } else if (uniquePropagatorNames.length === 1) {
        return validPropagators[0];
      } else {
        return new CompositePropagator({
          propagators: validPropagators
        });
      }
    };
    BasicTracerProvider2.prototype._buildExporterFromEnv = function() {
      var exporterName = getEnv().OTEL_TRACES_EXPORTER;
      if (exporterName === "none" || exporterName === "")
        return;
      var exporter = this._getSpanExporter(exporterName);
      if (!exporter) {
        import_api20.diag.error('Exporter "' + exporterName + '" requested through environment variable is unavailable.');
      }
      return exporter;
    };
    BasicTracerProvider2._registeredPropagators = /* @__PURE__ */ new Map([
      ["tracecontext", function() {
        return new W3CTraceContextPropagator();
      }],
      ["baggage", function() {
        return new W3CBaggagePropagator();
      }]
    ]);
    BasicTracerProvider2._registeredExporters = /* @__PURE__ */ new Map();
    return BasicTracerProvider2;
  }()
);

// ../../node_modules/.pnpm/@opentelemetry+sdk-trace-base@1.25.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/export/SimpleSpanProcessor.js
init_checked_fetch();
init_modules_watch_stub();
var import_api21 = __toESM(require_src());
var __awaiter2 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator2 = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var SimpleSpanProcessor = (
  /** @class */
  function() {
    function SimpleSpanProcessor2(_exporter) {
      this._exporter = _exporter;
      this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
      this._unresolvedExports = /* @__PURE__ */ new Set();
    }
    SimpleSpanProcessor2.prototype.forceFlush = function() {
      return __awaiter2(this, void 0, void 0, function() {
        return __generator2(this, function(_a91) {
          switch (_a91.label) {
            case 0:
              return [4, Promise.all(Array.from(this._unresolvedExports))];
            case 1:
              _a91.sent();
              if (!this._exporter.forceFlush)
                return [3, 3];
              return [4, this._exporter.forceFlush()];
            case 2:
              _a91.sent();
              _a91.label = 3;
            case 3:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    SimpleSpanProcessor2.prototype.onStart = function(_span, _parentContext) {
    };
    SimpleSpanProcessor2.prototype.onEnd = function(span) {
      var _this = this;
      var _a91, _b;
      if (this._shutdownOnce.isCalled) {
        return;
      }
      if ((span.spanContext().traceFlags & import_api21.TraceFlags.SAMPLED) === 0) {
        return;
      }
      var doExport = function() {
        return internal._export(_this._exporter, [span]).then(function(result) {
          var _a92;
          if (result.code !== ExportResultCode.SUCCESS) {
            globalErrorHandler((_a92 = result.error) !== null && _a92 !== void 0 ? _a92 : new Error("SimpleSpanProcessor: span export failed (status " + result + ")"));
          }
        }).catch(function(error) {
          globalErrorHandler(error);
        });
      };
      if (span.resource.asyncAttributesPending) {
        var exportPromise_1 = (_b = (_a91 = span.resource).waitForAsyncAttributes) === null || _b === void 0 ? void 0 : _b.call(_a91).then(function() {
          if (exportPromise_1 != null) {
            _this._unresolvedExports.delete(exportPromise_1);
          }
          return doExport();
        }, function(err) {
          return globalErrorHandler(err);
        });
        if (exportPromise_1 != null) {
          this._unresolvedExports.add(exportPromise_1);
        }
      } else {
        void doExport();
      }
    };
    SimpleSpanProcessor2.prototype.shutdown = function() {
      return this._shutdownOnce.call();
    };
    SimpleSpanProcessor2.prototype._shutdown = function() {
      return this._exporter.shutdown();
    };
    return SimpleSpanProcessor2;
  }()
);

// ../../packages/client-library-otel/dist/async-hooks/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../packages/client-library-otel/dist/async-hooks/AsyncLocalStorageContextManager.js
init_checked_fetch();
init_modules_watch_stub();
var import_api22 = __toESM(require_src(), 1);
import { AsyncLocalStorage } from "node:async_hooks";

// ../../packages/client-library-otel/dist/async-hooks/AbstractAsyncHooksContextManager.js
init_checked_fetch();
init_modules_watch_stub();
import { EventEmitter } from "node:events";
function _class_call_check(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _create_class(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _define_property(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _instanceof(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
var ADD_LISTENER_METHODS = [
  "addListener",
  "on",
  "once",
  "prependListener",
  "prependOnceListener"
];
var AbstractAsyncHooksContextManager = /* @__PURE__ */ function() {
  "use strict";
  function AbstractAsyncHooksContextManager2() {
    _class_call_check(this, AbstractAsyncHooksContextManager2);
    _define_property(this, "_kOtListeners", Symbol("OtListeners"));
    _define_property(this, "_wrapped", false);
  }
  _create_class(AbstractAsyncHooksContextManager2, [
    {
      /**
      * Binds a the certain context or the active one to the target function and then returns the target
      * @param context A context (span) to be bind to target
      * @param target a function or event emitter. When target or one of its callbacks is called,
      *  the provided context will be used as the active context for the duration of the call.
      */
      key: "bind",
      value: function bind(context8, target) {
        if (_instanceof(target, EventEmitter)) {
          return this._bindEventEmitter(context8, target);
        }
        if (typeof target === "function") {
          return this._bindFunction(context8, target);
        }
        return target;
      }
    },
    {
      key: "_bindFunction",
      value: (
        // biome-ignore lint/complexity/noBannedTypes: this is from the original code
        function _bindFunction(context8, target) {
          var manager = this;
          var contextWrapper = function contextWrapper2() {
            var _this = this;
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }
            return manager.with(context8, function() {
              return target.apply(_this, args);
            });
          };
          Object.defineProperty(contextWrapper, "length", {
            enumerable: false,
            configurable: true,
            writable: false,
            value: target.length
          });
          return contextWrapper;
        }
      )
    },
    {
      key: "_bindEventEmitter",
      value: (
        /**
        * By default, EventEmitter call their callback with their context, which we do
        * not want, instead we will bind a specific context to all callbacks that
        * go through it.
        * @param context the context we want to bind
        * @param ee EventEmitter an instance of EventEmitter to patch
        */
        function _bindEventEmitter(context8, ee) {
          var _this = this;
          var map = this._getPatchMap(ee);
          if (map !== void 0) {
            return ee;
          }
          this._createPatchMap(ee);
          ADD_LISTENER_METHODS.forEach(function(methodName) {
            if (ee[methodName] === void 0) {
              return;
            }
            ee[methodName] = _this._patchAddListener(ee, ee[methodName], context8);
          });
          if (typeof ee.removeListener === "function") {
            ee.removeListener = this._patchRemoveListener(ee, ee.removeListener);
          }
          if (typeof ee.off === "function") {
            ee.off = this._patchRemoveListener(ee, ee.off);
          }
          if (typeof ee.removeAllListeners === "function") {
            ee.removeAllListeners = this._patchRemoveAllListeners(ee, ee.removeAllListeners);
          }
          return ee;
        }
      )
    },
    {
      key: "_patchRemoveListener",
      value: (
        /**
        * Patch methods that remove a given listener so that we match the "patched"
        * version of that listener (the one that propagate context).
        * @param ee EventEmitter instance
        * @param original reference to the patched method
        */
        // biome-ignore lint/complexity/noBannedTypes: this is from the original code
        function _patchRemoveListener(ee, original) {
          var contextManager = this;
          return function(event, listener) {
            var _contextManager__getPatchMap;
            var events = (_contextManager__getPatchMap = contextManager._getPatchMap(ee)) === null || _contextManager__getPatchMap === void 0 ? void 0 : _contextManager__getPatchMap[event];
            if (events === void 0) {
              return original.call(this, event, listener);
            }
            var patchedListener = events.get(listener);
            return original.call(this, event, patchedListener || listener);
          };
        }
      )
    },
    {
      key: "_patchRemoveAllListeners",
      value: (
        /**
        * Patch methods that remove all listeners so we remove our
        * internal references for a given event.
        * @param ee EventEmitter instance
        * @param original reference to the patched method
        */
        // biome-ignore lint/complexity/noBannedTypes: this is from the original code
        function _patchRemoveAllListeners(ee, original) {
          var contextManager = this;
          return function(event) {
            var map = contextManager._getPatchMap(ee);
            if (map !== void 0) {
              if (arguments.length === 0) {
                contextManager._createPatchMap(ee);
              } else if (map[event] !== void 0) {
                delete map[event];
              }
            }
            return original.apply(this, arguments);
          };
        }
      )
    },
    {
      key: "_patchAddListener",
      value: (
        /**
        * Patch methods on an event emitter instance that can add listeners so we
        * can force them to propagate a given context.
        * @param ee EventEmitter instance
        * @param original reference to the patched method
        * @param [context] context to propagate when calling listeners
        */
        function _patchAddListener(ee, original, context8) {
          var contextManager = this;
          return function(event, listener) {
            if (contextManager._wrapped) {
              return original.call(this, event, listener);
            }
            var map = contextManager._getPatchMap(ee);
            if (map === void 0) {
              map = contextManager._createPatchMap(ee);
            }
            var listeners = map[event];
            if (listeners === void 0) {
              listeners = /* @__PURE__ */ new WeakMap();
              map[event] = listeners;
            }
            var patchedListener = contextManager.bind(context8, listener);
            listeners.set(listener, patchedListener);
            contextManager._wrapped = true;
            try {
              return original.call(this, event, patchedListener);
            } finally {
              contextManager._wrapped = false;
            }
          };
        }
      )
    },
    {
      key: "_createPatchMap",
      value: function _createPatchMap(ee) {
        var map = /* @__PURE__ */ Object.create(null);
        ee[this._kOtListeners] = map;
        return map;
      }
    },
    {
      key: "_getPatchMap",
      value: function _getPatchMap(ee) {
        return ee[this._kOtListeners];
      }
    }
  ]);
  return AbstractAsyncHooksContextManager2;
}();

// ../../packages/client-library-otel/dist/async-hooks/AsyncLocalStorageContextManager.js
function _array_like_to_array(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _array_without_holes(arr) {
  if (Array.isArray(arr))
    return _array_like_to_array(arr);
}
function _assert_this_initialized(self2) {
  if (self2 === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self2;
}
function _class_call_check2(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties2(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _create_class2(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties2(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties2(Constructor, staticProps);
  return Constructor;
}
function _define_property2(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _get_prototype_of(o) {
  _get_prototype_of = Object.setPrototypeOf ? Object.getPrototypeOf : function getPrototypeOf(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _get_prototype_of(o);
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass)
    _set_prototype_of(subClass, superClass);
}
function _iterable_to_array(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _non_iterable_spread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _possible_constructor_return(self2, call) {
  if (call && (_type_of(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assert_this_initialized(self2);
}
function _set_prototype_of(o, p) {
  _set_prototype_of = Object.setPrototypeOf || function setPrototypeOf(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _set_prototype_of(o, p);
}
function _to_consumable_array(arr) {
  return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _type_of(obj) {
  "@swc/helpers - typeof";
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _array_like_to_array(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _array_like_to_array(o, minLen);
}
function _is_native_reflect_construct() {
  if (typeof Reflect === "undefined" || !Reflect.construct)
    return false;
  if (Reflect.construct.sham)
    return false;
  if (typeof Proxy === "function")
    return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
    return true;
  } catch (e) {
    return false;
  }
}
function _create_super(Derived) {
  var hasNativeReflectConstruct = _is_native_reflect_construct();
  return function _createSuperInternal() {
    var Super = _get_prototype_of(Derived), result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _get_prototype_of(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possible_constructor_return(this, result);
  };
}
var AsyncLocalStorageContextManager = /* @__PURE__ */ function(AbstractAsyncHooksContextManager2) {
  "use strict";
  _inherits(AsyncLocalStorageContextManager2, AbstractAsyncHooksContextManager2);
  var _super = _create_super(AsyncLocalStorageContextManager2);
  function AsyncLocalStorageContextManager2() {
    _class_call_check2(this, AsyncLocalStorageContextManager2);
    var _this;
    _this = _super.call(this);
    _define_property2(_assert_this_initialized(_this), "_asyncLocalStorage", void 0);
    _this._asyncLocalStorage = new AsyncLocalStorage();
    return _this;
  }
  _create_class2(AsyncLocalStorageContextManager2, [
    {
      key: "active",
      value: function active() {
        var _this__asyncLocalStorage_getStore;
        return (_this__asyncLocalStorage_getStore = this._asyncLocalStorage.getStore()) !== null && _this__asyncLocalStorage_getStore !== void 0 ? _this__asyncLocalStorage_getStore : import_api22.ROOT_CONTEXT;
      }
    },
    {
      key: "with",
      value: function _with(context8, fn, thisArg) {
        for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
          args[_key - 3] = arguments[_key];
        }
        var _this__asyncLocalStorage;
        var cb = thisArg == null ? fn : fn.bind(thisArg);
        return (_this__asyncLocalStorage = this._asyncLocalStorage).run.apply(_this__asyncLocalStorage, [
          context8,
          cb
        ].concat(_to_consumable_array(args)));
      }
    },
    {
      key: "enable",
      value: function enable() {
        return this;
      }
    },
    {
      key: "disable",
      value: function disable() {
        this._asyncLocalStorage.disable();
        return this;
      }
    }
  ]);
  return AsyncLocalStorageContextManager2;
}(AbstractAsyncHooksContextManager);

// ../../packages/client-library-otel/dist/constants.js
init_checked_fetch();
init_modules_watch_stub();
var ENV_FPX_ENDPOINT = "FPX_ENDPOINT";
var ENV_FPX_LOG_LEVEL = "FPX_LOG_LEVEL";
var ENV_FPX_SERVICE_NAME = "FPX_SERVICE_NAME";
var EXTRA_SEMATTRS_HTTP_REQUEST_METHOD = "http.request.method";
var EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
var EXTRA_SEMATTRS_URL_FULL = "url.full";
var FPX_REQUEST_PATHNAME = "fpx.http.request.pathname";
var FPX_REQUEST_SEARCH = "fpx.http.request.search";
var FPX_REQUEST_SCHEME = "fpx.http.request.scheme";
var FPX_REQUEST_BODY = "fpx.http.request.body";
var FPX_REQUEST_ENV = "fpx.http.request.env";
var FPX_RESPONSE_BODY = "fpx.http.response.body";
var CF_BINDING_TYPE = "cf.binding.type";
var CF_BINDING_NAME = "cf.binding.name";
var CF_BINDING_METHOD = "cf.binding.method";
var CF_BINDING_RESULT = "cf.binding.result";
var CF_BINDING_ERROR = "cf.binding.error";

// ../../packages/client-library-otel/dist/logger.js
init_checked_fetch();
init_modules_watch_stub();
function _array_like_to_array2(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _array_without_holes2(arr) {
  if (Array.isArray(arr))
    return _array_like_to_array2(arr);
}
function _iterable_to_array2(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _non_iterable_spread2() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array2(arr) {
  return _array_without_holes2(arr) || _iterable_to_array2(arr) || _unsupported_iterable_to_array2(arr) || _non_iterable_spread2();
}
function _unsupported_iterable_to_array2(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _array_like_to_array2(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _array_like_to_array2(o, minLen);
}
var logLevels = [
  "debug",
  "info",
  "warn",
  "error"
];
var debugLog = console.debug.bind(console);
var infoLog = console.info.bind(console);
var warnLog = console.warn.bind(console);
var errorLog = console.error.bind(console);
var ourConsole = {
  debug: debugLog,
  info: infoLog,
  warn: warnLog,
  error: errorLog
};
function getLogger(level) {
  var defaultLogLevel = "warn";
  var currentLogLevel = isLogLevel(level) ? level : defaultLogLevel;
  function shouldLog(level2) {
    var currentLevelIndex = logLevels.indexOf(currentLogLevel);
    var messageLevelIndex = logLevels.indexOf(level2);
    return messageLevelIndex >= currentLevelIndex;
  }
  var logger = logLevels.reduce(function(acc, level2) {
    acc[level2] = function(message) {
      for (var _len = arguments.length, optionalParams = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        optionalParams[_key - 1] = arguments[_key];
      }
      if (shouldLog(level2)) {
        var _ourConsole;
        (_ourConsole = ourConsole)[level2].apply(_ourConsole, [
          "[@fiberplane]",
          message
        ].concat(_to_consumable_array2(optionalParams)));
      }
    };
    return acc;
  }, {});
  return logger;
}
function isLogLevel(level) {
  return logLevels.includes(level);
}

// ../../packages/client-library-otel/dist/measure.js
init_checked_fetch();
init_modules_watch_stub();
var import_api23 = __toESM(require_src(), 1);

// ../../packages/client-library-otel/dist/utils/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../packages/client-library-otel/dist/utils/env.js
init_checked_fetch();
init_modules_watch_stub();
function _type_of2(obj) {
  "@swc/helpers - typeof";
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function getFromEnv(honoEnv, key) {
  var env2 = getNodeSafeEnv(honoEnv);
  return (typeof env2 === "undefined" ? "undefined" : _type_of2(env2)) === "object" && env2 !== null ? env2 === null || env2 === void 0 ? void 0 : env2[key] : null;
}
function getNodeSafeEnv(honoEnv) {
  var hasProcessEnv = runtimeHasProcessEnv();
  var isRunningInHonoNode = isHonoNodeEnv(honoEnv);
  return hasProcessEnv && isRunningInHonoNode ? process.env : honoEnv;
}
function runtimeHasProcessEnv() {
  if (typeof process !== "undefined" && typeof process.env !== "undefined") {
    return true;
  }
  return false;
}
function isHonoNodeEnv(env2) {
  if ((typeof env2 === "undefined" ? "undefined" : _type_of2(env2)) !== "object" || env2 === null) {
    return false;
  }
  var envKeys = Object.keys(env2).map(function(key) {
    return key.toLowerCase();
  });
  return envKeys.length === 2 && envKeys.includes("incoming") && envKeys.includes("outgoing");
}

// ../../packages/client-library-otel/dist/utils/errors.js
init_checked_fetch();
init_modules_watch_stub();
function _instanceof2(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
function _type_of3(obj) {
  "@swc/helpers - typeof";
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function errorToJson(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}
function isLikelyNeonDbError(error) {
  return (typeof error === "undefined" ? "undefined" : _type_of3(error)) === "object" && error !== null && "name" in error && typeof error.name === "string" && "message" in error && typeof error.message === "string" && (!("sourceError" in error) || _instanceof2(error.sourceError, Error));
}
function neonDbErrorToJson(error) {
  var _error_sourceError;
  return {
    name: error.name,
    message: error.message,
    sourceError: error.sourceError ? errorToJson(error.sourceError) : void 0,
    // NOTE - NeonDbError does not include a stack trace! https://github.com/neondatabase/serverless/issues/82
    stack: error === null || error === void 0 ? void 0 : (_error_sourceError = error.sourceError) === null || _error_sourceError === void 0 ? void 0 : _error_sourceError.stack
  };
}

// ../../packages/client-library-otel/dist/utils/json.js
init_checked_fetch();
init_modules_watch_stub();
function _instanceof3(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
function _type_of4(obj) {
  "@swc/helpers - typeof";
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function safelySerializeJSON(obj) {
  var seen = /* @__PURE__ */ new WeakSet();
  return JSON.stringify(obj, function(_key, value) {
    if (isUintArray(value)) {
      return "BINARY";
    }
    if ((typeof value === "undefined" ? "undefined" : _type_of4(value)) === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  });
}
function isUintArray(arr) {
  return _instanceof3(arr, Uint8Array) || _instanceof3(arr, Uint16Array) || _instanceof3(arr, Uint32Array);
}

// ../../packages/client-library-otel/dist/utils/request.js
init_checked_fetch();
init_modules_watch_stub();
function _array_like_to_array3(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _array_with_holes(arr) {
  if (Array.isArray(arr))
    return arr;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _async_to_generator(fn) {
  return function() {
    var self2 = this, args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self2, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(void 0);
    });
  };
}
function _define_property3(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _instanceof4(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
function _iterable_to_array_limit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null)
    return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i)
        break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null)
        _i["return"]();
    } finally {
      if (_d)
        throw _e;
    }
  }
  return _arr;
}
function _non_iterable_rest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);
    if (typeof Object.getOwnPropertySymbols === "function") {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }
    ownKeys.forEach(function(key) {
      _define_property3(target, key, source[key]);
    });
  }
  return target;
}
function _sliced_to_array(arr, i) {
  return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array3(arr, i) || _non_iterable_rest();
}
function _unsupported_iterable_to_array3(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _array_like_to_array3(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _array_like_to_array3(o, minLen);
}
function _ts_generator(thisArg, body) {
  var f, y, t, g, _ = {
    label: 0,
    sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  };
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([
        n,
        v
      ]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [
            op[0] & 2,
            t.value
          ];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };
          case 5:
            _.label++;
            y = op[1];
            op = [
              0
            ];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [
          6,
          e
        ];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
}
function headersToObject(headers) {
  var returnObject = {};
  headers.forEach(function(value, key) {
    returnObject[key] = value;
  });
  return returnObject;
}
function getRootRequestAttributes(request, honoEnv) {
  return _getRootRequestAttributes.apply(this, arguments);
}
function _getRootRequestAttributes() {
  _getRootRequestAttributes = _async_to_generator(function(request, honoEnv) {
    var attributes, env2, bodyAttr, headers, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _step_value, key, value;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          attributes = {};
          env2 = getNodeSafeEnv(honoEnv);
          if (env2) {
            attributes[FPX_REQUEST_ENV] = safelySerializeJSON(env2);
          }
          if (!request.body)
            return [
              3,
              2
            ];
          return [
            4,
            formatRootRequestBody(request)
          ];
        case 1:
          bodyAttr = _state.sent();
          if (bodyAttr) {
            attributes = _object_spread({}, attributes, bodyAttr);
          }
          _state.label = 2;
        case 2:
          if (request.headers) {
            headers = headersToObject(new Headers(request.headers));
            _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = void 0;
            try {
              for (_iterator = Object.entries(headers)[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                _step_value = _sliced_to_array(_step.value, 2), key = _step_value[0], value = _step_value[1];
                attributes["http.request.header.".concat(key)] = value;
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          }
          return [
            2,
            attributes
          ];
      }
    });
  });
  return _getRootRequestAttributes.apply(this, arguments);
}
function formatRootRequestBody(request) {
  return _formatRootRequestBody.apply(this, arguments);
}
function _formatRootRequestBody() {
  _formatRootRequestBody = _async_to_generator(function(request) {
    var contentType, shouldParseAsText, _tmp, formData, textifiedFormData;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          if (!request.body) {
            return [
              2,
              null
            ];
          }
          contentType = request.headers.get("content-type");
          shouldParseAsText = (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json")) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes("text/")) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes("x-www-form-urlencoded"));
          if (!shouldParseAsText)
            return [
              3,
              2
            ];
          _tmp = [
            {},
            FPX_REQUEST_BODY
          ];
          return [
            4,
            request.text()
          ];
        case 1:
          return [
            2,
            _define_property3.apply(void 0, _tmp.concat([
              _state.sent()
            ]))
          ];
        case 2:
          if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes("multipart/form-data")))
            return [
              3,
              4
            ];
          return [
            4,
            request.formData()
          ];
        case 3:
          formData = _state.sent();
          textifiedFormData = formDataToJson(formData);
          return [
            2,
            _define_property3({}, FPX_REQUEST_BODY, textifiedFormData)
          ];
        case 4:
          return [
            2,
            _define_property3({}, FPX_REQUEST_BODY, formatBody(request.body))
          ];
      }
    });
  });
  return _formatRootRequestBody.apply(this, arguments);
}
function getRequestAttributes(input, init) {
  var requestMethod = typeof input === "string" || _instanceof4(input, URL) ? "GET" : input.method;
  var requestUrl = _instanceof4(input, Request) ? input.url : input;
  var url = new URL(requestUrl);
  var urlScheme = url.protocol.replace(":", "");
  var _obj;
  var attributes = (_obj = {}, _define_property3(_obj, EXTRA_SEMATTRS_HTTP_REQUEST_METHOD, requestMethod), // [HTTP_REQUEST_METHOD_ORIGINAL]: request.method,
  // TODO: remove login/password from URL (if we want to follow
  // the otel spec for this attribute)
  // TODO: think about how to handle a redirect
  _define_property3(_obj, EXTRA_SEMATTRS_URL_FULL, url.toString()), // Bunch of custom attributes even though some experimental
  // packages from otel already have similar attributes
  _define_property3(_obj, FPX_REQUEST_PATHNAME, url.pathname), _define_property3(_obj, FPX_REQUEST_SEARCH, url.search), // TODO: Add path
  // [SEMATTRS_]
  _define_property3(_obj, FPX_REQUEST_SCHEME, urlScheme), _obj);
  if (init) {
    var body = init.body;
    if (body != null) {
      attributes[FPX_REQUEST_BODY] = formatBody(body);
    }
    if (init.headers) {
      var headers = headersToObject(new Headers(init.headers));
      var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = void 0;
      try {
        for (var _iterator = Object.entries(headers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step_value = _sliced_to_array(_step.value, 2), key = _step_value[0], value = _step_value[1];
          attributes["http.request.header.".concat(key)] = value;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }
  return attributes;
}
function formatBody(body) {
  if (_instanceof4(body, FormData)) {
    return formDataToJson(body);
  }
  if (_instanceof4(body, ArrayBuffer) || ArrayBuffer.isView(body)) {
    return "#fpx.arrayBuffer";
  }
  if (_instanceof4(body, ReadableStream)) {
    return "#fpx.stream";
  }
  if (_instanceof4(body, Blob)) {
    return "#fpx.blob";
  }
  if (_instanceof4(body, URLSearchParams)) {
    return body.toString();
  }
  return body;
}
function formDataToJson(formData) {
  var jsonObject = {};
  var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = void 0;
  try {
    for (var _iterator = formData.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step_value = _sliced_to_array(_step.value, 2), key = _step_value[0], value = _step_value[1];
      if (jsonObject[key]) {
        if (!Array.isArray(jsonObject[key])) {
          jsonObject[key] = [
            jsonObject[key]
          ];
        }
        jsonObject[key].push(value ? formDataValueToString(value) : value);
      } else {
        jsonObject[key] = value ? formDataValueToString(value) : value;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
  return JSON.stringify(jsonObject);
}
function formDataValueToString(value) {
  if (_instanceof4(value, File)) {
    var _value_name;
    return (_value_name = value.name) !== null && _value_name !== void 0 ? _value_name : "#fpx.file.{".concat(value.name, "}.{").concat(value.size, "}");
  }
  return value;
}
function tryGetResponseBodyAsText(response) {
  return _tryGetResponseBodyAsText.apply(this, arguments);
}
function _tryGetResponseBodyAsText() {
  _tryGetResponseBodyAsText = _async_to_generator(function(response) {
    var contentType, e;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          contentType = response.headers.get("content-type");
          if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("image/")) {
            return [
              2,
              "#fpx.image"
            ];
          }
          if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/pdf")) {
            return [
              2,
              "#fpx.pdf"
            ];
          }
          if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/zip")) {
            return [
              2,
              "#fpx.zip"
            ];
          }
          if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("audio/")) {
            return [
              2,
              "#fpx.audio"
            ];
          }
          if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("video/")) {
            return [
              2,
              "#fpx.video"
            ];
          }
          if ((contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/octet-stream")) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/vnd.ms-excel")) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/vnd.ms-powerpoint")) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation")) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/msword")) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
            return [
              2,
              "#fpx.binary"
            ];
          }
          _state.label = 1;
        case 1:
          _state.trys.push([
            1,
            4,
            ,
            5
          ]);
          if (!response.body)
            return [
              3,
              3
            ];
          return [
            4,
            streamToString(response.body)
          ];
        case 2:
          return [
            2,
            _state.sent()
          ];
        case 3:
          return [
            3,
            5
          ];
        case 4:
          e = _state.sent();
          return [
            3,
            5
          ];
        case 5:
          return [
            2,
            null
          ];
      }
    });
  });
  return _tryGetResponseBodyAsText.apply(this, arguments);
}
function streamToString(stream) {
  return _streamToString.apply(this, arguments);
}
function _streamToString() {
  _streamToString = // Helper function to convert a ReadableStream to a string
  _async_to_generator(function(stream) {
    var reader, decoder, result, _ref, done, value;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          reader = stream.getReader();
          decoder = new TextDecoder();
          result = "";
          _state.label = 1;
        case 1:
          if (false)
            return [
              3,
              3
            ];
          return [
            4,
            reader.read()
          ];
        case 2:
          _ref = _state.sent(), done = _ref.done, value = _ref.value;
          result += decoder.decode(value, {
            stream: true
          });
          if (done) {
            return [
              3,
              3
            ];
          }
          return [
            3,
            1
          ];
        case 3:
          return [
            2,
            result
          ];
      }
    });
  });
  return _streamToString.apply(this, arguments);
}
function getResponseAttributes(response) {
  return _getResponseAttributes.apply(this, arguments);
}
function _getResponseAttributes() {
  _getResponseAttributes = _async_to_generator(function(response) {
    var _obj, attributes, responseText, contentLength, headers, responseHeaders, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _step_value, key, value;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          attributes = (_obj = {}, _define_property3(_obj, EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE, String(response.status)), _define_property3(_obj, SEMATTRS_HTTP_SCHEME, response.url.split(":")[0]), _obj);
          return [
            4,
            tryGetResponseBodyAsText(response)
          ];
        case 1:
          responseText = _state.sent();
          if (responseText) {
            attributes[FPX_RESPONSE_BODY] = responseText;
          }
          contentLength = response.headers.get("content-length");
          if (contentLength) {
            attributes[SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH] = contentLength;
          }
          headers = response.headers;
          responseHeaders = headersToObject(headers);
          _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = void 0;
          try {
            for (_iterator = Object.entries(responseHeaders)[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              _step_value = _sliced_to_array(_step.value, 2), key = _step_value[0], value = _step_value[1];
              attributes["http.response.header.".concat(key)] = value;
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
          return [
            2,
            attributes
          ];
      }
    });
  });
  return _getResponseAttributes.apply(this, arguments);
}

// ../../packages/client-library-otel/dist/utils/wrapper.js
init_checked_fetch();
init_modules_watch_stub();
function isWrapped(func) {
  return typeof func === "function" && "__wrapped" in func && func.__wrapped === true;
}

// ../../packages/client-library-otel/dist/utils/response.js
init_checked_fetch();
init_modules_watch_stub();

// ../../packages/client-library-otel/dist/utils/index.js
function _instanceof5(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
function _type_of5(obj) {
  "@swc/helpers - typeof";
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function isPromise(value) {
  return _instanceof5(value, Promise);
}
function isObject2(value) {
  return (typeof value === "undefined" ? "undefined" : _type_of5(value)) === "object" && value !== null;
}
function objectWithKey(value, key) {
  return isObject2(value) && key in value;
}

// ../../packages/client-library-otel/dist/measure.js
function _array_like_to_array4(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _array_without_holes3(arr) {
  if (Array.isArray(arr))
    return _array_like_to_array4(arr);
}
function asyncGeneratorStep2(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _async_to_generator2(fn) {
  return function() {
    var self2 = this, args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self2, args);
      function _next(value) {
        asyncGeneratorStep2(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep2(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(void 0);
    });
  };
}
function _define_property4(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _instanceof6(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
function _iterable_to_array3(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _non_iterable_spread3() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array3(arr) {
  return _array_without_holes3(arr) || _iterable_to_array3(arr) || _unsupported_iterable_to_array4(arr) || _non_iterable_spread3();
}
function _type_of6(obj) {
  "@swc/helpers - typeof";
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array4(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _array_like_to_array4(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _array_like_to_array4(o, minLen);
}
function _ts_generator2(thisArg, body) {
  var f, y, t, g, _ = {
    label: 0,
    sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  };
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([
        n,
        v
      ]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [
            op[0] & 2,
            t.value
          ];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };
          case 5:
            _.label++;
            y = op[1];
            op = [
              0
            ];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [
          6,
          e
        ];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
}
function measure(nameOrOptions, fn) {
  var isOptions = (typeof nameOrOptions === "undefined" ? "undefined" : _type_of6(nameOrOptions)) === "object";
  var name = isOptions ? nameOrOptions.name : nameOrOptions;
  var _ref = isOptions ? nameOrOptions : {}, onStart = _ref.onStart, onSuccess = _ref.onSuccess, onError = _ref.onError, checkResult = _ref.checkResult, logger = _ref.logger, endSpanManually = _ref.endSpanManually, attributes = _ref.attributes, spanKind = _ref.spanKind;
  return function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var handleActiveSpan = function handleActiveSpan2(span) {
      var shouldEndSpan = true;
      if (onStart) {
        try {
          onStart(span, args);
        } catch (error) {
          if (logger) {
            var errorMessage = formatException(convertToException(error));
            logger.warn("Error in onStart while measuring ".concat(name, ":"), errorMessage);
          }
        }
      }
      try {
        var returnValue = fn.apply(void 0, _to_consumable_array3(args));
        if (isGeneratorValue(returnValue)) {
          shouldEndSpan = false;
          var handlerOptions = {
            endSpanManually,
            onSuccess,
            checkResult,
            onError
          };
          return handleGenerator(span, returnValue, handlerOptions);
        }
        if (isAsyncGeneratorValue(returnValue)) {
          shouldEndSpan = false;
          var handlerOptions1 = {
            endSpanManually,
            onSuccess,
            checkResult,
            onError
          };
          return handleAsyncGenerator(span, returnValue, handlerOptions1);
        }
        if (isPromise(returnValue)) {
          shouldEndSpan = false;
          return handlePromise(span, returnValue, {
            onSuccess,
            onError,
            checkResult,
            endSpanManually
          });
        }
        span.setStatus({
          code: import_api23.SpanStatusCode.OK
        });
        if (onSuccess) {
          try {
            var result = onSuccess(span, returnValue);
            if (isPromise(result)) {
              shouldEndSpan = false;
              result.finally(function() {
                if (!endSpanManually) {
                  span.end();
                }
              });
            }
          } catch (error) {
            if (logger) {
              var errorMessage1 = formatException(convertToException(error));
              logger.warn("Error in onSuccess while measuring ".concat(name, ":"), errorMessage1);
            }
          }
        }
        return returnValue;
      } catch (error) {
        var exception = convertToException(error);
        span.recordException(exception);
        if (onError) {
          try {
            onError(span, error);
          } catch (e) {
          }
        }
        throw error;
      } finally {
        if (shouldEndSpan) {
          span.end();
        }
      }
    };
    var tracer2 = import_api23.trace.getTracer("fpx-tracer");
    return tracer2.startActiveSpan(name, {
      kind: spanKind,
      attributes
    }, handleActiveSpan);
  };
}
function handlePromise(span, resultPromise, options) {
  return _handlePromise.apply(this, arguments);
}
function _handlePromise() {
  _handlePromise = /**
  * Handle complete flow of a promise (including ending the span)
  *
  * @returns the promise
  */
  _async_to_generator2(function(span, resultPromise, options) {
    var onSuccess, onError, checkResult, _options_endSpanManually, endSpanManually, result, error, exception, e, e1, e2, error1, exception1, message;
    return _ts_generator2(this, function(_state) {
      switch (_state.label) {
        case 0:
          onSuccess = options.onSuccess, onError = options.onError, checkResult = options.checkResult, _options_endSpanManually = options.endSpanManually, endSpanManually = _options_endSpanManually === void 0 ? false : _options_endSpanManually;
          _state.label = 1;
        case 1:
          _state.trys.push([
            1,
            20,
            21,
            22
          ]);
          return [
            4,
            resultPromise
          ];
        case 2:
          result = _state.sent();
          if (!checkResult)
            return [
              3,
              15
            ];
          _state.label = 3;
        case 3:
          _state.trys.push([
            3,
            5,
            ,
            15
          ]);
          return [
            4,
            checkResult(result)
          ];
        case 4:
          _state.sent();
          return [
            3,
            15
          ];
        case 5:
          error = _state.sent();
          exception = convertToException(error);
          span.recordException(exception);
          if (!onError)
            return [
              3,
              9
            ];
          _state.label = 6;
        case 6:
          _state.trys.push([
            6,
            8,
            ,
            9
          ]);
          return [
            4,
            onError(span, exception)
          ];
        case 7:
          _state.sent();
          return [
            3,
            9
          ];
        case 8:
          e = _state.sent();
          return [
            3,
            9
          ];
        case 9:
          if (!onSuccess)
            return [
              3,
              14
            ];
          _state.label = 10;
        case 10:
          _state.trys.push([
            10,
            12,
            13,
            14
          ]);
          return [
            4,
            onSuccess(span, result)
          ];
        case 11:
          _state.sent();
          return [
            3,
            14
          ];
        case 12:
          e1 = _state.sent();
          return [
            3,
            14
          ];
        case 13:
          if (!endSpanManually) {
            span.end();
          }
          return [
            7
          ];
        case 14:
          return [
            2,
            result
          ];
        case 15:
          span.setStatus({
            code: import_api23.SpanStatusCode.OK
          });
          if (!onSuccess)
            return [
              3,
              19
            ];
          _state.label = 16;
        case 16:
          _state.trys.push([
            16,
            18,
            ,
            19
          ]);
          return [
            4,
            onSuccess(span, result)
          ];
        case 17:
          _state.sent();
          return [
            3,
            19
          ];
        case 18:
          e2 = _state.sent();
          return [
            3,
            19
          ];
        case 19:
          return [
            2,
            result
          ];
        case 20:
          error1 = _state.sent();
          try {
            exception1 = convertToException(error1);
            span.recordException(exception1);
            message = formatException(exception1);
            span.setStatus({
              code: import_api23.SpanStatusCode.ERROR,
              message
            });
            if (onError) {
              try {
                onError(span, error1);
              } catch (e3) {
              }
            }
          } catch (e3) {
          }
          throw error1;
        case 21:
          if (!endSpanManually || !onSuccess) {
            span.end();
          }
          return [
            7
          ];
        case 22:
          return [
            2
          ];
      }
    });
  });
  return _handlePromise.apply(this, arguments);
}
function handleGenerator(span, iterable, options) {
  var checkResult = options.checkResult, endSpanManually = options.endSpanManually, onError = options.onError, onSuccess = options.onSuccess;
  function handleError2(error) {
    var exception = convertToException(error);
    span.recordException(exception);
    var message = formatException(exception);
    span.setStatus({
      code: import_api23.SpanStatusCode.ERROR,
      message
    });
    if (onError) {
      try {
        onError(span, error);
      } catch (e) {
      }
    }
    span.end();
  }
  var active = import_api23.context.active();
  return _define_property4({
    next: import_api23.context.bind(active, measure("iterator.next", function nextFunction() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      try {
        var _iterable;
        var result = (_iterable = iterable).next.apply(_iterable, _to_consumable_array3(args));
        if (result.done) {
          try {
            if (checkResult) {
              checkResult(result.value);
            }
            if (!endSpanManually) {
              span.setStatus({
                code: import_api23.SpanStatusCode.OK
              });
              span.end();
            }
            if (onSuccess) {
              onSuccess(span, result.value);
            }
          } catch (error) {
            handleError2(error);
          }
        }
        return result;
      } catch (error) {
        handleError2(error);
        throw error;
      }
    })),
    return: import_api23.context.bind(active, function returnFunction(value) {
      try {
        var result = iterable.return(value);
        if (result.done) {
          try {
            if (checkResult) {
              checkResult(result.value);
            }
            if (!endSpanManually) {
              span.setStatus({
                code: import_api23.SpanStatusCode.OK
              });
              span.end();
            }
            if (onSuccess) {
              onSuccess(span, result.value);
            }
          } catch (error) {
            handleError2(error);
          }
        }
        return result;
      } catch (error) {
        handleError2(error);
        throw error;
      }
    }),
    throw: import_api23.context.bind(active, function throwFunction(error) {
      try {
        return iterable.throw(error);
      } finally {
        handleError2(error);
      }
    })
  }, Symbol.iterator, function() {
    return this;
  });
}
function handleAsyncGenerator(span, iterable, options) {
  var checkResult = options.checkResult, endSpanManually = options.endSpanManually, onError = options.onError, onSuccess = options.onSuccess;
  var active = import_api23.context.active();
  function handleError2(error) {
    var exception = convertToException(error);
    span.recordException(exception);
    var message = formatException(exception);
    span.setStatus({
      code: import_api23.SpanStatusCode.ERROR,
      message
    });
    if (onError) {
      try {
        onError(span, error);
      } catch (e) {
      }
    }
    span.end();
  }
  return _define_property4({
    next: import_api23.context.bind(active, measure("iterator.next", function() {
      var _nextFunction = _async_to_generator2(function() {
        var _len, args, _key, _iterable, result, error, error1;
        var _arguments = arguments;
        return _ts_generator2(this, function(_state) {
          switch (_state.label) {
            case 0:
              for (_len = _arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = _arguments[_key];
              }
              _state.label = 1;
            case 1:
              _state.trys.push([
                1,
                10,
                ,
                11
              ]);
              return [
                4,
                (_iterable = iterable).next.apply(_iterable, _to_consumable_array3(args))
              ];
            case 2:
              result = _state.sent();
              if (!result.done)
                return [
                  3,
                  9
                ];
              _state.label = 3;
            case 3:
              _state.trys.push([
                3,
                8,
                ,
                9
              ]);
              if (!checkResult)
                return [
                  3,
                  5
                ];
              return [
                4,
                checkResult(result.value)
              ];
            case 4:
              _state.sent();
              _state.label = 5;
            case 5:
              if (!endSpanManually) {
                span.setStatus({
                  code: import_api23.SpanStatusCode.OK
                });
                span.end();
              }
              if (!onSuccess)
                return [
                  3,
                  7
                ];
              return [
                4,
                onSuccess(span, result.value)
              ];
            case 6:
              _state.sent();
              _state.label = 7;
            case 7:
              return [
                3,
                9
              ];
            case 8:
              error = _state.sent();
              handleError2(error);
              return [
                3,
                9
              ];
            case 9:
              return [
                2,
                result
              ];
            case 10:
              error1 = _state.sent();
              handleError2(error1);
              throw error1;
            case 11:
              return [
                2
              ];
          }
        });
      });
      function nextFunction() {
        return _nextFunction.apply(this, arguments);
      }
      return nextFunction;
    }())),
    return: import_api23.context.bind(active, function() {
      var _returnFunction = _async_to_generator2(function(value) {
        var result, error;
        return _ts_generator2(this, function(_state) {
          switch (_state.label) {
            case 0:
              _state.trys.push([
                0,
                2,
                ,
                3
              ]);
              return [
                4,
                iterable.return(value)
              ];
            case 1:
              result = _state.sent();
              if (result.done) {
                try {
                  if (checkResult) {
                    checkResult(result.value);
                  }
                  if (!endSpanManually) {
                    span.setStatus({
                      code: import_api23.SpanStatusCode.OK
                    });
                    span.end();
                  }
                  if (onSuccess) {
                    onSuccess(span, result.value);
                  }
                } catch (error2) {
                  handleError2(error2);
                }
              }
              return [
                2,
                result
              ];
            case 2:
              error = _state.sent();
              handleError2(error);
              throw error;
            case 3:
              return [
                2
              ];
          }
        });
      });
      function returnFunction(value) {
        return _returnFunction.apply(this, arguments);
      }
      return returnFunction;
    }()),
    throw: import_api23.context.bind(active, function() {
      var _throwFunction = _async_to_generator2(function(error) {
        return _ts_generator2(this, function(_state) {
          switch (_state.label) {
            case 0:
              _state.trys.push([
                0,
                ,
                2,
                3
              ]);
              return [
                4,
                iterable.throw(error)
              ];
            case 1:
              return [
                2,
                _state.sent()
              ];
            case 2:
              handleError2(error);
              return [
                7
              ];
            case 3:
              return [
                2
              ];
          }
        });
      });
      function throwFunction(error) {
        return _throwFunction.apply(this, arguments);
      }
      return throwFunction;
    }())
  }, Symbol.asyncIterator, function() {
    return this;
  });
}
function convertToException(error) {
  return _instanceof6(error, Error) ? error : "Unknown error occurred";
}
function formatException(exception) {
  return typeof exception === "string" ? exception : exception.message || "Unknown error occurred";
}
function isGeneratorValue(value) {
  return value !== null && (typeof value === "undefined" ? "undefined" : _type_of6(value)) === "object" && Symbol.iterator in value;
}
function isAsyncGeneratorValue(value) {
  return value !== null && (typeof value === "undefined" ? "undefined" : _type_of6(value)) === "object" && Symbol.asyncIterator in value;
}

// ../../packages/client-library-otel/dist/patch/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../packages/client-library-otel/dist/patch/fetch.js
init_checked_fetch();
init_modules_watch_stub();
var import_api24 = __toESM(require_src(), 1);
var import_shimmer = __toESM(require_shimmer(), 1);
function _array_like_to_array5(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _array_with_holes2(arr) {
  if (Array.isArray(arr))
    return arr;
}
function asyncGeneratorStep3(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _async_to_generator3(fn) {
  return function() {
    var self2 = this, args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self2, args);
      function _next(value) {
        asyncGeneratorStep3(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep3(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(void 0);
    });
  };
}
function _iterable_to_array_limit2(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null)
    return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i)
        break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null)
        _i["return"]();
    } finally {
      if (_d)
        throw _e;
    }
  }
  return _arr;
}
function _non_iterable_rest2() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _sliced_to_array2(arr, i) {
  return _array_with_holes2(arr) || _iterable_to_array_limit2(arr, i) || _unsupported_iterable_to_array5(arr, i) || _non_iterable_rest2();
}
function _unsupported_iterable_to_array5(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _array_like_to_array5(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _array_like_to_array5(o, minLen);
}
function _ts_generator3(thisArg, body) {
  var f, y, t, g, _ = {
    label: 0,
    sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  };
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([
        n,
        v
      ]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [
            op[0] & 2,
            t.value
          ];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };
          case 5:
            _.label++;
            y = op[1];
            op = [
              0
            ];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [
          6,
          e
        ];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
}
var wrap = import_shimmer.default.wrap;
function patchFetch() {
  if (isWrapped(globalThis.fetch)) {
    return;
  }
  wrap(globalThis, "fetch", function(original) {
    return measure({
      name: "fetch",
      spanKind: import_api24.SpanKind.CLIENT,
      onStart: function(span, param) {
        var _param = _sliced_to_array2(param, 2), input = _param[0], init = _param[1];
        span.setAttributes(getRequestAttributes(input, init));
      },
      onSuccess: function() {
        var _ref = _async_to_generator3(function(span, responsePromise) {
          var response, attributeResponse, attributes;
          return _ts_generator3(this, function(_state) {
            switch (_state.label) {
              case 0:
                return [
                  4,
                  responsePromise
                ];
              case 1:
                response = _state.sent();
                attributeResponse = response.clone();
                return [
                  4,
                  getResponseAttributes(attributeResponse)
                ];
              case 2:
                attributes = _state.sent();
                span.setAttributes(attributes);
                return [
                  2
                ];
            }
          });
        });
        return function(span, responsePromise) {
          return _ref.apply(this, arguments);
        };
      }()
    }, original);
  });
}

// ../../packages/client-library-otel/dist/patch/log.js
init_checked_fetch();
init_modules_watch_stub();
var import_api25 = __toESM(require_src(), 1);
var import_shimmer2 = __toESM(require_shimmer(), 1);
function _array_like_to_array6(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _array_without_holes4(arr) {
  if (Array.isArray(arr))
    return _array_like_to_array6(arr);
}
function _instanceof7(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
function _iterable_to_array4(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _non_iterable_spread4() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array4(arr) {
  return _array_without_holes4(arr) || _iterable_to_array4(arr) || _unsupported_iterable_to_array6(arr) || _non_iterable_spread4();
}
function _type_of7(obj) {
  "@swc/helpers - typeof";
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array6(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _array_like_to_array6(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _array_like_to_array6(o, minLen);
}
var wrap2 = import_shimmer2.default.wrap;
function patchConsole() {
  patchMethod("debug", "debug");
  patchMethod("log", "info");
  patchMethod("warn", "warn");
  patchMethod("error", "error");
}
function patchMethod(methodName, level) {
  if (isWrapped(console[methodName])) {
    return;
  }
  wrap2(console, methodName, function(original) {
    return function(originalMessage) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      var span = import_api25.trace.getActiveSpan();
      if (span) {
        var _serializeLogMessage = serializeLogMessage(originalMessage), message = _serializeLogMessage.message, messageType = _serializeLogMessage.messageType;
        span.addEvent("log", {
          message,
          messageType,
          level,
          arguments: safelySerializeJSON(args === null || args === void 0 ? void 0 : args.map(transformLogMessage))
        });
      }
      return original.apply(void 0, [
        originalMessage
      ].concat(_to_consumable_array4(args)));
    };
  });
}
function serializeLogMessage(rawMessage) {
  var messageType = rawMessage === null ? "null" : typeof rawMessage === "undefined" ? "undefined" : _type_of7(rawMessage);
  var transformedMessage = transformLogMessage(rawMessage);
  var stringifiedMessage = transformedMessage === "string" ? transformedMessage : safelySerializeJSON(transformedMessage);
  return {
    message: stringifiedMessage,
    messageType
  };
}
function transformLogMessage(message) {
  if (isLikelyNeonDbError(message)) {
    return neonDbErrorToJson(message);
  }
  if (_instanceof7(message, Error)) {
    return errorToJson(message);
  }
  if (typeof message === "function") {
    var _message_toString;
    return (_message_toString = message === null || message === void 0 ? void 0 : message.toString()) !== null && _message_toString !== void 0 ? _message_toString : "";
  }
  return message;
}

// ../../packages/client-library-otel/dist/patch/waitUntil.js
init_checked_fetch();
init_modules_watch_stub();

// ../../packages/client-library-otel/dist/promiseStore.js
init_checked_fetch();
init_modules_watch_stub();
function _class_call_check3(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties3(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _create_class3(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties3(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties3(Constructor, staticProps);
  return Constructor;
}
function _define_property5(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
var noop = function() {
};
var PromiseStore = /* @__PURE__ */ function() {
  "use strict";
  function PromiseStore2() {
    _class_call_check3(this, PromiseStore2);
    _define_property5(this, "promises", []);
  }
  _create_class3(PromiseStore2, [
    {
      key: "add",
      value: function add(promise) {
        var _this = this;
        this.promises.push(promise);
        promise.finally(function() {
          _this.promises = _this.promises.filter(function(p) {
            return p === promise;
          });
        });
      }
    },
    {
      key: "allSettled",
      value: function allSettled() {
        return Promise.allSettled(this.promises).then(noop);
      }
    }
  ]);
  return PromiseStore2;
}();

// ../../packages/client-library-otel/dist/patch/waitUntil.js
function patchWaitUntil(context8) {
  var store = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : new PromiseStore();
  var proxyContext = new Proxy(context8, {
    get: function get(target, prop, receiver) {
      var value = Reflect.get(target, prop, receiver);
      if (prop === "waitUntil" && typeof value === "function") {
        var original = value;
        return function waitUntil(promise) {
          var scope = this === receiver ? target : this;
          store.add(promise);
          return original.apply(scope, [
            promise
          ]);
        };
      }
      return value;
    }
  });
  return proxyContext;
}

// ../../packages/client-library-otel/dist/patch/cf-bindings.js
init_checked_fetch();
init_modules_watch_stub();
function _define_property6(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _instanceof8(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
function _type_of8(obj) {
  "@swc/helpers - typeof";
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var IS_PROXIED_KEY = "__fpx_proxied";
function patchCloudflareBindings(env2) {
  var envKeys = env2 ? Object.keys(env2) : [];
  var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = void 0;
  try {
    for (var _iterator = envKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var bindingName = _step.value;
      var envValue = env2 === null || env2 === void 0 ? void 0 : env2[bindingName];
      if (!envValue || (typeof envValue === "undefined" ? "undefined" : _type_of8(envValue)) !== "object") {
        continue;
      }
      env2[bindingName] = patchCloudflareBinding(envValue, bindingName);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}
function patchCloudflareBinding(o, bindingName) {
  if (!isCloudflareBinding(o)) {
    return o;
  }
  if (isAlreadyProxied(o)) {
    return o;
  }
  if (isCloudflareD1Binding(o)) {
    return proxyD1Binding(o, bindingName);
  }
  var proxiedBinding = new Proxy(o, {
    get: function get(target, prop, receiver) {
      var value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        var methodName = String(prop);
        var bindingType = getConstructorName(target);
        var name = "".concat(bindingName, ".").concat(methodName);
        var measuredBinding = measure(
          {
            name,
            attributes: getCfBindingAttributes(bindingType, bindingName, methodName),
            onStart: function(span, args) {
              span.setAttributes({
                args: safelySerializeJSON(args)
              });
            },
            onSuccess: function(span, result) {
              addResultAttribute(span, result);
            },
            onError: handleError
          },
          // OPTIMIZE - bind is expensive, can we avoid it?
          value.bind(target)
        );
        return measuredBinding;
      }
      return value;
    }
  });
  markAsProxied(proxiedBinding);
  return proxiedBinding;
}
function proxyD1Binding(o, bindingName) {
  if (!isCloudflareD1Binding(o)) {
    return o;
  }
  if (isAlreadyProxied(o)) {
    return o;
  }
  if (hasCloudflareD1Session(o)) {
    if (!isAlreadyProxied(o.alwaysPrimarySession)) {
      var proxiedPrimarySession = new Proxy(o.alwaysPrimarySession, {
        get: function get(primarySessionTarget, primarySessionProp) {
          return measureD1Queries(bindingName, primarySessionTarget, primarySessionProp);
        }
      });
      markAsProxied(proxiedPrimarySession);
      o.alwaysPrimarySession = proxiedPrimarySession;
    }
  }
  var d1Proxy = new Proxy(o, {
    get: function get(d1Target, d1Prop) {
      return measureD1Queries(bindingName, d1Target, d1Prop);
    }
  });
  markAsProxied(d1Proxy);
  return d1Proxy;
}
function measureD1Queries(bindingName, d1Target, d1Prop) {
  var d1Method = String(d1Prop);
  var d1Value = Reflect.get(d1Target, d1Prop);
  var isSendingQuery = d1Method === "_send" || d1Method === "_sendOrThrow";
  if (typeof d1Value === "function" && isSendingQuery) {
    return measure(
      {
        name: "D1 Query",
        attributes: getCfBindingAttributes("D1Database", bindingName, d1Method),
        onStart: function(span, args) {
          span.setAttributes({
            args: safelySerializeJSON(args)
          });
        },
        onSuccess: function(span, result) {
          addResultAttribute(span, result);
        },
        onError: handleError
      },
      // OPTIMIZE - bind is expensive, can we avoid it?
      d1Value.bind(d1Target)
    );
  }
  return d1Value;
}
function getCfBindingAttributes(bindingType, bindingName, methodName) {
  var _obj;
  return _obj = {}, _define_property6(_obj, CF_BINDING_TYPE, bindingType), _define_property6(_obj, CF_BINDING_NAME, bindingName), _define_property6(_obj, CF_BINDING_METHOD, methodName), _obj;
}
function addResultAttribute(span, result) {
  var isBinary = isUintArray(result);
  span.setAttributes(_define_property6({}, CF_BINDING_RESULT, isBinary ? "binary" : safelySerializeJSON(result)));
}
function handleError(span, error) {
  var serializableError = _instanceof8(error, Error) ? errorToJson(error) : error;
  var errorAttributes = _define_property6({}, CF_BINDING_ERROR, safelySerializeJSON(serializableError));
  span.setAttributes(errorAttributes);
}
function isCloudflareBinding(o) {
  return isCloudflareAiBinding(o) || isCloudflareR2Binding(o) || isCloudflareD1Binding(o) || isCloudflareKVBinding(o);
}
function isCloudflareAiBinding(o) {
  var constructorName = getConstructorName(o);
  if (constructorName !== "Ai") {
    return false;
  }
  return true;
}
function isCloudflareR2Binding(o) {
  var constructorName = getConstructorName(o);
  if (constructorName !== "R2Bucket") {
    return false;
  }
  return true;
}
function isCloudflareD1Binding(o) {
  var constructorName = getConstructorName(o);
  if (constructorName !== "D1Database") {
    return false;
  }
  return true;
}
function hasCloudflareD1Session(o) {
  return objectWithKey(o, "alwaysPrimarySession") && isObject2(o.alwaysPrimarySession);
}
function isCloudflareKVBinding(o) {
  var constructorName = getConstructorName(o);
  if (constructorName !== "KvNamespace") {
    return false;
  }
  return true;
}
function getConstructorName(o) {
  return Object.getPrototypeOf(o).constructor.name;
}
function isAlreadyProxied(o) {
  if (IS_PROXIED_KEY in o) {
    return !!o[IS_PROXIED_KEY];
  }
  return false;
}
function markAsProxied(o) {
  Object.defineProperty(o, IS_PROXIED_KEY, {
    value: true,
    writable: true,
    configurable: true
  });
}

// ../../packages/client-library-otel/dist/propagation.js
init_checked_fetch();
init_modules_watch_stub();
var import_api26 = __toESM(require_src(), 1);
function _array_like_to_array7(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _array_without_holes5(arr) {
  if (Array.isArray(arr))
    return _array_like_to_array7(arr);
}
function _iterable_to_array5(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _non_iterable_spread5() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array5(arr) {
  return _array_without_holes5(arr) || _iterable_to_array5(arr) || _unsupported_iterable_to_array7(arr) || _non_iterable_spread5();
}
function _unsupported_iterable_to_array7(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _array_like_to_array7(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _array_like_to_array7(o, minLen);
}
function propagateFpxTraceId(request) {
  var traceId = request.headers.get("x-fpx-trace-id");
  var activeContext = import_api26.context.active();
  if (traceId) {
    activeContext = import_api26.propagation.extract(import_api26.context.active(), {
      traceparent: createTraceparentHeader(traceId)
    });
  } else {
    activeContext = import_api26.propagation.extract(import_api26.context.active(), request.headers);
  }
  return activeContext;
}
function createTraceparentHeader(traceId) {
  var version2 = "00";
  var spanId = generateSpanId();
  var traceFlags = "01";
  return "".concat(version2, "-").concat(traceId, "-").concat(spanId, "-").concat(traceFlags);
}
function generateSpanId() {
  var spanId;
  do {
    spanId = _to_consumable_array5(Array(16)).map(function() {
      return Math.floor(Math.random() * 16).toString(16);
    }).join("");
  } while (/^[0]{16}$/.test(spanId));
  return spanId;
}

// ../../packages/client-library-otel/dist/routes.js
init_checked_fetch();
init_modules_watch_stub();
function isRouteInspectorRequest(request) {
  return !!request.headers.get("X-Fpx-Route-Inspector");
}
function respondWithRoutes(fetchFn, fpxEndpoint, app3) {
  var _getRoutesFromApp;
  var routes = (_getRoutesFromApp = getRoutesFromApp(app3)) !== null && _getRoutesFromApp !== void 0 ? _getRoutesFromApp : [];
  try {
    var routesEndpoint = getRoutesEndpoint(fpxEndpoint);
    fetchFn(routesEndpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        routes
      })
    }).catch(function(_e) {
    });
  } catch (_e) {
  }
  return new Response("OK");
}
function getRoutesFromApp(app3) {
  var _app_routes;
  return app3 === null || app3 === void 0 ? void 0 : (_app_routes = app3.routes) === null || _app_routes === void 0 ? void 0 : _app_routes.map(function(route) {
    return {
      method: route.method,
      path: route.path,
      handler: route.handler.toString(),
      handlerType: route.handler.length < 2 ? "route" : "middleware"
    };
  });
}
function getRoutesEndpoint(fpxEndpoint) {
  var routesEndpoint = new URL(fpxEndpoint);
  routesEndpoint.pathname = "/v0/probed-routes";
  return routesEndpoint.toString();
}

// ../../packages/client-library-otel/dist/instrumentation.js
function _array_like_to_array8(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _array_with_holes3(arr) {
  if (Array.isArray(arr))
    return arr;
}
function asyncGeneratorStep4(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _async_to_generator4(fn) {
  return function() {
    var self2 = this, args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self2, args);
      function _next(value) {
        asyncGeneratorStep4(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep4(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(void 0);
    });
  };
}
function _define_property7(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _iterable_to_array_limit3(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null)
    return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i)
        break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null)
        _i["return"]();
    } finally {
      if (_d)
        throw _e;
    }
  }
  return _arr;
}
function _non_iterable_rest3() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);
    if (typeof Object.getOwnPropertySymbols === "function") {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }
    ownKeys.forEach(function(key) {
      _define_property7(target, key, source[key]);
    });
  }
  return target;
}
function _sliced_to_array3(arr, i) {
  return _array_with_holes3(arr) || _iterable_to_array_limit3(arr, i) || _unsupported_iterable_to_array8(arr, i) || _non_iterable_rest3();
}
function _unsupported_iterable_to_array8(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _array_like_to_array8(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _array_like_to_array8(o, minLen);
}
function _ts_generator4(thisArg, body) {
  var f, y, t, g, _ = {
    label: 0,
    sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  };
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([
        n,
        v
      ]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [
            op[0] & 2,
            t.value
          ];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };
          case 5:
            _.label++;
            y = op[1];
            op = [
              0
            ];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [
          6,
          e
        ];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
}
var defaultConfig = {
  libraryDebugMode: false,
  monitor: {
    fetch: true,
    logging: true,
    cfBindings: true
  }
};
function instrument(app3, config) {
  var webStandardFetch = fetch;
  return new Proxy(app3, {
    // Intercept the `fetch` function on the Hono app instance
    get: function get(target, prop, receiver) {
      var value = Reflect.get(target, prop, receiver);
      if (prop === "fetch" && typeof value === "function") {
        var originalFetch = value;
        return function() {
          var _fetch = _async_to_generator4(function(request, rawEnv, executionContext) {
            var _mergeConfigs, libraryDebugMode, _mergeConfigs_monitor, monitorFetch, monitorLogging, monitorCfBindings, env2, endpoint, isEnabled, FPX_LOG_LEVEL, logger, _getFromEnv, serviceName, provider, promiseStore, proxyExecutionCtx, activeContext, clonedRequest, _ref, body1, body2, requestForAttributes, newRequest, rootRequestAttributes, measuredFetch;
            return _ts_generator4(this, function(_state) {
              switch (_state.label) {
                case 0:
                  _mergeConfigs = mergeConfigs(defaultConfig, config), libraryDebugMode = _mergeConfigs.libraryDebugMode, _mergeConfigs_monitor = _mergeConfigs.monitor, monitorFetch = _mergeConfigs_monitor.fetch, monitorLogging = _mergeConfigs_monitor.logging, monitorCfBindings = _mergeConfigs_monitor.cfBindings;
                  env2 = rawEnv;
                  endpoint = getFromEnv(env2, ENV_FPX_ENDPOINT);
                  isEnabled = !!endpoint && typeof endpoint === "string";
                  FPX_LOG_LEVEL = libraryDebugMode ? "debug" : getFromEnv(env2, ENV_FPX_LOG_LEVEL);
                  logger = getLogger(FPX_LOG_LEVEL);
                  logger.debug("Library debug mode is enabled");
                  if (!!isEnabled)
                    return [
                      3,
                      2
                    ];
                  logger.debug("@fiberplane/hono-otel is missing FPX_ENDPOINT. Skipping instrumentation");
                  return [
                    4,
                    originalFetch(request, rawEnv, executionContext)
                  ];
                case 1:
                  return [
                    2,
                    _state.sent()
                  ];
                case 2:
                  if (isRouteInspectorRequest(request)) {
                    logger.debug("Responding to route inspector request");
                    return [
                      2,
                      respondWithRoutes(webStandardFetch, endpoint, app3)
                    ];
                  }
                  serviceName = (_getFromEnv = getFromEnv(env2, ENV_FPX_SERVICE_NAME)) !== null && _getFromEnv !== void 0 ? _getFromEnv : "unknown";
                  if (monitorCfBindings) {
                    patchCloudflareBindings(env2);
                  }
                  if (monitorLogging) {
                    patchConsole();
                  }
                  if (monitorFetch) {
                    patchFetch();
                  }
                  provider = setupTracerProvider({
                    serviceName,
                    endpoint
                  });
                  promiseStore = new PromiseStore();
                  proxyExecutionCtx = executionContext && patchWaitUntil(executionContext, promiseStore);
                  activeContext = propagateFpxTraceId(request);
                  clonedRequest = request.clone();
                  _ref = _sliced_to_array3(clonedRequest.body ? clonedRequest.body.tee() : [
                    null,
                    null
                  ], 2), body1 = _ref[0], body2 = _ref[1];
                  requestForAttributes = new Request(clonedRequest.url, {
                    method: request.method,
                    headers: new Headers(request.headers),
                    body: body1,
                    // NOTE - This is a workaround to support node environments
                    //        Which will throw errors when body is a stream but duplex is not set
                    //        https://github.com/nodejs/node/issues/46221
                    duplex: body1 ? "half" : void 0
                  });
                  newRequest = new Request(clonedRequest, {
                    body: body2,
                    headers: new Headers(request.headers),
                    method: request.method,
                    // NOTE - This is a workaround to support node environments
                    //        Which will throw errors when body is a stream but duplex is not set
                    //        https://github.com/nodejs/node/issues/46221
                    duplex: body2 ? "half" : void 0
                  });
                  return [
                    4,
                    getRootRequestAttributes(requestForAttributes, env2)
                  ];
                case 3:
                  rootRequestAttributes = _state.sent();
                  measuredFetch = measure({
                    name: "request",
                    spanKind: import_api27.SpanKind.SERVER,
                    onStart: function(span, param) {
                      var _param = _sliced_to_array3(param, 1), _$request = _param[0];
                      var requestAttributes = _object_spread2({}, getRequestAttributes(_$request), rootRequestAttributes);
                      span.setAttributes(requestAttributes);
                    },
                    endSpanManually: true,
                    onSuccess: function() {
                      var _ref2 = _async_to_generator4(function(span, response) {
                        var attributesResponse, updateSpan;
                        return _ts_generator4(this, function(_state2) {
                          span.addEvent("first-response");
                          attributesResponse = response.clone();
                          updateSpan = function() {
                            var _ref3 = _async_to_generator4(function(response2) {
                              var attributes;
                              return _ts_generator4(this, function(_state3) {
                                switch (_state3.label) {
                                  case 0:
                                    return [
                                      4,
                                      getResponseAttributes(response2)
                                    ];
                                  case 1:
                                    attributes = _state3.sent();
                                    span.setAttributes(attributes);
                                    span.end();
                                    return [
                                      2
                                    ];
                                }
                              });
                            });
                            return function updateSpan2(response2) {
                              return _ref3.apply(this, arguments);
                            };
                          }();
                          promiseStore.add(updateSpan(attributesResponse));
                          return [
                            2
                          ];
                        });
                      });
                      return function(span, response) {
                        return _ref2.apply(this, arguments);
                      };
                    }(),
                    checkResult: function() {
                      var _ref2 = _async_to_generator4(function(result) {
                        var r;
                        return _ts_generator4(this, function(_state2) {
                          switch (_state2.label) {
                            case 0:
                              return [
                                4,
                                result
                              ];
                            case 1:
                              r = _state2.sent();
                              if (r.status >= 500) {
                                throw new Error(r.statusText);
                              }
                              return [
                                2
                              ];
                          }
                        });
                      });
                      return function(result) {
                        return _ref2.apply(this, arguments);
                      };
                    }(),
                    logger
                  }, originalFetch);
                  _state.label = 4;
                case 4:
                  _state.trys.push([
                    4,
                    ,
                    6,
                    10
                  ]);
                  return [
                    4,
                    import_api27.context.with(activeContext, function() {
                      return measuredFetch(newRequest, rawEnv, proxyExecutionCtx);
                    })
                  ];
                case 5:
                  return [
                    2,
                    _state.sent()
                  ];
                case 6:
                  if (!proxyExecutionCtx)
                    return [
                      3,
                      7
                    ];
                  proxyExecutionCtx.waitUntil(promiseStore.allSettled().finally(function() {
                    return provider.forceFlush();
                  }));
                  return [
                    3,
                    9
                  ];
                case 7:
                  return [
                    4,
                    provider.forceFlush()
                  ];
                case 8:
                  _state.sent();
                  _state.label = 9;
                case 9:
                  return [
                    7
                  ];
                case 10:
                  return [
                    2
                  ];
              }
            });
          });
          function fetch1(request, rawEnv, executionContext) {
            return _fetch.apply(this, arguments);
          }
          return fetch1;
        }();
      }
      return value;
    }
  });
}
function setupTracerProvider(options) {
  var asyncHooksContextManager = new AsyncLocalStorageContextManager();
  asyncHooksContextManager.enable();
  import_api27.context.setGlobalContextManager(asyncHooksContextManager);
  var provider = new BasicTracerProvider({
    resource: new Resource(_define_property7({}, SEMRESATTRS_SERVICE_NAME, options.serviceName))
  });
  var exporter = new OTLPTraceExporter({
    url: options.endpoint
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
  return provider;
}
function mergeConfigs(fallbackConfig, userConfig) {
  var libraryDebugMode = typeof (userConfig === null || userConfig === void 0 ? void 0 : userConfig.libraryDebugMode) === "boolean" ? userConfig.libraryDebugMode : fallbackConfig.libraryDebugMode;
  return {
    libraryDebugMode,
    monitor: Object.assign(fallbackConfig.monitor, userConfig === null || userConfig === void 0 ? void 0 : userConfig.monitor)
  };
}

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/hono.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/hono-base.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/compose.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/context.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/request.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/utils/body.js
init_checked_fetch();
init_modules_watch_stub();
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    form[key] = value;
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/utils/url.js
init_checked_fetch();
init_modules_watch_stub();
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    if (!patternCache[label]) {
      if (match[2]) {
        patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
      } else {
        patternCache[label] = [label, match[1], true];
      }
    }
    return patternCache[label];
  }
  return null;
};
var tryDecodeURI = (str) => {
  try {
    return decodeURI(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decodeURI(match);
      } catch {
        return match;
      }
    });
  }
};
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", 8);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result[result.length - 1] === "/" ? result.slice(0, -1) : result;
};
var mergePath = (...paths) => {
  let p = "";
  let endsWithSlash = false;
  for (let path of paths) {
    if (p[p.length - 1] === "/") {
      p = p.slice(0, -1);
      endsWithSlash = true;
    }
    if (path[0] !== "/") {
      path = `/${path}`;
    }
    if (path === "/" && endsWithSlash) {
      p = `${p}/`;
    } else if (path !== "/") {
      p = `${p}${path}`;
    }
    if (path === "/" && p === "") {
      p = "/";
    }
  }
  return p;
};
var checkOptionalParameter = (path) => {
  if (!path.match(/\:.+\?$/)) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return /%/.test(value) ? decodeURIComponent_(value) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/request.js
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.getDecodedParam(key) : this.getAllDecodedParams();
  }
  getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.getParamValue(paramKey);
    return param ? /\%/.test(param) ? decodeURIComponent_(param) : param : void 0;
  }
  getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? decodeURIComponent_(value) : value;
      }
    }
    return decoded;
  }
  getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name.toLowerCase()) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  json() {
    return this.cachedBody("json");
  }
  text() {
    return this.cachedBody("text");
  }
  arrayBuffer() {
    return this.cachedBody("arrayBuffer");
  }
  blob() {
    return this.cachedBody("blob");
  }
  formData() {
    return this.cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/utils/html.js
init_checked_fetch();
init_modules_watch_stub();
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context8, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context8 }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context8, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = (headers, map = {}) => {
  Object.entries(map).forEach(([key, value]) => headers.set(key, value));
  return headers;
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status = 200;
  #executionCtx;
  #headers;
  #preparedHeaders;
  #res;
  #isFresh = true;
  #layout;
  #renderer;
  #notFoundHandler;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    this.#isFresh = false;
    return this.#res ||= new Response("404 Not Found", { status: 404 });
  }
  set res(_res) {
    this.#isFresh = false;
    if (this.#res && _res) {
      try {
        for (const [k, v] of this.#res.headers.entries()) {
          if (k === "content-type") {
            continue;
          }
          if (k === "set-cookie") {
            const cookies = this.#res.headers.getSetCookie();
            _res.headers.delete("set-cookie");
            for (const cookie of cookies) {
              _res.headers.append("set-cookie", cookie);
            }
          } else {
            _res.headers.set(k, v);
          }
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes("immutable")) {
          this.res = new Response(_res.body, {
            headers: _res.headers,
            status: _res.status
          });
          return;
        } else {
          throw e;
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (value === void 0) {
      if (this.#headers) {
        this.#headers.delete(name);
      } else if (this.#preparedHeaders) {
        delete this.#preparedHeaders[name.toLocaleLowerCase()];
      }
      if (this.finalized) {
        this.res.headers.delete(name);
      }
      return;
    }
    if (options?.append) {
      if (!this.#headers) {
        this.#isFresh = false;
        this.#headers = new Headers(this.#preparedHeaders);
        this.#preparedHeaders = {};
      }
      this.#headers.append(name, value);
    } else {
      if (this.#headers) {
        this.#headers.set(name, value);
      } else {
        this.#preparedHeaders ??= {};
        this.#preparedHeaders[name.toLowerCase()] = value;
      }
    }
    if (this.finalized) {
      if (options?.append) {
        this.res.headers.append(name, value);
      } else {
        this.res.headers.set(name, value);
      }
    }
  };
  status = (status) => {
    this.#isFresh = false;
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  newResponse = (data, arg, headers) => {
    if (this.#isFresh && !headers && !arg && this.#status === 200) {
      return new Response(data, {
        headers: this.#preparedHeaders
      });
    }
    if (arg && typeof arg !== "number") {
      const header = new Headers(arg.headers);
      if (this.#headers) {
        this.#headers.forEach((v, k) => {
          if (k === "set-cookie") {
            header.append(k, v);
          } else {
            header.set(k, v);
          }
        });
      }
      const headers2 = setHeaders(header, this.#preparedHeaders);
      return new Response(data, {
        headers: headers2,
        status: arg.status ?? this.#status
      });
    }
    const status = typeof arg === "number" ? arg : this.#status;
    this.#preparedHeaders ??= {};
    this.#headers ??= new Headers();
    setHeaders(this.#headers, this.#preparedHeaders);
    if (this.#res) {
      this.#res.headers.forEach((v, k) => {
        if (k === "set-cookie") {
          this.#headers?.append(k, v);
        } else {
          this.#headers?.set(k, v);
        }
      });
      setHeaders(this.#headers, this.#preparedHeaders);
    }
    headers ??= {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === "string") {
        this.#headers.set(k, v);
      } else {
        this.#headers.delete(k);
        for (const v2 of v) {
          this.#headers.append(k, v2);
        }
      }
    }
    return new Response(data, {
      status,
      headers: this.#headers
    });
  };
  body = (data, arg, headers) => {
    return typeof arg === "number" ? this.newResponse(data, arg, headers) : this.newResponse(data, arg);
  };
  text = (text2, arg, headers) => {
    if (!this.#preparedHeaders) {
      if (this.#isFresh && !headers && !arg) {
        return new Response(text2);
      }
      this.#preparedHeaders = {};
    }
    this.#preparedHeaders["content-type"] = TEXT_PLAIN;
    return typeof arg === "number" ? this.newResponse(text2, arg, headers) : this.newResponse(text2, arg);
  };
  json = (object, arg, headers) => {
    const body = JSON.stringify(object);
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "application/json; charset=UTF-8";
    return typeof arg === "number" ? this.newResponse(body, arg, headers) : this.newResponse(body, arg);
  };
  html = (html, arg, headers) => {
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "text/html; charset=UTF-8";
    if (typeof html === "object") {
      return resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then((html2) => {
        return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
      });
    }
    return typeof arg === "number" ? this.newResponse(html, arg, headers) : this.newResponse(html, arg);
  };
  redirect = (location, status) => {
    this.#headers ??= new Headers();
    this.#headers.set("Location", location);
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context8, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        if (context8 instanceof Context) {
          context8.req.routeIndex = i;
        }
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (!handler) {
        if (context8 instanceof Context && context8.finalized === false && onNotFound) {
          res = await onNotFound(context8);
        }
      } else {
        try {
          res = await handler(context8, () => {
            return dispatch(i + 1);
          });
        } catch (err) {
          if (err instanceof Error && context8 instanceof Context && onError) {
            context8.error = err;
            res = await onError(err, context8);
            isError = true;
          } else {
            throw err;
          }
        }
      }
      if (res && (context8.finalized === false || isError)) {
        context8.res = res;
      }
      return context8;
    }
  };
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router.js
init_checked_fetch();
init_modules_watch_stub();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/hono-base.js
var COMPOSED_HANDLER = Symbol("composedHandler");
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    return err.getResponse();
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          if (typeof handler !== "string") {
            this.addRoute(method, this.#path, handler);
          }
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const strict = options.strict ?? true;
    delete options.strict;
    Object.assign(this, options);
    this.getPath = strict ? options.getPath ?? getPath : getPathNoStrict;
  }
  clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app3) {
    const subApp = this.basePath(path);
    app3.routes.map((r) => {
      let handler;
      if (app3.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app3.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  matchRoute(method, path) {
    return this.router.match(method, path);
  }
  handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.matchRoute(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.notFoundHandler(c);
        });
      } catch (err) {
        return this.handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.notFoundHandler(c))
      ).catch((err) => this.handleError(err, c)) : res ?? this.notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.notFoundHandler);
    return (async () => {
      try {
        const context8 = await composed(c);
        if (!context8.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context8.res;
      } catch (err) {
        return this.handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      if (requestInit !== void 0) {
        input = new Request(input, requestInit);
      }
      return this.fetch(input, Env, executionCtx);
    }
    input = input.toString();
    const path = /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`;
    const req = new Request(path, requestInit);
    return this.fetch(req, Env, executionCtx);
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/reg-exp-router/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/reg-exp-router/router.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/reg-exp-router/node.js
init_checked_fetch();
init_modules_watch_stub();
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class {
  index;
  varIndex;
  children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context8, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.children[regexpStr];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[regexpStr] = new Node();
        if (name !== "") {
          node.varIndex = context8.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.varIndex]);
      }
    } else {
      node = this.children[token];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context8, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.children[k];
      return (typeof c.varIndex === "number" ? `(${k})@${c.varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.index === "number") {
      strList.unshift(`#${this.index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/reg-exp-router/trie.js
init_checked_fetch();
init_modules_watch_stub();
var Trie = class {
  context = { varIndex: 0 };
  root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.root.insert(tokens, index, paramAssoc, this.context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (typeof handlerIndex !== "undefined") {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (typeof paramIndex !== "undefined") {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  middleware;
  routes;
  constructor() {
    this.middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const { middleware, routes } = this;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    [...Object.keys(this.routes), ...Object.keys(this.middleware)].forEach((method) => {
      matchers[method] ||= this.buildMatcher(method);
    });
    this.middleware = this.routes = void 0;
    return matchers;
  }
  buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.middleware, this.routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/smart-router/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/smart-router/router.js
init_checked_fetch();
init_modules_watch_stub();
var SmartRouter = class {
  name = "SmartRouter";
  routers = [];
  routes = [];
  constructor(init) {
    Object.assign(this, init);
  }
  add(method, path, handler) {
    if (!this.routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.routes) {
      throw new Error("Fatal error");
    }
    const { routers, routes } = this;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        routes.forEach((args) => {
          router.add(...args);
        });
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.routers = [router];
      this.routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.routes || this.routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.routers[0];
  }
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/trie-router/index.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/trie-router/router.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/trie-router/node.js
init_checked_fetch();
init_modules_watch_stub();
var Node2 = class {
  methods;
  children;
  patterns;
  order = 0;
  name;
  params = /* @__PURE__ */ Object.create(null);
  constructor(method, handler, children) {
    this.children = children || /* @__PURE__ */ Object.create(null);
    this.methods = [];
    this.name = "";
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0, name: this.name };
      this.methods = [m];
    }
    this.patterns = [];
  }
  insert(method, path, handler) {
    this.name = `${method} ${path}`;
    this.order = ++this.order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      if (Object.keys(curNode.children).includes(p)) {
        curNode = curNode.children[p];
        const pattern2 = getPattern(p);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.children[p] = new Node2();
      const pattern = getPattern(p);
      if (pattern) {
        curNode.patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.children[p];
    }
    if (!curNode.methods.length) {
      curNode.methods = [];
    }
    const m = /* @__PURE__ */ Object.create(null);
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
      name: this.name,
      score: this.order
    };
    m[method] = handlerSet;
    curNode.methods.push(m);
    return curNode;
  }
  gHSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.methods.length; i < len; i++) {
      const m = node.methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = /* @__PURE__ */ Object.create(null);
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSet.possibleKeys.forEach((key) => {
          const processed = processedSet[handlerSet.name];
          handlerSet.params[key] = params[key] && !processed ? params[key] : nodeParams[key] ?? params[key];
          processedSet[handlerSet.name] = true;
        });
        handlerSets.push(handlerSet);
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.params = /* @__PURE__ */ Object.create(null);
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.children[part];
        if (nextNode) {
          nextNode.params = node.params;
          if (isLast === true) {
            if (nextNode.children["*"]) {
              handlerSets.push(
                ...this.gHSets(nextNode.children["*"], method, node.params, /* @__PURE__ */ Object.create(null))
              );
            }
            handlerSets.push(...this.gHSets(nextNode, method, node.params, /* @__PURE__ */ Object.create(null)));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.patterns.length; k < len3; k++) {
          const pattern = node.patterns[k];
          const params = { ...node.params };
          if (pattern === "*") {
            const astNode = node.children["*"];
            if (astNode) {
              handlerSets.push(...this.gHSets(astNode, method, node.params, /* @__PURE__ */ Object.create(null)));
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp && matcher.test(restPathString)) {
            params[name] = restPathString;
            handlerSets.push(...this.gHSets(child, method, node.params, params));
            continue;
          }
          if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
            if (typeof key === "string") {
              params[name] = part;
              if (isLast === true) {
                handlerSets.push(...this.gHSets(child, method, params, node.params));
                if (child.children["*"]) {
                  handlerSets.push(...this.gHSets(child.children["*"], method, params, node.params));
                }
              } else {
                child.params = params;
                tempNodes.push(child);
              }
            }
          }
        }
      }
      curNodes = tempNodes;
    }
    const results = handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [results.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  node;
  constructor() {
    this.node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (const p of results) {
        this.node.insert(method, p, handler);
      }
      return;
    }
    this.node.insert(method, path, handler);
  }
  match(method, path) {
    return this.node.search(method, path);
  }
};

// ../../node_modules/.pnpm/hono@4.6.2/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/other-router.ts
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/d1/driver.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/entity.js
init_checked_fetch();
init_modules_watch_stub();
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = value.constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/logger.js
init_checked_fetch();
init_modules_watch_stub();
var _a2;
var ConsoleLogWriter = class {
  write(message) {
    console.log(message);
  }
};
_a2 = entityKind;
__publicField(ConsoleLogWriter, _a2, "ConsoleLogWriter");
var _a3;
var DefaultLogger = class {
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
_a3 = entityKind;
__publicField(DefaultLogger, _a3, "DefaultLogger");
var _a4;
var NoopLogger = class {
  logQuery() {
  }
};
_a4 = entityKind;
__publicField(NoopLogger, _a4, "NoopLogger");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/relations.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/table.js
init_checked_fetch();
init_modules_watch_stub();
var TableName = Symbol.for("drizzle:Name");
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
var _a5;
var Table = class {
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [(_a5 = entityKind, TableName)];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
__publicField(Table, _a5, "Table");
/** @internal */
__publicField(Table, "Symbol", {
  Name: TableName,
  Schema,
  OriginalName,
  Columns,
  ExtraConfigColumns,
  BaseName,
  IsAlias,
  ExtraConfigBuilder
});
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/column.js
init_checked_fetch();
init_modules_watch_stub();
var _a6;
var Column = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  name;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};
_a6 = entityKind;
__publicField(Column, _a6, "Column");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/primary-keys.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/table.js
init_checked_fetch();
init_modules_watch_stub();
var InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
var _a7;
var PgTable = class extends Table {
  /**@internal */
  [(_a7 = entityKind, InlineForeignKeys)] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
__publicField(PgTable, _a7, "PgTable");
/** @internal */
__publicField(PgTable, "Symbol", Object.assign({}, Table.Symbol, {
  InlineForeignKeys
}));

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/primary-keys.js
var _a8;
var PrimaryKeyBuilder = class {
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
_a8 = entityKind;
__publicField(PrimaryKeyBuilder, _a8, "PgPrimaryKeyBuilder");
var _a9;
var PrimaryKey = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};
_a9 = entityKind;
__publicField(PrimaryKey, _a9, "PgPrimaryKey");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sql/expressions/conditions.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sql/sql.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/columns/enum.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/columns/common.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/column-builder.js
init_checked_fetch();
init_modules_watch_stub();
var _a10;
var ColumnBuilder = class {
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
};
_a10 = entityKind;
__publicField(ColumnBuilder, _a10, "ColumnBuilder");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/foreign-keys.js
init_checked_fetch();
init_modules_watch_stub();
var _a11;
var ForeignKeyBuilder = class {
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
_a11 = entityKind;
__publicField(ForeignKeyBuilder, _a11, "PgForeignKeyBuilder");
var _a12;
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[PgTable.Symbol.Name],
      ...columnNames,
      foreignColumns[0].table[PgTable.Symbol.Name],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};
_a12 = entityKind;
__publicField(ForeignKey, _a12, "PgForeignKey");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/tracing-utils.js
init_checked_fetch();
init_modules_watch_stub();
function iife(fn, ...args) {
  return fn(...args);
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/unique-constraint.js
init_checked_fetch();
init_modules_watch_stub();
function uniqueKeyName(table, columns) {
  return `${table[PgTable.Symbol.Name]}_${columns.join("_")}_unique`;
}
var _a13;
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
_a13 = entityKind;
__publicField(UniqueConstraintBuilder, _a13, "PgUniqueConstraintBuilder");
var _a14;
var UniqueOnConstraintBuilder = class {
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
_a14 = entityKind;
__publicField(UniqueOnConstraintBuilder, _a14, "PgUniqueOnConstraintBuilder");
var _a15;
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};
_a15 = entityKind;
__publicField(UniqueConstraint, _a15, "PgUniqueConstraint");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/utils/array.js
init_checked_fetch();
init_modules_watch_stub();
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/columns/common.js
var _a16;
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
_a16 = entityKind;
__publicField(PgColumnBuilder, _a16, "PgColumnBuilder");
var _a17;
var PgColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
};
_a17 = entityKind;
__publicField(PgColumn, _a17, "PgColumn");
var _a18;
var ExtraConfigColumn = class extends PgColumn {
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
_a18 = entityKind;
__publicField(ExtraConfigColumn, _a18, "ExtraConfigColumn");
var _a19;
var IndexedColumn = class {
  constructor(name, type, indexConfig) {
    this.name = name;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  type;
  indexConfig;
};
_a19 = entityKind;
__publicField(IndexedColumn, _a19, "IndexedColumn");
var _a20;
var PgArrayBuilder = class extends PgColumnBuilder {
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
_a20 = entityKind;
__publicField(PgArrayBuilder, _a20, "PgArrayBuilder");
var _a21;
var _PgArray = class extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray)
      return a;
    return makePgArray(a);
  }
};
var PgArray = _PgArray;
_a21 = entityKind;
__publicField(PgArray, _a21, "PgArray");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/pg-core/columns/enum.js
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var _a22;
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
_a22 = entityKind;
__publicField(PgEnumColumnBuilder, _a22, "PgEnumColumnBuilder");
var _a23;
var PgEnumColumn = class extends PgColumn {
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
_a23 = entityKind;
__publicField(PgEnumColumn, _a23, "PgEnumColumn");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/subquery.js
init_checked_fetch();
init_modules_watch_stub();
var _a24;
var Subquery = class {
  constructor(sql2, selection, alias, isWith = false) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: selection,
      alias,
      isWith
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
_a24 = entityKind;
__publicField(Subquery, _a24, "Subquery");
var _a25;
var WithSubquery = class extends Subquery {
};
_a25 = entityKind;
__publicField(WithSubquery, _a25, "WithSubquery");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/tracing.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/version.js
init_checked_fetch();
init_modules_watch_stub();
var version = "0.32.2";

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/view-common.js
init_checked_fetch();
init_modules_watch_stub();
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sql/sql.js
var _a26;
var FakePrimitiveParam = class {
};
_a26 = entityKind;
__publicField(FakePrimitiveParam, _a26, "FakePrimitiveParam");
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var _a27;
var StringChunk = class {
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
_a27 = entityKind;
__publicField(StringChunk, _a27, "StringChunk");
var _a28;
var _SQL = class {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
  }
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(chunk.name), params: [] };
        }
        return { sql: escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(chunk.name), params: [] };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var SQL = _SQL;
_a28 = entityKind;
__publicField(SQL, _a28, "SQL");
var _a29;
var Name = class {
  constructor(value) {
    this.value = value;
  }
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
_a29 = entityKind;
__publicField(Name, _a29, "Name");
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var _a30;
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
_a30 = entityKind;
__publicField(Param, _a30, "Param");
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw2(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw2;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var _a31;
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  getSQL() {
    return new SQL([this]);
  }
};
_a31 = entityKind;
__publicField(Placeholder, _a31, "Placeholder");
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    return p;
  });
}
var _a32;
var View = class {
  /** @internal */
  [(_a32 = entityKind, ViewBaseConfig)];
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
__publicField(View, _a32, "View");
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
var ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
var gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sql/expressions/select.js
init_checked_fetch();
init_modules_watch_stub();
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/relations.js
var _a33;
var Relation = class {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  referencedTableName;
  fieldName;
};
_a33 = entityKind;
__publicField(Relation, _a33, "Relation");
var _a34;
var Relations = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
};
_a34 = entityKind;
__publicField(Relations, _a34, "Relations");
var _a35;
var _One = class extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var One = _One;
_a35 = entityKind;
__publicField(One, _a35, "One");
var _a36;
var _Many = class extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = _Many;
_a36 = entityKind;
__publicField(Many, _a36, "Many");
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/db.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/selection-proxy.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/alias.js
init_checked_fetch();
init_modules_watch_stub();
var _a37;
var ColumnAliasProxyHandler = class {
  constructor(table) {
    this.table = table;
  }
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
_a37 = entityKind;
__publicField(ColumnAliasProxyHandler, _a37, "ColumnAliasProxyHandler");
var _a38;
var TableAliasProxyHandler = class {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
_a38 = entityKind;
__publicField(TableAliasProxyHandler, _a38, "TableAliasProxyHandler");
var _a39;
var RelationTableAliasProxyHandler = class {
  constructor(alias) {
    this.alias = alias;
  }
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
_a39 = entityKind;
__publicField(RelationTableAliasProxyHandler, _a39, "RelationTableAliasProxyHandler");
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/selection-proxy.js
var _a40;
var _SelectionProxyHandler = class {
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};
var SelectionProxyHandler = _SelectionProxyHandler;
_a40 = entityKind;
__publicField(SelectionProxyHandler, _a40, "SelectionProxyHandler");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/query-promise.js
init_checked_fetch();
init_modules_watch_stub();
var _a41;
var QueryPromise = class {
  [(_a41 = entityKind, Symbol.toStringTag)] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};
__publicField(QueryPromise, _a41, "QueryPromise");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/table.js
init_checked_fetch();
init_modules_watch_stub();
var InlineForeignKeys2 = Symbol.for("drizzle:SQLiteInlineForeignKeys");
var _a42;
var SQLiteTable = class extends Table {
  /** @internal */
  [(_a42 = entityKind, Table.Symbol.Columns)];
  /** @internal */
  [InlineForeignKeys2] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
__publicField(SQLiteTable, _a42, "SQLiteTable");
/** @internal */
__publicField(SQLiteTable, "Symbol", Object.assign({}, Table.Symbol, {
  InlineForeignKeys: InlineForeignKeys2
}));
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const builtColumns = Object.fromEntries(
    Object.entries(columns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/utils.js
init_checked_fetch();
init_modules_watch_stub();
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor")
        continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
var _a43;
var SQLiteDeleteBase = class extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
};
_a43 = entityKind;
__publicField(SQLiteDeleteBase, _a43, "SQLiteDelete");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/insert.js
init_checked_fetch();
init_modules_watch_stub();
var _a44;
var SQLiteInsertBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
};
_a44 = entityKind;
__publicField(SQLiteInsertBuilder, _a44, "SQLiteInsertBuilder");
var _a45;
var SQLiteInsertBase = class extends QueryPromise {
  constructor(table, values, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList };
  }
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (config.target === void 0) {
      this.config.onConflict = sql`do nothing`;
    } else {
      const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
      const whereSql = config.where ? sql` where ${config.where}` : sql``;
      this.config.onConflict = sql`${targetSql} do nothing${whereSql}`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    this.config.onConflict = sql`${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};
_a45 = entityKind;
__publicField(SQLiteInsertBase, _a45, "SQLiteInsert");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/dialect.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/errors.js
init_checked_fetch();
init_modules_watch_stub();
var _a46;
var DrizzleError = class extends Error {
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
_a46 = entityKind;
__publicField(DrizzleError, _a46, "DrizzleError");
var _a47;
var TransactionRollbackError = class extends DrizzleError {
  constructor() {
    super({ message: "Rollback" });
  }
};
_a47 = entityKind;
__publicField(TransactionRollbackError, _a47, "TransactionRollbackError");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/columns/common.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/foreign-keys.js
init_checked_fetch();
init_modules_watch_stub();
var _a48;
var ForeignKeyBuilder2 = class {
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey2(table, this);
  }
};
_a48 = entityKind;
__publicField(ForeignKeyBuilder2, _a48, "SQLiteForeignKeyBuilder");
var _a49;
var ForeignKey2 = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[SQLiteTable.Symbol.Name],
      ...columnNames,
      foreignColumns[0].table[SQLiteTable.Symbol.Name],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};
_a49 = entityKind;
__publicField(ForeignKey2, _a49, "SQLiteForeignKey");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/unique-constraint.js
init_checked_fetch();
init_modules_watch_stub();
function uniqueKeyName2(table, columns) {
  return `${table[SQLiteTable.Symbol.Name]}_${columns.join("_")}_unique`;
}
var _a50;
var UniqueConstraintBuilder2 = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint2(table, this.columns, this.name);
  }
};
_a50 = entityKind;
__publicField(UniqueConstraintBuilder2, _a50, "SQLiteUniqueConstraintBuilder");
var _a51;
var UniqueOnConstraintBuilder2 = class {
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder2(columns, this.name);
  }
};
_a51 = entityKind;
__publicField(UniqueOnConstraintBuilder2, _a51, "SQLiteUniqueOnConstraintBuilder");
var _a52;
var UniqueConstraint2 = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
  }
  columns;
  name;
  getName() {
    return this.name;
  }
};
_a52 = entityKind;
__publicField(UniqueConstraint2, _a52, "SQLiteUniqueConstraint");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/columns/common.js
var _a53;
var SQLiteColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder2(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
};
_a53 = entityKind;
__publicField(SQLiteColumnBuilder, _a53, "SQLiteColumnBuilder");
var _a54;
var SQLiteColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
};
_a54 = entityKind;
__publicField(SQLiteColumn, _a54, "SQLiteColumn");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/columns/integer.js
init_checked_fetch();
init_modules_watch_stub();
var _a55;
var SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
};
_a55 = entityKind;
__publicField(SQLiteBaseIntegerBuilder, _a55, "SQLiteBaseIntegerBuilder");
var _a56;
var SQLiteBaseInteger = class extends SQLiteColumn {
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
};
_a56 = entityKind;
__publicField(SQLiteBaseInteger, _a56, "SQLiteBaseInteger");
var _a57;
var SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
};
_a57 = entityKind;
__publicField(SQLiteIntegerBuilder, _a57, "SQLiteIntegerBuilder");
var _a58;
var SQLiteInteger = class extends SQLiteBaseInteger {
};
_a58 = entityKind;
__publicField(SQLiteInteger, _a58, "SQLiteInteger");
var _a59;
var SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
};
_a59 = entityKind;
__publicField(SQLiteTimestampBuilder, _a59, "SQLiteTimestampBuilder");
var _a60;
var SQLiteTimestamp = class extends SQLiteBaseInteger {
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
};
_a60 = entityKind;
__publicField(SQLiteTimestamp, _a60, "SQLiteTimestamp");
var _a61;
var SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
};
_a61 = entityKind;
__publicField(SQLiteBooleanBuilder, _a61, "SQLiteBooleanBuilder");
var _a62;
var SQLiteBoolean = class extends SQLiteBaseInteger {
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
};
_a62 = entityKind;
__publicField(SQLiteBoolean, _a62, "SQLiteBoolean");
function integer(name, config) {
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/columns/text.js
init_checked_fetch();
init_modules_watch_stub();
var _a63;
var SQLiteTextBuilder = class extends SQLiteColumnBuilder {
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(table, this.config);
  }
};
_a63 = entityKind;
__publicField(SQLiteTextBuilder, _a63, "SQLiteTextBuilder");
var _a64;
var SQLiteText = class extends SQLiteColumn {
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
};
_a64 = entityKind;
__publicField(SQLiteText, _a64, "SQLiteText");
var _a65;
var SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
};
_a65 = entityKind;
__publicField(SQLiteTextJsonBuilder, _a65, "SQLiteTextJsonBuilder");
var _a66;
var SQLiteTextJson = class extends SQLiteColumn {
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
};
_a66 = entityKind;
__publicField(SQLiteTextJson, _a66, "SQLiteTextJson");
function text(name, config = {}) {
  return config.mode === "json" ? new SQLiteTextJsonBuilder(name) : new SQLiteTextBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/view-base.js
init_checked_fetch();
init_modules_watch_stub();
var _a67;
var SQLiteViewBase = class extends View {
};
_a67 = entityKind;
__publicField(SQLiteViewBase, _a67, "SQLiteViewBase");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/dialect.js
var _a68;
var SQLiteDialect = class {
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length)
      return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const value = set[colName] ?? sql.param(col.onUpdateFn(), col);
      const res = sql`${sql.identifier(col.name)} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}update ${table} set ${setSql}${whereSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(c.name);
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        const columnName = field.name;
        if (isSingleTable) {
          chunk.push(sql.identifier(columnName));
        } else {
          chunk.push(sql`${sql.identifier(tableName)}.${sql.identifier(columnName)}`);
        }
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = (() => {
      if (is(table, Table) && table[Table.Symbol.OriginalName] !== table[Table.Symbol.Name]) {
        return sql`${sql.identifier(table[Table.Symbol.OriginalName])} ${sql.identifier(table[Table.Symbol.Name])}`;
      }
      return table;
    })();
    const joinsArray = [];
    if (joins) {
      for (const [index, joinMeta] of joins.entries()) {
        if (index === 0) {
          joinsArray.push(sql` `);
        }
        const table2 = joinMeta.table;
        if (is(table2, SQLiteTable)) {
          const tableName = table2[SQLiteTable.Symbol.Name];
          const tableSchema = table2[SQLiteTable.Symbol.Schema];
          const origTableName = table2[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table2} on ${joinMeta.on}`
          );
        }
        if (index < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    const joinsSql = sql.join(joinsArray);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const orderByList = [];
    if (orderBy) {
      for (const [index, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    const groupByList = [];
    if (groupBy) {
      for (const [index, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(chunk.name);
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values, onConflict, returning, withList }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(column.name));
    for (const [valueIndex, value] of values.entries()) {
      const valueList = [];
      for (const [fieldName, col] of colEntries) {
        const colValue = value[fieldName];
        if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
          let defaultValue;
          if (col.default !== null && col.default !== void 0) {
            defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
          } else if (col.defaultFn !== void 0) {
            const defaultFnResult = col.defaultFn();
            defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
          } else if (!col.default && col.onUpdateFn !== void 0) {
            const onUpdateFnResult = col.onUpdateFn();
            defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
          } else {
            defaultValue = sql`null`;
          }
          valueList.push(defaultValue);
        } else {
          valueList.push(colValue);
        }
      }
      valuesSqlList.push(valueList);
      if (valueIndex < values.length - 1) {
        valuesSqlList.push(sql`, `);
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict ? sql` on conflict ${onConflict}` : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} values ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(field2.name) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};
_a68 = entityKind;
__publicField(SQLiteDialect, _a68, "SQLiteDialect");
var _a69;
var SQLiteSyncDialect = class extends SQLiteDialect {
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
};
_a69 = entityKind;
__publicField(SQLiteSyncDialect, _a69, "SQLiteSyncDialect");
var _a70;
var SQLiteAsyncDialect = class extends SQLiteDialect {
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql.raw(stmt));
          }
          await tx.run(
            sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
};
_a70 = entityKind;
__publicField(SQLiteAsyncDialect, _a70, "SQLiteAsyncDialect");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/select.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/query-builders/query-builder.js
init_checked_fetch();
init_modules_watch_stub();
var _a71;
var TypedQueryBuilder = class {
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};
_a71 = entityKind;
__publicField(TypedQueryBuilder, _a71, "TypedQueryBuilder");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/select.js
var _a72;
var SQLiteSelectBuilder = class {
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
};
_a72 = entityKind;
__publicField(SQLiteSelectBuilder, _a72, "SQLiteSelectBuilder");
var _a73;
var SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
_a73 = entityKind;
__publicField(SQLiteSelectQueryBuilderBase, _a73, "SQLiteSelectQueryBuilder");
var _a74;
var SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.all();
  }
};
_a74 = entityKind;
__publicField(SQLiteSelectBase, _a74, "SQLiteSelect");
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var getSQLiteSetOperators = () => ({
  union,
  unionAll,
  intersect,
  except
});
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var except = createSetOperator("except", false);

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
var _a75;
var QueryBuilder = class {
  dialect;
  $with(alias) {
    const queryBuilder = this;
    return {
      as(qb) {
        if (typeof qb === "function") {
          qb = qb(queryBuilder);
        }
        return new Proxy(
          new WithSubquery(qb.getSQL(), qb.getSelectedFields(), alias, true),
          new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
    };
  }
  with(...queries) {
    const self2 = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self2.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self2.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect();
    }
    return this.dialect;
  }
};
_a75 = entityKind;
__publicField(QueryBuilder, _a75, "SQLiteQueryBuilder");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/update.js
init_checked_fetch();
init_modules_watch_stub();
var _a76;
var SQLiteUpdateBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
};
_a76 = entityKind;
__publicField(SQLiteUpdateBuilder, _a76, "SQLiteUpdateBuilder");
var _a77;
var SQLiteUpdateBase = class extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList };
  }
  /** @internal */
  config;
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};
_a77 = entityKind;
__publicField(SQLiteUpdateBase, _a77, "SQLiteUpdate");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/query.js
init_checked_fetch();
init_modules_watch_stub();
var _a78;
var RelationalQueryBuilder = class {
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
_a78 = entityKind;
__publicField(RelationalQueryBuilder, _a78, "SQLiteAsyncRelationalQueryBuilder");
var _a79;
var SQLiteRelationalQuery = class extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
};
_a79 = entityKind;
__publicField(SQLiteRelationalQuery, _a79, "SQLiteAsyncRelationalQuery");
var _a80;
var SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
  sync() {
    return this.executeRaw();
  }
};
_a80 = entityKind;
__publicField(SQLiteSyncRelationalQuery, _a80, "SQLiteSyncRelationalQuery");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/query-builders/raw.js
init_checked_fetch();
init_modules_watch_stub();
var _a81;
var SQLiteRaw = class extends QueryPromise {
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};
_a81 = entityKind;
__publicField(SQLiteRaw, _a81, "SQLiteRaw");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/db.js
var _a82;
var BaseSQLiteDatabase = class {
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
  }
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with(alias) {
    return {
      as(qb) {
        if (typeof qb === "function") {
          qb = qb(new QueryBuilder());
        }
        return new Proxy(
          new WithSubquery(qb.getSQL(), qb.getSelectedFields(), alias, true),
          new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
    };
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self2 = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self2.session,
        dialect: self2.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self2.session,
        dialect: self2.dialect,
        withList: queries,
        distinct: true
      });
    }
    function update(table) {
      return new SQLiteUpdateBuilder(table, self2.session, self2.dialect, queries);
    }
    function insert(into) {
      return new SQLiteInsertBuilder(into, self2.session, self2.dialect, queries);
    }
    function delete_(from) {
      return new SQLiteDeleteBase(from, self2.session, self2.dialect, queries);
    }
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sql2 = query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sql2),
        () => sql2,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sql2);
  }
  all(query) {
    const sql2 = query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sql2),
        () => sql2,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sql2);
  }
  get(query) {
    const sql2 = query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sql2),
        () => sql2,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sql2);
  }
  values(query) {
    const sql2 = query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sql2),
        () => sql2,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sql2);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};
_a82 = entityKind;
__publicField(BaseSQLiteDatabase, _a82, "BaseSQLiteDatabase");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/d1/session.js
init_checked_fetch();
init_modules_watch_stub();

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/sqlite-core/session.js
init_checked_fetch();
init_modules_watch_stub();
var _a83;
var ExecuteResultSync = class extends QueryPromise {
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
};
_a83 = entityKind;
__publicField(ExecuteResultSync, _a83, "ExecuteResultSync");
var _a84;
var SQLitePreparedQuery = class {
  constructor(mode, executeMethod, query) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
  }
  /** @internal */
  joinsNotNullableMap;
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
};
_a84 = entityKind;
__publicField(SQLitePreparedQuery, _a84, "PreparedQuery");
var _a85;
var SQLiteSession = class {
  constructor(dialect) {
    this.dialect = dialect;
  }
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode) {
    return this.prepareQuery(query, fields, executeMethod, isResponseInArrayMode);
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
};
_a85 = entityKind;
__publicField(SQLiteSession, _a85, "SQLiteSession");
var _a86;
var SQLiteTransaction = class extends BaseSQLiteDatabase {
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  rollback() {
    throw new TransactionRollbackError();
  }
};
_a86 = entityKind;
__publicField(SQLiteTransaction, _a86, "SQLiteTransaction");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/d1/session.js
var _a87;
var SQLiteD1Session = class extends SQLiteSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
  }
  logger;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper) {
    const stmt = this.client.prepare(query.sql);
    return new D1PreparedQuery(
      stmt,
      query,
      this.logger,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      if (builtQuery.params.length > 0) {
        builtQueries.push(preparedQuery.stmt.bind(...builtQuery.params));
      } else {
        const builtQuery2 = preparedQuery.getQuery();
        builtQueries.push(
          this.client.prepare(builtQuery2.sql).bind(...builtQuery2.params)
        );
      }
    }
    const batchResults = await this.client.batch(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  extractRawAllValueFromBatchResult(result) {
    return result.results;
  }
  extractRawGetValueFromBatchResult(result) {
    return result.results[0];
  }
  extractRawValuesValueFromBatchResult(result) {
    return d1ToRawMapping(result.results);
  }
  async transaction(transaction, config) {
    const tx = new D1Transaction("async", this.dialect, this, this.schema);
    await this.run(sql.raw(`begin${config?.behavior ? " " + config.behavior : ""}`));
    try {
      const result = await transaction(tx);
      await this.run(sql`commit`);
      return result;
    } catch (err) {
      await this.run(sql`rollback`);
      throw err;
    }
  }
};
_a87 = entityKind;
__publicField(SQLiteD1Session, _a87, "SQLiteD1Session");
var _a88;
var _D1Transaction = class extends SQLiteTransaction {
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new _D1Transaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    await this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};
var D1Transaction = _D1Transaction;
_a88 = entityKind;
__publicField(D1Transaction, _a88, "D1Transaction");
function d1ToRawMapping(results) {
  const rows = [];
  for (const row of results) {
    const entry = Object.keys(row).map((k) => row[k]);
    rows.push(entry);
  }
  return rows;
}
var _a89;
var D1PreparedQuery = class extends SQLitePreparedQuery {
  constructor(stmt, query, logger, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("async", executeMethod, query);
    this.logger = logger;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.fields = fields;
    this.stmt = stmt;
  }
  /** @internal */
  customResultMapper;
  /** @internal */
  fields;
  /** @internal */
  stmt;
  run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.bind(...params).run();
  }
  async all(placeholderValues) {
    const { fields, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return stmt.bind(...params).all().then(({ results }) => this.mapAllResult(results));
    }
    const rows = await this.values(placeholderValues);
    return this.mapAllResult(rows);
  }
  mapAllResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = d1ToRawMapping(rows.results);
    }
    if (!this.fields && !this.customResultMapper) {
      return rows;
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(this.fields, row, this.joinsNotNullableMap));
  }
  async get(placeholderValues) {
    const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return stmt.bind(...params).all().then(({ results }) => results[0]);
    }
    const rows = await this.values(placeholderValues);
    if (!rows[0]) {
      return void 0;
    }
    if (customResultMapper) {
      return customResultMapper(rows);
    }
    return mapResultRow(fields, rows[0], joinsNotNullableMap);
  }
  mapGetResult(result, isFromBatch) {
    if (isFromBatch) {
      result = d1ToRawMapping(result.results)[0];
    }
    if (!this.fields && !this.customResultMapper) {
      return result;
    }
    if (this.customResultMapper) {
      return this.customResultMapper([result]);
    }
    return mapResultRow(this.fields, result, this.joinsNotNullableMap);
  }
  values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.bind(...params).raw();
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};
_a89 = entityKind;
__publicField(D1PreparedQuery, _a89, "D1PreparedQuery");

// ../../node_modules/.pnpm/drizzle-orm@0.32.2_@cloudflare+workers-types@4.20240924.0_@libsql+client@0.6.2_@neondatabase+_dtfpsxqzvy3uiqjtekxdc4whqm/node_modules/drizzle-orm/d1/driver.js
var _a90;
var DrizzleD1Database = class extends BaseSQLiteDatabase {
  async batch(batch) {
    return this.session.batch(batch);
  }
};
_a90 = entityKind;
__publicField(DrizzleD1Database, _a90, "D1Database");
function drizzle(client, config = {}) {
  const dialect = new SQLiteAsyncDialect();
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new SQLiteD1Session(client, dialect, schema, { logger });
  return new DrizzleD1Database("async", dialect, session, schema);
}

// src/db/schema.ts
init_checked_fetch();
init_modules_watch_stub();
var stuff = sqliteTable("stuff", {
  id: integer("id", { mode: "number" }).primaryKey(),
  foo: text("foo").notNull(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`)
});

// src/other-router.ts
var app = new Hono2();
app.get("/", (c) => {
  console.log("Other Router");
  const url = new URL(c.req.url);
  return c.text(`Other Router: ${url}`);
});
app.get("/db", async (c) => {
  const db = drizzle(c.env.DB);
  const stuff2 = await db.select().from(stuff);
  return c.json(stuff2);
});
app.post("/db", async (c) => {
  const body = await c.req.json();
  const db = drizzle(c.env.DB);
  const stuff2 = await db.insert(stuff).values(body).returning();
  return c.json(stuff2);
});
app.post("/db-alt", async (c) => {
  const body = await c.req.json();
  const db = drizzle(c.env.DB);
  const stuff2 = await db.insert(stuff).values(body).returning();
  return c.json(stuff2);
});
var other_router_default = app;

// src/utils.ts
init_checked_fetch();
init_modules_watch_stub();

// src/constants.ts
init_checked_fetch();
init_modules_watch_stub();
var RANDOM_HEADER = "X-Random";

// src/utils.ts
function getAuthHeader(req) {
  return req.header("Authorization");
}
function getRandomHeader(req) {
  return req.header(RANDOM_HEADER);
}

// src/index.ts
var app2 = new Hono2();
var PASSPHRASES = ["I am a cat", "I am a dog", "I am a bird"];
app2.get("/const", (c) => {
  const auth = c.req.header("Authorization");
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
});
app2.get("/helper-function", (c) => {
  const shouldSayHello = helperFunction(c.req);
  return c.text(shouldSayHello ? "Hello Helper Function!" : "Helper Function");
});
app2.get("/const-and-helper-out-of-file", (c) => {
  const auth = getAuthHeader(c.req);
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
});
app2.get("/const-and-helper-out-of-file-and-sub-helpers", (c) => {
  const randomHeader = getRandomHeader(c.req);
  if (randomHeader) {
    return c.text("What a random header!");
  }
  return c.text("No random header", 422);
});
app2.route("/other-router", other_router_default);
var src_default = instrument(app2);
function helperFunction(req) {
  return req.query("shouldSayHello") === "true";
}

// ../../node_modules/.pnpm/wrangler@3.78.5_@cloudflare+workers-types@4.20240924.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_checked_fetch();
init_modules_watch_stub();
var drainBody = async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
};
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/.pnpm/wrangler@3.78.5_@cloudflare+workers-types@4.20240924.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_checked_fetch();
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
var jsonError = async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
};
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-OrDozK/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/.pnpm/wrangler@3.78.5_@cloudflare+workers-types@4.20240924.0/node_modules/wrangler/templates/middleware/common.ts
init_checked_fetch();
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}

// .wrangler/tmp/bundle-OrDozK/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  };
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      };
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
