var background = (function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
    LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
    LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
    LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
    LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
    return LogLevel2;
  })(LogLevel || {});
  var LogCategory = /* @__PURE__ */ ((LogCategory2) => {
    LogCategory2["STORAGE"] = "STORAGE";
    LogCategory2["SERVICE"] = "SERVICE";
    LogCategory2["UI"] = "UI";
    LogCategory2["NETWORK"] = "NETWORK";
    LogCategory2["BACKGROUND"] = "BACKGROUND";
    LogCategory2["CONTENT_SCRIPT"] = "CONTENT_SCRIPT";
    LogCategory2["PERFORMANCE"] = "PERFORMANCE";
    LogCategory2["ANALYTICS"] = "ANALYTICS";
    LogCategory2["MONITORING"] = "MONITORING";
    return LogCategory2;
  })(LogCategory || {});
  const _Logger = class _Logger {
    constructor() {
      __publicField(this, "minLevel", 0);
      __publicField(this, "enabledCategories", new Set(Object.values(LogCategory)));
      __publicField(this, "logHistory", []);
      __publicField(this, "maxHistorySize", 1e3);
    }
    static getInstance() {
      if (!_Logger.instance) {
        _Logger.instance = new _Logger();
      }
      return _Logger.instance;
    }
    /**
     * Set minimum log level (only logs at or above this level will be shown)
     */
    setMinLevel(level) {
      this.minLevel = level;
      this.info("ANALYTICS", "Log level changed", { newLevel: LogLevel[level] });
    }
    /**
     * Enable/disable specific log categories
     */
    setCategories(categories) {
      this.enabledCategories = new Set(categories);
      this.info("ANALYTICS", "Log categories updated", { categories: categories.map((c) => LogCategory[c]) });
    }
    /**
     * Get log history (useful for debugging)
     */
    getHistory(limit) {
      return limit ? this.logHistory.slice(-limit) : this.logHistory;
    }
    /**
     * Clear log history
     */
    clearHistory() {
      this.logHistory = [];
      console.log("[Uproot] Log history cleared");
    }
    /**
     * Main logging method
     */
    log(level, category, message, options = {}) {
      if (level < this.minLevel || !this.enabledCategories.has(category)) {
        return;
      }
      const levelName = LogLevel[level];
      const categoryName = LogCategory[category];
      const logEntry = {
        timestamp: Date.now(),
        level,
        category,
        message,
        data: options.data
      };
      this.logHistory.push(logEntry);
      if (this.logHistory.length > this.maxHistorySize) {
        this.logHistory.shift();
      }
      const prefix = `[Uproot][${levelName}][${categoryName}]`;
      const fullMessage = `${prefix} ${message}`;
      switch (level) {
        case 0:
          if (options.data) {
            console.debug(fullMessage, options.data);
          } else {
            console.debug(fullMessage);
          }
          break;
        case 1:
          if (options.data) {
            console.log(fullMessage, options.data);
          } else {
            console.log(fullMessage);
          }
          break;
        case 2:
          if (options.data) {
            console.warn(fullMessage, options.data);
          } else {
            console.warn(fullMessage);
          }
          break;
        case 3:
          if (options.data && options.error) {
            console.error(fullMessage, options.data, options.error);
          } else if (options.data) {
            console.error(fullMessage, options.data);
          } else if (options.error) {
            console.error(fullMessage, options.error);
          } else {
            console.error(fullMessage);
          }
          if (options.error) {
            console.error("Stack trace:", options.error.stack);
          }
          break;
      }
      if (options.duration !== void 0) {
        console.log(`${prefix} ⏱️ Duration: ${options.duration.toFixed(2)}ms`);
      }
    }
    // Convenience methods
    debug(category, message, data) {
      this.log(0, category, message, { data });
    }
    info(category, message, data) {
      this.log(1, category, message, { data });
    }
    warn(category, message, data) {
      this.log(2, category, message, { data });
    }
    error(category, message, errorOrData, data) {
      const isErrorObject = errorOrData instanceof Error;
      const error = isErrorObject ? errorOrData : errorOrData?.error;
      const mergedData = isErrorObject ? data : { ...errorOrData, ...data };
      this.log(3, category, message, { error, data: mergedData });
    }
    /**
     * Performance tracking helper
     */
    startTimer(category, operation) {
      const startTime = performance.now();
      this.debug("PERFORMANCE", `▶️ Started: ${operation}`, { category: LogCategory[category] });
      return () => {
        const duration = performance.now() - startTime;
        this.info("PERFORMANCE", `✅ Completed: ${operation}`, { category: LogCategory[category], duration: `${duration.toFixed(2)}ms` });
      };
    }
    /**
     * Async operation wrapper with automatic logging
     */
    async trackAsync(category, operation, fn) {
      const startTime = performance.now();
      this.debug(category, `▶️ Started: ${operation}`);
      try {
        const result2 = await fn();
        const duration = performance.now() - startTime;
        this.info(category, `✅ Completed: ${operation}`, { duration: `${duration.toFixed(2)}ms` });
        return result2;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.error(category, `❌ Failed: ${operation}`, error, { duration: `${duration.toFixed(2)}ms` });
        throw error;
      }
    }
    /**
     * Log function entry/exit (for detailed tracing)
     */
    trace(category, functionName, args) {
      this.debug(category, `→ Entering: ${functionName}`, { args });
      return (returnValue) => {
        this.debug(category, `← Exiting: ${functionName}`, { returnValue });
      };
    }
    /**
     * Log data changes (useful for state management)
     */
    logChange(category, entity, action, data) {
      const emojiMap = {
        create: "➕",
        update: "✏️",
        delete: "🗑️",
        markAllRead: "✅",
        clear: "🧹"
      };
      const emoji = emojiMap[action] || "📝";
      this.info(category, `${emoji} ${action.toUpperCase()}: ${entity}`, data);
    }
    /**
     * Log analytics events
     */
    logEvent(eventName, properties) {
      this.info("ANALYTICS", `📊 Event: ${eventName}`, properties);
    }
    /**
     * Log user actions
     */
    logAction(action, details) {
      this.info("UI", `👆 User Action: ${action}`, details);
    }
    /**
     * Log API calls
     */
    logApiCall(method, endpoint, status, duration) {
      const statusEmoji = status && status >= 200 && status < 300 ? "✅" : "❌";
      this.info("NETWORK", `${statusEmoji} ${method} ${endpoint}`, { status, duration: duration ? `${duration}ms` : void 0 });
    }
    /**
     * Export logs for debugging
     */
    exportLogs() {
      return JSON.stringify(this.logHistory, null, 2);
    }
    /**
     * Download logs as file (only works in DOM context, not in service worker)
     */
    downloadLogs() {
      if (typeof document === "undefined") {
        console.warn("[Uproot] downloadLogs() cannot be called in service worker context");
        return;
      }
      const logs = this.exportLogs();
      const blob = new Blob([logs], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `uproot-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.info("ANALYTICS", "Logs downloaded");
    }
  };
  __publicField(_Logger, "instance");
  let Logger = _Logger;
  const logger$1 = Logger.getInstance();
  const log = {
    debug: (category, message, data) => logger$1.debug(category, message, data),
    info: (category, message, data) => logger$1.info(category, message, data),
    warn: (category, message, data) => logger$1.warn(category, message, data),
    error: (category, message, errorOrData, data) => logger$1.error(category, message, errorOrData, data),
    // Specialized logging
    startTimer: (category, operation) => logger$1.startTimer(category, operation),
    trackAsync: (category, operation, fn) => logger$1.trackAsync(category, operation, fn),
    trace: (category, functionName, args) => logger$1.trace(category, functionName, args),
    change: (category, entity, action, data) => logger$1.logChange(category, entity, action, data),
    event: (eventName, properties) => logger$1.logEvent(eventName, properties),
    action: (action, details) => logger$1.logAction(action, details),
    apiCall: (method, endpoint, status, duration) => logger$1.logApiCall(method, endpoint, status, duration),
    // Utility
    setMinLevel: (level) => logger$1.setMinLevel(level),
    setCategories: (categories) => logger$1.setCategories(categories),
    getHistory: (limit) => logger$1.getHistory(limit),
    clearHistory: () => logger$1.clearHistory(),
    exportLogs: () => logger$1.exportLogs(),
    downloadLogs: () => logger$1.downloadLogs()
  };
  logger$1.info("ANALYTICS", "🚀 Uproot LinkedIn Extension - Logging initialized", {
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  background;
  function scrapeCompanyJobs(companyUrl) {
    if (typeof document === "undefined") {
      console.warn("[Uproot] scrapeCompanyJobs() cannot be called in service worker context");
      return [];
    }
    const jobs = [];
    try {
      const jobCards = document.querySelectorAll(".jobs-search__results-list li, .scaffold-layout__list-item");
      jobCards.forEach((card, _index) => {
        try {
          const job = extractJobFromCard(card, companyUrl);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.error("[Uproot] Error extracting job from card:", error instanceof Error ? error.message : String(error), error);
        }
      });
      console.log(`[Uproot] Scraped ${jobs.length} jobs from company page`);
    } catch (error) {
      console.error("[Uproot] Error scraping company jobs:", error instanceof Error ? error.message : String(error), error);
    }
    return jobs;
  }
  function extractJobFromCard(card, companyUrl) {
    try {
      const titleLink = card.querySelector("a.job-card-list__title, a.job-card-container__link");
      if (!titleLink) return null;
      const title = titleLink.textContent?.trim() || "";
      const jobUrl = titleLink.href;
      const jobId = extractJobIdFromUrl(jobUrl);
      const companyElement = card.querySelector(".job-card-container__company-name, .artdeco-entity-lockup__subtitle");
      const company = companyElement?.textContent?.trim() || "";
      const locationElement = card.querySelector(".job-card-container__metadata-item, .artdeco-entity-lockup__caption");
      const location2 = locationElement?.textContent?.trim() || "";
      const postedElement = card.querySelector("time");
      const postedDate = postedElement?.textContent?.trim() || "";
      const postedTimestamp = estimateTimestamp(postedDate);
      const isEasyApply = card.querySelector(".job-card-container__apply-method")?.textContent?.includes("Easy Apply") || false;
      const applicantElement = card.querySelector(".job-card-container__footer-item");
      const applicantCount = applicantElement?.textContent?.trim();
      const workLocation = inferWorkLocationType(location2);
      const experienceLevel = inferExperienceLevel(title);
      return {
        id: jobId,
        title,
        company,
        companyUrl,
        location: location2,
        workLocation,
        experienceLevel,
        postedDate,
        postedTimestamp,
        jobUrl,
        isEasyApply,
        applicantCount
      };
    } catch (error) {
      console.error("[Uproot] Error extracting job from card:", error instanceof Error ? error.message : String(error), error);
      return null;
    }
  }
  function extractJobIdFromUrl(url) {
    const match = url.match(/jobs\/view\/(\d+)/);
    return match ? match[1] : url;
  }
  function estimateTimestamp(postedDate) {
    const now = Date.now();
    const text = postedDate.toLowerCase();
    if (text.includes("just now") || text.includes("now")) {
      return now;
    }
    const minutesMatch = text.match(/(\d+)\s*minute/);
    if (minutesMatch) {
      return now - parseInt(minutesMatch[1]) * 60 * 1e3;
    }
    const hoursMatch = text.match(/(\d+)\s*hour/);
    if (hoursMatch) {
      return now - parseInt(hoursMatch[1]) * 60 * 60 * 1e3;
    }
    const daysMatch = text.match(/(\d+)\s*day/);
    if (daysMatch) {
      return now - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1e3;
    }
    const weeksMatch = text.match(/(\d+)\s*week/);
    if (weeksMatch) {
      return now - parseInt(weeksMatch[1]) * 7 * 24 * 60 * 60 * 1e3;
    }
    const monthsMatch = text.match(/(\d+)\s*month/);
    if (monthsMatch) {
      return now - parseInt(monthsMatch[1]) * 30 * 24 * 60 * 60 * 1e3;
    }
    return now - 24 * 60 * 60 * 1e3;
  }
  function inferWorkLocationType(location2) {
    const lower = location2.toLowerCase();
    if (lower.includes("remote")) return "remote";
    if (lower.includes("hybrid")) return "hybrid";
    if (lower.includes("on-site") || lower.includes("onsite") || lower.includes("in-office")) return "onsite";
    return void 0;
  }
  function inferExperienceLevel(title) {
    const lower = title.toLowerCase();
    if (lower.includes("intern")) return "internship";
    if (lower.includes("entry") || lower.includes("junior") || lower.includes("associate")) return "entry";
    if (lower.includes("senior") || lower.includes("sr.")) return "senior";
    if (lower.includes("director") || lower.includes("head of")) return "director";
    if (lower.includes("vp") || lower.includes("vice president") || lower.includes("chief") || lower.includes("ceo") || lower.includes("cto") || lower.includes("cfo")) return "executive";
    return "mid";
  }
  background;
  function isContextInvalidatedError(error) {
    if (!error) return false;
    if (error.message) {
      const message = error.message.toLowerCase();
      if (message.includes("extension context invalidated") || message.includes("access to storage is not allowed") || message.includes("storage is not available") || message.includes("context invalidated")) {
        return true;
      }
    }
    const errorStr = String(error).toLowerCase();
    return errorStr.includes("extension context invalidated") || errorStr.includes("access to storage is not allowed") || errorStr.includes("storage is not available") || errorStr.includes("context invalidated");
  }
  background;
  function scrapePersonProfile() {
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("[Uproot] scrapePersonProfile() cannot be called in service worker context");
      return null;
    }
    try {
      const profileUrl = window.location.href;
      const nameElement = document.querySelector("h1.text-heading-xlarge, h1.inline");
      const name = nameElement?.textContent?.trim() || "";
      const headlineElement = document.querySelector(".text-body-medium.break-words, .pv-text-details__left-panel h2");
      const headline = headlineElement?.textContent?.trim() || "";
      const photoElement = document.querySelector("img.pv-top-card-profile-picture__image");
      const photoUrl = photoElement?.src;
      const locationElement = document.querySelector(".text-body-small.inline.t-black--light.break-words, .pv-text-details__left-panel span.text-body-small");
      const location2 = locationElement?.textContent?.trim() || "";
      const currentRoleElement = document.querySelector(".pvs-list__item--line-separated:first-child, .experience-item:first-child");
      let currentRole = {
        title: "",
        company: "",
        companyUrl: void 0,
        startDate: void 0
      };
      if (currentRoleElement) {
        const titleEl = currentRoleElement.querySelector('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
        const companyEl = currentRoleElement.querySelector('.t-14.t-normal span[aria-hidden="true"]');
        const companyLinkEl = currentRoleElement.querySelector('a[href*="/company/"]');
        const dateEl = currentRoleElement.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"]');
        currentRole = {
          title: titleEl?.textContent?.trim() || "",
          company: companyEl?.textContent?.trim().split("·")[0]?.trim() || "",
          companyUrl: companyLinkEl?.href,
          startDate: dateEl?.textContent?.trim().split("·")[0]?.trim()
        };
      }
      return {
        profileUrl,
        name,
        headline,
        currentRole,
        location: location2,
        photoUrl
      };
    } catch (error) {
      console.error("[Uproot] Error scraping person profile:", error instanceof Error ? error.message : String(error), error);
      return null;
    }
  }
  background;
  function scrapeCompanyUpdates(companyUrl) {
    if (typeof document === "undefined") {
      console.warn("[Uproot] scrapeCompanyUpdates() cannot be called in service worker context");
      return [];
    }
    const updates = [];
    try {
      const postCards = document.querySelectorAll(".feed-shared-update-v2, .occludable-update");
      postCards.forEach((card, _index) => {
        try {
          const update = extractUpdateFromCard(card);
          if (update) {
            updates.push(update);
          }
        } catch (error) {
          console.error("[Uproot] Error extracting update from card:", error instanceof Error ? error.message : String(error), error);
        }
      });
      console.log(`[Uproot] Scraped ${updates.length} updates from company page`);
    } catch (error) {
      console.error("[Uproot] Error scraping company updates:", error instanceof Error ? error.message : String(error), error);
    }
    return updates;
  }
  function extractUpdateFromCard(card) {
    try {
      const linkElement = card.querySelector('a[href*="/feed/update/"]');
      const url = linkElement?.href || "";
      const id = url.match(/urn:li:activity:(\d+)/)?.[1] || `update_${Date.now()}`;
      const textElement = card.querySelector('.feed-shared-text__text-view span[dir="ltr"]');
      const preview = textElement?.textContent?.trim().slice(0, 200) || "";
      const imageElement = card.querySelector("img.feed-shared-image__image");
      const imageUrl = imageElement?.src;
      const timeElement = card.querySelector("time");
      const timestamp = timeElement?.dateTime ? new Date(timeElement.dateTime).getTime() : Date.now();
      let type = "post";
      if (preview.toLowerCase().includes("hiring") || preview.toLowerCase().includes("join our team")) {
        type = "hiring";
      } else if (card.querySelector(".feed-shared-article")) {
        type = "article";
      } else if (preview.toLowerCase().includes("event")) {
        type = "event";
      }
      return {
        id,
        type,
        timestamp,
        url,
        preview,
        imageUrl
      };
    } catch (error) {
      console.error("[Uproot] Error extracting update from card:", error instanceof Error ? error.message : String(error), error);
      return null;
    }
  }
  background;
  background;
  background;
  background;
  const CONNECTION_PATHS_STORAGE_KEY = "uproot_connection_paths";
  const WATCHLIST_COMPANIES_STORAGE_KEY = "uproot_watchlist_companies";
  background;
  const createStoreImpl = (createState) => {
    let state;
    const listeners = /* @__PURE__ */ new Set();
    const setState = (partial, replace) => {
      const nextState = typeof partial === "function" ? partial(state) : partial;
      if (!Object.is(nextState, state)) {
        const previousState = state;
        state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
    const getState = () => state;
    const getInitialState = () => initialState;
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const api = { setState, getState, getInitialState, subscribe };
    const initialState = state = createState(setState, getState, api);
    return api;
  };
  const createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var react = { exports: {} };
  var react_production_min = {};
  /**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var hasRequiredReact_production_min;
  function requireReact_production_min() {
    if (hasRequiredReact_production_min) return react_production_min;
    hasRequiredReact_production_min = 1;
    var l = Symbol.for("react.element"), n = Symbol.for("react.portal"), p = Symbol.for("react.fragment"), q = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z = Symbol.iterator;
    function A(a) {
      if (null === a || "object" !== typeof a) return null;
      a = z && a[z] || a["@@iterator"];
      return "function" === typeof a ? a : null;
    }
    var B = { isMounted: function() {
      return false;
    }, enqueueForceUpdate: function() {
    }, enqueueReplaceState: function() {
    }, enqueueSetState: function() {
    } }, C = Object.assign, D = {};
    function E(a, b, e) {
      this.props = a;
      this.context = b;
      this.refs = D;
      this.updater = e || B;
    }
    E.prototype.isReactComponent = {};
    E.prototype.setState = function(a, b) {
      if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, a, b, "setState");
    };
    E.prototype.forceUpdate = function(a) {
      this.updater.enqueueForceUpdate(this, a, "forceUpdate");
    };
    function F() {
    }
    F.prototype = E.prototype;
    function G(a, b, e) {
      this.props = a;
      this.context = b;
      this.refs = D;
      this.updater = e || B;
    }
    var H = G.prototype = new F();
    H.constructor = G;
    C(H, E.prototype);
    H.isPureReactComponent = true;
    var I = Array.isArray, J = Object.prototype.hasOwnProperty, K = { current: null }, L = { key: true, ref: true, __self: true, __source: true };
    function M(a, b, e) {
      var d, c = {}, k = null, h = null;
      if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
      var g = arguments.length - 2;
      if (1 === g) c.children = e;
      else if (1 < g) {
        for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
        c.children = f;
      }
      if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
      return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
    }
    function N(a, b) {
      return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
    }
    function O(a) {
      return "object" === typeof a && null !== a && a.$$typeof === l;
    }
    function escape(a) {
      var b = { "=": "=0", ":": "=2" };
      return "$" + a.replace(/[=:]/g, function(a2) {
        return b[a2];
      });
    }
    var P = /\/+/g;
    function Q(a, b) {
      return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
    }
    function R(a, b, e, d, c) {
      var k = typeof a;
      if ("undefined" === k || "boolean" === k) a = null;
      var h = false;
      if (null === a) h = true;
      else switch (k) {
        case "string":
        case "number":
          h = true;
          break;
        case "object":
          switch (a.$$typeof) {
            case l:
            case n:
              h = true;
          }
      }
      if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
        return a2;
      })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
      h = 0;
      d = "" === d ? "." : d + ":";
      if (I(a)) for (var g = 0; g < a.length; g++) {
        k = a[g];
        var f = d + Q(k, g);
        h += R(k, b, e, f, c);
      }
      else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
      else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
      return h;
    }
    function S(a, b, e) {
      if (null == a) return a;
      var d = [], c = 0;
      R(a, d, "", "", function(a2) {
        return b.call(e, a2, c++);
      });
      return d;
    }
    function T(a) {
      if (-1 === a._status) {
        var b = a._result;
        b = b();
        b.then(function(b2) {
          if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
        }, function(b2) {
          if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
        });
        -1 === a._status && (a._status = 0, a._result = b);
      }
      if (1 === a._status) return a._result.default;
      throw a._result;
    }
    var U = { current: null }, V = { transition: null }, W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
    function X() {
      throw Error("act(...) is not supported in production builds of React.");
    }
    react_production_min.Children = { map: S, forEach: function(a, b, e) {
      S(a, function() {
        b.apply(this, arguments);
      }, e);
    }, count: function(a) {
      var b = 0;
      S(a, function() {
        b++;
      });
      return b;
    }, toArray: function(a) {
      return S(a, function(a2) {
        return a2;
      }) || [];
    }, only: function(a) {
      if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
      return a;
    } };
    react_production_min.Component = E;
    react_production_min.Fragment = p;
    react_production_min.Profiler = r;
    react_production_min.PureComponent = G;
    react_production_min.StrictMode = q;
    react_production_min.Suspense = w;
    react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
    react_production_min.act = X;
    react_production_min.cloneElement = function(a, b, e) {
      if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
      var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
      if (null != b) {
        void 0 !== b.ref && (k = b.ref, h = K.current);
        void 0 !== b.key && (c = "" + b.key);
        if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
        for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
      }
      var f = arguments.length - 2;
      if (1 === f) d.children = e;
      else if (1 < f) {
        g = Array(f);
        for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
        d.children = g;
      }
      return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
    };
    react_production_min.createContext = function(a) {
      a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
      a.Provider = { $$typeof: t, _context: a };
      return a.Consumer = a;
    };
    react_production_min.createElement = M;
    react_production_min.createFactory = function(a) {
      var b = M.bind(null, a);
      b.type = a;
      return b;
    };
    react_production_min.createRef = function() {
      return { current: null };
    };
    react_production_min.forwardRef = function(a) {
      return { $$typeof: v, render: a };
    };
    react_production_min.isValidElement = O;
    react_production_min.lazy = function(a) {
      return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
    };
    react_production_min.memo = function(a, b) {
      return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
    };
    react_production_min.startTransition = function(a) {
      var b = V.transition;
      V.transition = {};
      try {
        a();
      } finally {
        V.transition = b;
      }
    };
    react_production_min.unstable_act = X;
    react_production_min.useCallback = function(a, b) {
      return U.current.useCallback(a, b);
    };
    react_production_min.useContext = function(a) {
      return U.current.useContext(a);
    };
    react_production_min.useDebugValue = function() {
    };
    react_production_min.useDeferredValue = function(a) {
      return U.current.useDeferredValue(a);
    };
    react_production_min.useEffect = function(a, b) {
      return U.current.useEffect(a, b);
    };
    react_production_min.useId = function() {
      return U.current.useId();
    };
    react_production_min.useImperativeHandle = function(a, b, e) {
      return U.current.useImperativeHandle(a, b, e);
    };
    react_production_min.useInsertionEffect = function(a, b) {
      return U.current.useInsertionEffect(a, b);
    };
    react_production_min.useLayoutEffect = function(a, b) {
      return U.current.useLayoutEffect(a, b);
    };
    react_production_min.useMemo = function(a, b) {
      return U.current.useMemo(a, b);
    };
    react_production_min.useReducer = function(a, b, e) {
      return U.current.useReducer(a, b, e);
    };
    react_production_min.useRef = function(a) {
      return U.current.useRef(a);
    };
    react_production_min.useState = function(a) {
      return U.current.useState(a);
    };
    react_production_min.useSyncExternalStore = function(a, b, e) {
      return U.current.useSyncExternalStore(a, b, e);
    };
    react_production_min.useTransition = function() {
      return U.current.useTransition();
    };
    react_production_min.version = "18.3.1";
    return react_production_min;
  }
  var hasRequiredReact;
  function requireReact() {
    if (hasRequiredReact) return react.exports;
    hasRequiredReact = 1;
    {
      react.exports = requireReact_production_min();
    }
    return react.exports;
  }
  var reactExports = requireReact();
  const React = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
  const identity = (arg) => arg;
  function useStore(api, selector = identity) {
    const slice = React.useSyncExternalStore(
      api.subscribe,
      React.useCallback(() => selector(api.getState()), [api, selector]),
      React.useCallback(() => selector(api.getInitialState()), [api, selector])
    );
    React.useDebugValue(slice);
    return slice;
  }
  const createImpl = (createState) => {
    const api = createStore(createState);
    const useBoundStore = (selector) => useStore(api, selector);
    Object.assign(useBoundStore, api);
    return useBoundStore;
  };
  const create = ((createState) => createState ? createImpl(createState) : createImpl);
  var util;
  (function(util2) {
    util2.assertEqual = (_) => {
    };
    function assertIs(_arg) {
    }
    util2.assertIs = assertIs;
    function assertNever(_x) {
      throw new Error();
    }
    util2.assertNever = assertNever;
    util2.arrayToEnum = (items) => {
      const obj = {};
      for (const item of items) {
        obj[item] = item;
      }
      return obj;
    };
    util2.getValidEnumValues = (obj) => {
      const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
      const filtered = {};
      for (const k of validKeys) {
        filtered[k] = obj[k];
      }
      return util2.objectValues(filtered);
    };
    util2.objectValues = (obj) => {
      return util2.objectKeys(obj).map(function(e) {
        return obj[e];
      });
    };
    util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
      const keys = [];
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
    util2.find = (arr, checker) => {
      for (const item of arr) {
        if (checker(item))
          return item;
      }
      return void 0;
    };
    util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
      return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
    }
    util2.joinValues = joinValues;
    util2.jsonStringifyReplacer = (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    };
  })(util || (util = {}));
  var objectUtil;
  (function(objectUtil2) {
    objectUtil2.mergeShapes = (first, second) => {
      return {
        ...first,
        ...second
        // second overwrites first
      };
    };
  })(objectUtil || (objectUtil = {}));
  const ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
  ]);
  const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
      case "undefined":
        return ZodParsedType.undefined;
      case "string":
        return ZodParsedType.string;
      case "number":
        return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
      case "boolean":
        return ZodParsedType.boolean;
      case "function":
        return ZodParsedType.function;
      case "bigint":
        return ZodParsedType.bigint;
      case "symbol":
        return ZodParsedType.symbol;
      case "object":
        if (Array.isArray(data)) {
          return ZodParsedType.array;
        }
        if (data === null) {
          return ZodParsedType.null;
        }
        if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
          return ZodParsedType.promise;
        }
        if (typeof Map !== "undefined" && data instanceof Map) {
          return ZodParsedType.map;
        }
        if (typeof Set !== "undefined" && data instanceof Set) {
          return ZodParsedType.set;
        }
        if (typeof Date !== "undefined" && data instanceof Date) {
          return ZodParsedType.date;
        }
        return ZodParsedType.object;
      default:
        return ZodParsedType.unknown;
    }
  };
  const ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite"
  ]);
  class ZodError extends Error {
    get errors() {
      return this.issues;
    }
    constructor(issues) {
      super();
      this.issues = [];
      this.addIssue = (sub) => {
        this.issues = [...this.issues, sub];
      };
      this.addIssues = (subs = []) => {
        this.issues = [...this.issues, ...subs];
      };
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(this, actualProto);
      } else {
        this.__proto__ = actualProto;
      }
      this.name = "ZodError";
      this.issues = issues;
    }
    format(_mapper) {
      const mapper = _mapper || function(issue) {
        return issue.message;
      };
      const fieldErrors = { _errors: [] };
      const processError = (error) => {
        for (const issue of error.issues) {
          if (issue.code === "invalid_union") {
            issue.unionErrors.map(processError);
          } else if (issue.code === "invalid_return_type") {
            processError(issue.returnTypeError);
          } else if (issue.code === "invalid_arguments") {
            processError(issue.argumentsError);
          } else if (issue.path.length === 0) {
            fieldErrors._errors.push(mapper(issue));
          } else {
            let curr = fieldErrors;
            let i = 0;
            while (i < issue.path.length) {
              const el = issue.path[i];
              const terminal = i === issue.path.length - 1;
              if (!terminal) {
                curr[el] = curr[el] || { _errors: [] };
              } else {
                curr[el] = curr[el] || { _errors: [] };
                curr[el]._errors.push(mapper(issue));
              }
              curr = curr[el];
              i++;
            }
          }
        }
      };
      processError(this);
      return fieldErrors;
    }
    static assert(value) {
      if (!(value instanceof ZodError)) {
        throw new Error(`Not a ZodError: ${value}`);
      }
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of this.issues) {
        if (sub.path.length > 0) {
          const firstEl = sub.path[0];
          fieldErrors[firstEl] = fieldErrors[firstEl] || [];
          fieldErrors[firstEl].push(mapper(sub));
        } else {
          formErrors.push(mapper(sub));
        }
      }
      return { formErrors, fieldErrors };
    }
    get formErrors() {
      return this.flatten();
    }
  }
  ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
  };
  const errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === ZodParsedType.undefined) {
          message = "Required";
        } else {
          message = `Expected ${issue.expected}, received ${issue.received}`;
        }
        break;
      case ZodIssueCode.invalid_literal:
        message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
        break;
      case ZodIssueCode.unrecognized_keys:
        message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
        break;
      case ZodIssueCode.invalid_union:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_union_discriminator:
        message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
        break;
      case ZodIssueCode.invalid_enum_value:
        message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
        break;
      case ZodIssueCode.invalid_arguments:
        message = `Invalid function arguments`;
        break;
      case ZodIssueCode.invalid_return_type:
        message = `Invalid function return type`;
        break;
      case ZodIssueCode.invalid_date:
        message = `Invalid date`;
        break;
      case ZodIssueCode.invalid_string:
        if (typeof issue.validation === "object") {
          if ("includes" in issue.validation) {
            message = `Invalid input: must include "${issue.validation.includes}"`;
            if (typeof issue.validation.position === "number") {
              message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
            }
          } else if ("startsWith" in issue.validation) {
            message = `Invalid input: must start with "${issue.validation.startsWith}"`;
          } else if ("endsWith" in issue.validation) {
            message = `Invalid input: must end with "${issue.validation.endsWith}"`;
          } else {
            util.assertNever(issue.validation);
          }
        } else if (issue.validation !== "regex") {
          message = `Invalid ${issue.validation}`;
        } else {
          message = "Invalid";
        }
        break;
      case ZodIssueCode.too_small:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "bigint")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.too_big:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "bigint")
          message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.custom:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_intersection_types:
        message = `Intersection results could not be merged`;
        break;
      case ZodIssueCode.not_multiple_of:
        message = `Number must be a multiple of ${issue.multipleOf}`;
        break;
      case ZodIssueCode.not_finite:
        message = "Number must be finite";
        break;
      default:
        message = _ctx.defaultError;
        util.assertNever(issue);
    }
    return { message };
  };
  let overrideErrorMap = errorMap;
  function getErrorMap() {
    return overrideErrorMap;
  }
  const makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...issueData.path || []];
    const fullIssue = {
      ...issueData,
      path: fullPath
    };
    if (issueData.message !== void 0) {
      return {
        ...issueData,
        path: fullPath,
        message: issueData.message
      };
    }
    let errorMessage = "";
    const maps = errorMaps.filter((m) => !!m).slice().reverse();
    for (const map of maps) {
      errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
      ...issueData,
      path: fullPath,
      message: errorMessage
    };
  };
  function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
      issueData,
      data: ctx.data,
      path: ctx.path,
      errorMaps: [
        ctx.common.contextualErrorMap,
        // contextual error map is first priority
        ctx.schemaErrorMap,
        // then schema-bound map if available
        overrideMap,
        // then global override map
        overrideMap === errorMap ? void 0 : errorMap
        // then global default map
      ].filter((x) => !!x)
    });
    ctx.common.issues.push(issue);
  }
  class ParseStatus {
    constructor() {
      this.value = "valid";
    }
    dirty() {
      if (this.value === "valid")
        this.value = "dirty";
    }
    abort() {
      if (this.value !== "aborted")
        this.value = "aborted";
    }
    static mergeArray(status, results) {
      const arrayValue = [];
      for (const s of results) {
        if (s.status === "aborted")
          return INVALID;
        if (s.status === "dirty")
          status.dirty();
        arrayValue.push(s.value);
      }
      return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
      const syncPairs = [];
      for (const pair of pairs) {
        const key = await pair.key;
        const value = await pair.value;
        syncPairs.push({
          key,
          value
        });
      }
      return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
      const finalObject = {};
      for (const pair of pairs) {
        const { key, value } = pair;
        if (key.status === "aborted")
          return INVALID;
        if (value.status === "aborted")
          return INVALID;
        if (key.status === "dirty")
          status.dirty();
        if (value.status === "dirty")
          status.dirty();
        if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
          finalObject[key.value] = value.value;
        }
      }
      return { status: status.value, value: finalObject };
    }
  }
  const INVALID = Object.freeze({
    status: "aborted"
  });
  const DIRTY = (value) => ({ status: "dirty", value });
  const OK = (value) => ({ status: "valid", value });
  const isAborted = (x) => x.status === "aborted";
  const isDirty = (x) => x.status === "dirty";
  const isValid = (x) => x.status === "valid";
  const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
  var errorUtil;
  (function(errorUtil2) {
    errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
  })(errorUtil || (errorUtil = {}));
  class ParseInputLazyPath {
    constructor(parent, value, path, key) {
      this._cachedPath = [];
      this.parent = parent;
      this.data = value;
      this._path = path;
      this._key = key;
    }
    get path() {
      if (!this._cachedPath.length) {
        if (Array.isArray(this._key)) {
          this._cachedPath.push(...this._path, ...this._key);
        } else {
          this._cachedPath.push(...this._path, this._key);
        }
      }
      return this._cachedPath;
    }
  }
  const handleResult = (ctx, result2) => {
    if (isValid(result2)) {
      return { success: true, data: result2.value };
    } else {
      if (!ctx.common.issues.length) {
        throw new Error("Validation failed but no issues detected.");
      }
      return {
        success: false,
        get error() {
          if (this._error)
            return this._error;
          const error = new ZodError(ctx.common.issues);
          this._error = error;
          return this._error;
        }
      };
    }
  };
  function processCreateParams(params) {
    if (!params)
      return {};
    const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
    if (errorMap2 && (invalid_type_error || required_error)) {
      throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap2)
      return { errorMap: errorMap2, description };
    const customMap = (iss, ctx) => {
      const { message } = params;
      if (iss.code === "invalid_enum_value") {
        return { message: message ?? ctx.defaultError };
      }
      if (typeof ctx.data === "undefined") {
        return { message: message ?? required_error ?? ctx.defaultError };
      }
      if (iss.code !== "invalid_type")
        return { message: ctx.defaultError };
      return { message: message ?? invalid_type_error ?? ctx.defaultError };
    };
    return { errorMap: customMap, description };
  }
  class ZodType {
    get description() {
      return this._def.description;
    }
    _getType(input) {
      return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
      return ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      };
    }
    _processInputParams(input) {
      return {
        status: new ParseStatus(),
        ctx: {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        }
      };
    }
    _parseSync(input) {
      const result2 = this._parse(input);
      if (isAsync(result2)) {
        throw new Error("Synchronous parse encountered promise.");
      }
      return result2;
    }
    _parseAsync(input) {
      const result2 = this._parse(input);
      return Promise.resolve(result2);
    }
    parse(data, params) {
      const result2 = this.safeParse(data, params);
      if (result2.success)
        return result2.data;
      throw result2.error;
    }
    safeParse(data, params) {
      const ctx = {
        common: {
          issues: [],
          async: params?.async ?? false,
          contextualErrorMap: params?.errorMap
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const result2 = this._parseSync({ data, path: ctx.path, parent: ctx });
      return handleResult(ctx, result2);
    }
    "~validate"(data) {
      const ctx = {
        common: {
          issues: [],
          async: !!this["~standard"].async
        },
        path: [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      if (!this["~standard"].async) {
        try {
          const result2 = this._parseSync({ data, path: [], parent: ctx });
          return isValid(result2) ? {
            value: result2.value
          } : {
            issues: ctx.common.issues
          };
        } catch (err) {
          if (err?.message?.toLowerCase()?.includes("encountered")) {
            this["~standard"].async = true;
          }
          ctx.common = {
            issues: [],
            async: true
          };
        }
      }
      return this._parseAsync({ data, path: [], parent: ctx }).then((result2) => isValid(result2) ? {
        value: result2.value
      } : {
        issues: ctx.common.issues
      });
    }
    async parseAsync(data, params) {
      const result2 = await this.safeParseAsync(data, params);
      if (result2.success)
        return result2.data;
      throw result2.error;
    }
    async safeParseAsync(data, params) {
      const ctx = {
        common: {
          issues: [],
          contextualErrorMap: params?.errorMap,
          async: true
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
      const result2 = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
      return handleResult(ctx, result2);
    }
    refine(check, message) {
      const getIssueProperties = (val) => {
        if (typeof message === "string" || typeof message === "undefined") {
          return { message };
        } else if (typeof message === "function") {
          return message(val);
        } else {
          return message;
        }
      };
      return this._refinement((val, ctx) => {
        const result2 = check(val);
        const setError = () => ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val)
        });
        if (typeof Promise !== "undefined" && result2 instanceof Promise) {
          return result2.then((data) => {
            if (!data) {
              setError();
              return false;
            } else {
              return true;
            }
          });
        }
        if (!result2) {
          setError();
          return false;
        } else {
          return true;
        }
      });
    }
    refinement(check, refinementData) {
      return this._refinement((val, ctx) => {
        if (!check(val)) {
          ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
          return false;
        } else {
          return true;
        }
      });
    }
    _refinement(refinement) {
      return new ZodEffects({
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "refinement", refinement }
      });
    }
    superRefine(refinement) {
      return this._refinement(refinement);
    }
    constructor(def) {
      this.spa = this.safeParseAsync;
      this._def = def;
      this.parse = this.parse.bind(this);
      this.safeParse = this.safeParse.bind(this);
      this.parseAsync = this.parseAsync.bind(this);
      this.safeParseAsync = this.safeParseAsync.bind(this);
      this.spa = this.spa.bind(this);
      this.refine = this.refine.bind(this);
      this.refinement = this.refinement.bind(this);
      this.superRefine = this.superRefine.bind(this);
      this.optional = this.optional.bind(this);
      this.nullable = this.nullable.bind(this);
      this.nullish = this.nullish.bind(this);
      this.array = this.array.bind(this);
      this.promise = this.promise.bind(this);
      this.or = this.or.bind(this);
      this.and = this.and.bind(this);
      this.transform = this.transform.bind(this);
      this.brand = this.brand.bind(this);
      this.default = this.default.bind(this);
      this.catch = this.catch.bind(this);
      this.describe = this.describe.bind(this);
      this.pipe = this.pipe.bind(this);
      this.readonly = this.readonly.bind(this);
      this.isNullable = this.isNullable.bind(this);
      this.isOptional = this.isOptional.bind(this);
      this["~standard"] = {
        version: 1,
        vendor: "zod",
        validate: (data) => this["~validate"](data)
      };
    }
    optional() {
      return ZodOptional.create(this, this._def);
    }
    nullable() {
      return ZodNullable.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return ZodArray.create(this);
    }
    promise() {
      return ZodPromise.create(this, this._def);
    }
    or(option) {
      return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
      return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
      return new ZodEffects({
        ...processCreateParams(this._def),
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "transform", transform }
      });
    }
    default(def) {
      const defaultValueFunc = typeof def === "function" ? def : () => def;
      return new ZodDefault({
        ...processCreateParams(this._def),
        innerType: this,
        defaultValue: defaultValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodDefault
      });
    }
    brand() {
      return new ZodBranded({
        typeName: ZodFirstPartyTypeKind.ZodBranded,
        type: this,
        ...processCreateParams(this._def)
      });
    }
    catch(def) {
      const catchValueFunc = typeof def === "function" ? def : () => def;
      return new ZodCatch({
        ...processCreateParams(this._def),
        innerType: this,
        catchValue: catchValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodCatch
      });
    }
    describe(description) {
      const This = this.constructor;
      return new This({
        ...this._def,
        description
      });
    }
    pipe(target) {
      return ZodPipeline.create(this, target);
    }
    readonly() {
      return ZodReadonly.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  }
  const cuidRegex = /^c[^\s-]{8,}$/i;
  const cuid2Regex = /^[0-9a-z]+$/;
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
  const nanoidRegex = /^[a-z0-9_-]{21}$/i;
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
  const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
  const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
  let emojiRegex;
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
  const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
  const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
  const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
  const dateRegex = new RegExp(`^${dateRegexSource}$`);
  function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
      secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    } else if (args.precision == null) {
      secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?";
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
  }
  function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
  }
  function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
      opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
  }
  function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
      return true;
    }
    return false;
  }
  function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
      return false;
    try {
      const [header] = jwt.split(".");
      if (!header)
        return false;
      const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
      const decoded = JSON.parse(atob(base64));
      if (typeof decoded !== "object" || decoded === null)
        return false;
      if ("typ" in decoded && decoded?.typ !== "JWT")
        return false;
      if (!decoded.alg)
        return false;
      if (alg && decoded.alg !== alg)
        return false;
      return true;
    } catch {
      return false;
    }
  }
  function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
      return true;
    }
    return false;
  }
  class ZodString extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = String(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.string) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.length < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.length > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "length") {
          const tooBig = input.data.length > check.value;
          const tooSmall = input.data.length < check.value;
          if (tooBig || tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            if (tooBig) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            } else if (tooSmall) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            }
            status.dirty();
          }
        } else if (check.kind === "email") {
          if (!emailRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "email",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "emoji") {
          if (!emojiRegex) {
            emojiRegex = new RegExp(_emojiRegex, "u");
          }
          if (!emojiRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "emoji",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "uuid") {
          if (!uuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "uuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "nanoid") {
          if (!nanoidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "nanoid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid") {
          if (!cuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid2") {
          if (!cuid2Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid2",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ulid") {
          if (!ulidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ulid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "url") {
          try {
            new URL(input.data);
          } catch {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "regex") {
          check.regex.lastIndex = 0;
          const testResult = check.regex.test(input.data);
          if (!testResult) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "regex",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "trim") {
          input.data = input.data.trim();
        } else if (check.kind === "includes") {
          if (!input.data.includes(check.value, check.position)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { includes: check.value, position: check.position },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "toLowerCase") {
          input.data = input.data.toLowerCase();
        } else if (check.kind === "toUpperCase") {
          input.data = input.data.toUpperCase();
        } else if (check.kind === "startsWith") {
          if (!input.data.startsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { startsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "endsWith") {
          if (!input.data.endsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { endsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "datetime") {
          const regex = datetimeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "datetime",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "date") {
          const regex = dateRegex;
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "date",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "time") {
          const regex = timeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "time",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "duration") {
          if (!durationRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "duration",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ip") {
          if (!isValidIP(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ip",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "jwt") {
          if (!isValidJWT(input.data, check.alg)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "jwt",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cidr") {
          if (!isValidCidr(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cidr",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64") {
          if (!base64Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64url") {
          if (!base64urlRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
      return this.refinement((data) => regex.test(data), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message)
      });
    }
    _addCheck(check) {
      return new ZodString({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    email(message) {
      return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
      return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
      return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
      return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
      return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
      return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
      return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
      return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
      return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
      return this._addCheck({
        kind: "base64url",
        ...errorUtil.errToObj(message)
      });
    }
    jwt(options) {
      return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
      return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
      return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "datetime",
          precision: null,
          offset: false,
          local: false,
          message: options
        });
      }
      return this._addCheck({
        kind: "datetime",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        offset: options?.offset ?? false,
        local: options?.local ?? false,
        ...errorUtil.errToObj(options?.message)
      });
    }
    date(message) {
      return this._addCheck({ kind: "date", message });
    }
    time(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "time",
          precision: null,
          message: options
        });
      }
      return this._addCheck({
        kind: "time",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        ...errorUtil.errToObj(options?.message)
      });
    }
    duration(message) {
      return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
      return this._addCheck({
        kind: "regex",
        regex,
        ...errorUtil.errToObj(message)
      });
    }
    includes(value, options) {
      return this._addCheck({
        kind: "includes",
        value,
        position: options?.position,
        ...errorUtil.errToObj(options?.message)
      });
    }
    startsWith(value, message) {
      return this._addCheck({
        kind: "startsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    endsWith(value, message) {
      return this._addCheck({
        kind: "endsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    min(minLength, message) {
      return this._addCheck({
        kind: "min",
        value: minLength,
        ...errorUtil.errToObj(message)
      });
    }
    max(maxLength, message) {
      return this._addCheck({
        kind: "max",
        value: maxLength,
        ...errorUtil.errToObj(message)
      });
    }
    length(len, message) {
      return this._addCheck({
        kind: "length",
        value: len,
        ...errorUtil.errToObj(message)
      });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
      return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
      return new ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "trim" }]
      });
    }
    toLowerCase() {
      return new ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toLowerCase" }]
      });
    }
    toUpperCase() {
      return new ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toUpperCase" }]
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
      return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
      return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
      return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
      return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
      return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
      return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
      return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
      return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
      return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
      return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
      return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
      return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
      return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxLength() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  }
  ZodString.create = (params) => {
    return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return valInt % stepInt / 10 ** decCount;
  }
  class ZodNumber extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
      this.step = this.multipleOf;
    }
    _parse(input) {
      if (this._def.coerce) {
        input.data = Number(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.number) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.number,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "int") {
          if (!util.isInteger(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_type,
              expected: "integer",
              received: "float",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (floatSafeRemainder(input.data, check.value) !== 0) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "finite") {
          if (!Number.isFinite(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_finite,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new ZodNumber({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new ZodNumber({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    int(message) {
      return this._addCheck({
        kind: "int",
        message: errorUtil.toString(message)
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    finite(message) {
      return this._addCheck({
        kind: "finite",
        message: errorUtil.toString(message)
      });
    }
    safe(message) {
      return this._addCheck({
        kind: "min",
        inclusive: true,
        value: Number.MIN_SAFE_INTEGER,
        message: errorUtil.toString(message)
      })._addCheck({
        kind: "max",
        inclusive: true,
        value: Number.MAX_SAFE_INTEGER,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
    get isInt() {
      return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
    }
    get isFinite() {
      let max = null;
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
          return true;
        } else if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        } else if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return Number.isFinite(min) && Number.isFinite(max);
    }
  }
  ZodNumber.create = (params) => {
    return new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  class ZodBigInt extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
    }
    _parse(input) {
      if (this._def.coerce) {
        try {
          input.data = BigInt(input.data);
        } catch {
          return this._getInvalidInput(input);
        }
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.bigint) {
        return this._getInvalidInput(input);
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              type: "bigint",
              minimum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              type: "bigint",
              maximum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (input.data % check.value !== BigInt(0)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return INVALID;
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new ZodBigInt({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new ZodBigInt({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  }
  ZodBigInt.create = (params) => {
    return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  class ZodBoolean extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = Boolean(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.boolean) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.boolean,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  }
  ZodBoolean.create = (params) => {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  class ZodDate extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = new Date(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.date) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.date,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      if (Number.isNaN(input.data.getTime())) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_date
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.getTime() < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              message: check.message,
              inclusive: true,
              exact: false,
              minimum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.getTime() > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              message: check.message,
              inclusive: true,
              exact: false,
              maximum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return {
        status: status.value,
        value: new Date(input.data.getTime())
      };
    }
    _addCheck(check) {
      return new ZodDate({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    min(minDate, message) {
      return this._addCheck({
        kind: "min",
        value: minDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    max(maxDate, message) {
      return this._addCheck({
        kind: "max",
        value: maxDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    get minDate() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min != null ? new Date(min) : null;
    }
    get maxDate() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max != null ? new Date(max) : null;
    }
  }
  ZodDate.create = (params) => {
    return new ZodDate({
      checks: [],
      coerce: params?.coerce || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params)
    });
  };
  class ZodSymbol extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.symbol) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.symbol,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  }
  ZodSymbol.create = (params) => {
    return new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params)
    });
  };
  class ZodUndefined extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.undefined,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  }
  ZodUndefined.create = (params) => {
    return new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params)
    });
  };
  class ZodNull extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.null) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.null,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  }
  ZodNull.create = (params) => {
    return new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params)
    });
  };
  class ZodAny extends ZodType {
    constructor() {
      super(...arguments);
      this._any = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  }
  ZodAny.create = (params) => {
    return new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params)
    });
  };
  class ZodUnknown extends ZodType {
    constructor() {
      super(...arguments);
      this._unknown = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  }
  ZodUnknown.create = (params) => {
    return new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params)
    });
  };
  class ZodNever extends ZodType {
    _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.never,
        received: ctx.parsedType
      });
      return INVALID;
    }
  }
  ZodNever.create = (params) => {
    return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params)
    });
  };
  class ZodVoid extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.void,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  }
  ZodVoid.create = (params) => {
    return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params)
    });
  };
  class ZodArray extends ZodType {
    _parse(input) {
      const { ctx, status } = this._processInputParams(input);
      const def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (def.exactLength !== null) {
        const tooBig = ctx.data.length > def.exactLength.value;
        const tooSmall = ctx.data.length < def.exactLength.value;
        if (tooBig || tooSmall) {
          addIssueToContext(ctx, {
            code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
            minimum: tooSmall ? def.exactLength.value : void 0,
            maximum: tooBig ? def.exactLength.value : void 0,
            type: "array",
            inclusive: true,
            exact: true,
            message: def.exactLength.message
          });
          status.dirty();
        }
      }
      if (def.minLength !== null) {
        if (ctx.data.length < def.minLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.minLength.message
          });
          status.dirty();
        }
      }
      if (def.maxLength !== null) {
        if (ctx.data.length > def.maxLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.maxLength.message
          });
          status.dirty();
        }
      }
      if (ctx.common.async) {
        return Promise.all([...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        })).then((result3) => {
          return ParseStatus.mergeArray(status, result3);
        });
      }
      const result2 = [...ctx.data].map((item, i) => {
        return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      });
      return ParseStatus.mergeArray(status, result2);
    }
    get element() {
      return this._def.type;
    }
    min(minLength, message) {
      return new ZodArray({
        ...this._def,
        minLength: { value: minLength, message: errorUtil.toString(message) }
      });
    }
    max(maxLength, message) {
      return new ZodArray({
        ...this._def,
        maxLength: { value: maxLength, message: errorUtil.toString(message) }
      });
    }
    length(len, message) {
      return new ZodArray({
        ...this._def,
        exactLength: { value: len, message: errorUtil.toString(message) }
      });
    }
    nonempty(message) {
      return this.min(1, message);
    }
  }
  ZodArray.create = (schema, params) => {
    return new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params)
    });
  };
  function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
      const newShape = {};
      for (const key in schema.shape) {
        const fieldSchema = schema.shape[key];
        newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
      }
      return new ZodObject({
        ...schema._def,
        shape: () => newShape
      });
    } else if (schema instanceof ZodArray) {
      return new ZodArray({
        ...schema._def,
        type: deepPartialify(schema.element)
      });
    } else if (schema instanceof ZodOptional) {
      return ZodOptional.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodNullable) {
      return ZodNullable.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodTuple) {
      return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    } else {
      return schema;
    }
  }
  class ZodObject extends ZodType {
    constructor() {
      super(...arguments);
      this._cached = null;
      this.nonstrict = this.passthrough;
      this.augment = this.extend;
    }
    _getCached() {
      if (this._cached !== null)
        return this._cached;
      const shape = this._def.shape();
      const keys = util.objectKeys(shape);
      this._cached = { shape, keys };
      return this._cached;
    }
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.object) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const { status, ctx } = this._processInputParams(input);
      const { shape, keys: shapeKeys } = this._getCached();
      const extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
        for (const key in ctx.data) {
          if (!shapeKeys.includes(key)) {
            extraKeys.push(key);
          }
        }
      }
      const pairs = [];
      for (const key of shapeKeys) {
        const keyValidator = shape[key];
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (this._def.catchall instanceof ZodNever) {
        const unknownKeys = this._def.unknownKeys;
        if (unknownKeys === "passthrough") {
          for (const key of extraKeys) {
            pairs.push({
              key: { status: "valid", value: key },
              value: { status: "valid", value: ctx.data[key] }
            });
          }
        } else if (unknownKeys === "strict") {
          if (extraKeys.length > 0) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.unrecognized_keys,
              keys: extraKeys
            });
            status.dirty();
          }
        } else if (unknownKeys === "strip") ;
        else {
          throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
        }
      } else {
        const catchall = this._def.catchall;
        for (const key of extraKeys) {
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: catchall._parse(
              new ParseInputLazyPath(ctx, value, ctx.path, key)
              //, ctx.child(key), value, getParsedType(value)
            ),
            alwaysSet: key in ctx.data
          });
        }
      }
      if (ctx.common.async) {
        return Promise.resolve().then(async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet
            });
          }
          return syncPairs;
        }).then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs);
        });
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get shape() {
      return this._def.shape();
    }
    strict(message) {
      errorUtil.errToObj;
      return new ZodObject({
        ...this._def,
        unknownKeys: "strict",
        ...message !== void 0 ? {
          errorMap: (issue, ctx) => {
            const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
            if (issue.code === "unrecognized_keys")
              return {
                message: errorUtil.errToObj(message).message ?? defaultError
              };
            return {
              message: defaultError
            };
          }
        } : {}
      });
    }
    strip() {
      return new ZodObject({
        ...this._def,
        unknownKeys: "strip"
      });
    }
    passthrough() {
      return new ZodObject({
        ...this._def,
        unknownKeys: "passthrough"
      });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
      return new ZodObject({
        ...this._def,
        shape: () => ({
          ...this._def.shape(),
          ...augmentation
        })
      });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
      const merged = new ZodObject({
        unknownKeys: merging._def.unknownKeys,
        catchall: merging._def.catchall,
        shape: () => ({
          ...this._def.shape(),
          ...merging._def.shape()
        }),
        typeName: ZodFirstPartyTypeKind.ZodObject
      });
      return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
      return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
      return new ZodObject({
        ...this._def,
        catchall: index
      });
    }
    pick(mask) {
      const shape = {};
      for (const key of util.objectKeys(mask)) {
        if (mask[key] && this.shape[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    omit(mask) {
      const shape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (!mask[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    /**
     * @deprecated
     */
    deepPartial() {
      return deepPartialify(this);
    }
    partial(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        const fieldSchema = this.shape[key];
        if (mask && !mask[key]) {
          newShape[key] = fieldSchema;
        } else {
          newShape[key] = fieldSchema.optional();
        }
      }
      return new ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    required(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (mask && !mask[key]) {
          newShape[key] = this.shape[key];
        } else {
          const fieldSchema = this.shape[key];
          let newField = fieldSchema;
          while (newField instanceof ZodOptional) {
            newField = newField._def.innerType;
          }
          newShape[key] = newField;
        }
      }
      return new ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    keyof() {
      return createZodEnum(util.objectKeys(this.shape));
    }
  }
  ZodObject.create = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  class ZodUnion extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const options = this._def.options;
      function handleResults(results) {
        for (const result2 of results) {
          if (result2.result.status === "valid") {
            return result2.result;
          }
        }
        for (const result2 of results) {
          if (result2.result.status === "dirty") {
            ctx.common.issues.push(...result2.ctx.common.issues);
            return result2.result;
          }
        }
        const unionErrors = results.map((result2) => new ZodError(result2.ctx.common.issues));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return Promise.all(options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            }),
            ctx: childCtx
          };
        })).then(handleResults);
      } else {
        let dirty = void 0;
        const issues = [];
        for (const option of options) {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          const result2 = option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          });
          if (result2.status === "valid") {
            return result2;
          } else if (result2.status === "dirty" && !dirty) {
            dirty = { result: result2, ctx: childCtx };
          }
          if (childCtx.common.issues.length) {
            issues.push(childCtx.common.issues);
          }
        }
        if (dirty) {
          ctx.common.issues.push(...dirty.ctx.common.issues);
          return dirty.result;
        }
        const unionErrors = issues.map((issues2) => new ZodError(issues2));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
    }
    get options() {
      return this._def.options;
    }
  }
  ZodUnion.create = (types, params) => {
    return new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params)
    });
  };
  function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
      return { valid: true, data: a };
    } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
      const bKeys = util.objectKeys(b);
      const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
      const newObj = { ...a, ...b };
      for (const key of sharedKeys) {
        const sharedValue = mergeValues(a[key], b[key]);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newObj[key] = sharedValue.data;
      }
      return { valid: true, data: newObj };
    } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
      if (a.length !== b.length) {
        return { valid: false };
      }
      const newArray = [];
      for (let index = 0; index < a.length; index++) {
        const itemA = a[index];
        const itemB = b[index];
        const sharedValue = mergeValues(itemA, itemB);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newArray.push(sharedValue.data);
      }
      return { valid: true, data: newArray };
    } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
      return { valid: true, data: a };
    } else {
      return { valid: false };
    }
  }
  class ZodIntersection extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const handleParsed = (parsedLeft, parsedRight) => {
        if (isAborted(parsedLeft) || isAborted(parsedRight)) {
          return INVALID;
        }
        const merged = mergeValues(parsedLeft.value, parsedRight.value);
        if (!merged.valid) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_intersection_types
          });
          return INVALID;
        }
        if (isDirty(parsedLeft) || isDirty(parsedRight)) {
          status.dirty();
        }
        return { status: status.value, value: merged.data };
      };
      if (ctx.common.async) {
        return Promise.all([
          this._def.left._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }),
          this._def.right._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          })
        ]).then(([left, right]) => handleParsed(left, right));
      } else {
        return handleParsed(this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }));
      }
    }
  }
  ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params)
    });
  };
  class ZodTuple extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (ctx.data.length < this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        return INVALID;
      }
      const rest = this._def.rest;
      if (!rest && ctx.data.length > this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        status.dirty();
      }
      const items = [...ctx.data].map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        if (!schema)
          return null;
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
      }).filter((x) => !!x);
      if (ctx.common.async) {
        return Promise.all(items).then((results) => {
          return ParseStatus.mergeArray(status, results);
        });
      } else {
        return ParseStatus.mergeArray(status, items);
      }
    }
    get items() {
      return this._def.items;
    }
    rest(rest) {
      return new ZodTuple({
        ...this._def,
        rest
      });
    }
  }
  ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params)
    });
  };
  class ZodRecord extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const pairs = [];
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      for (const key in ctx.data) {
        pairs.push({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
          value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (ctx.common.async) {
        return ParseStatus.mergeObjectAsync(status, pairs);
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get element() {
      return this._def.valueType;
    }
    static create(first, second, third) {
      if (second instanceof ZodType) {
        return new ZodRecord({
          keyType: first,
          valueType: second,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(third)
        });
      }
      return new ZodRecord({
        keyType: ZodString.create(),
        valueType: first,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(second)
      });
    }
  }
  class ZodMap extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.map,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      const pairs = [...ctx.data.entries()].map(([key, value], index) => {
        return {
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
          value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
        };
      });
      if (ctx.common.async) {
        const finalMap = /* @__PURE__ */ new Map();
        return Promise.resolve().then(async () => {
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        });
      } else {
        const finalMap = /* @__PURE__ */ new Map();
        for (const pair of pairs) {
          const key = pair.key;
          const value = pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      }
    }
  }
  ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params)
    });
  };
  class ZodSet extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.set,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const def = this._def;
      if (def.minSize !== null) {
        if (ctx.data.size < def.minSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.minSize.message
          });
          status.dirty();
        }
      }
      if (def.maxSize !== null) {
        if (ctx.data.size > def.maxSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.maxSize.message
          });
          status.dirty();
        }
      }
      const valueType = this._def.valueType;
      function finalizeSet(elements2) {
        const parsedSet = /* @__PURE__ */ new Set();
        for (const element of elements2) {
          if (element.status === "aborted")
            return INVALID;
          if (element.status === "dirty")
            status.dirty();
          parsedSet.add(element.value);
        }
        return { status: status.value, value: parsedSet };
      }
      const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
      if (ctx.common.async) {
        return Promise.all(elements).then((elements2) => finalizeSet(elements2));
      } else {
        return finalizeSet(elements);
      }
    }
    min(minSize, message) {
      return new ZodSet({
        ...this._def,
        minSize: { value: minSize, message: errorUtil.toString(message) }
      });
    }
    max(maxSize, message) {
      return new ZodSet({
        ...this._def,
        maxSize: { value: maxSize, message: errorUtil.toString(message) }
      });
    }
    size(size, message) {
      return this.min(size, message).max(size, message);
    }
    nonempty(message) {
      return this.min(1, message);
    }
  }
  ZodSet.create = (valueType, params) => {
    return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params)
    });
  };
  class ZodLazy extends ZodType {
    get schema() {
      return this._def.getter();
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const lazySchema = this._def.getter();
      return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
  }
  ZodLazy.create = (getter, params) => {
    return new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params)
    });
  };
  class ZodLiteral extends ZodType {
    _parse(input) {
      if (input.data !== this._def.value) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_literal,
          expected: this._def.value
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
    get value() {
      return this._def.value;
    }
  }
  ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params)
    });
  };
  function createZodEnum(values, params) {
    return new ZodEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      ...processCreateParams(params)
    });
  }
  class ZodEnum extends ZodType {
    _parse(input) {
      if (typeof input.data !== "string") {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(this._def.values);
      }
      if (!this._cache.has(input.data)) {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Values() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    extract(values, newDef = this._def) {
      return ZodEnum.create(values, {
        ...this._def,
        ...newDef
      });
    }
    exclude(values, newDef = this._def) {
      return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
        ...this._def,
        ...newDef
      });
    }
  }
  ZodEnum.create = createZodEnum;
  class ZodNativeEnum extends ZodType {
    _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values);
      const ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(util.getValidEnumValues(this._def.values));
      }
      if (!this._cache.has(input.data)) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get enum() {
      return this._def.values;
    }
  }
  ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params)
    });
  };
  class ZodPromise extends ZodType {
    unwrap() {
      return this._def.type;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.promise,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap
        });
      }));
    }
  }
  ZodPromise.create = (schema, params) => {
    return new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params)
    });
  };
  class ZodEffects extends ZodType {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const effect = this._def.effect || null;
      const checkCtx = {
        addIssue: (arg) => {
          addIssueToContext(ctx, arg);
          if (arg.fatal) {
            status.abort();
          } else {
            status.dirty();
          }
        },
        get path() {
          return ctx.path;
        }
      };
      checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
      if (effect.type === "preprocess") {
        const processed = effect.transform(ctx.data, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(processed).then(async (processed2) => {
            if (status.value === "aborted")
              return INVALID;
            const result2 = await this._def.schema._parseAsync({
              data: processed2,
              path: ctx.path,
              parent: ctx
            });
            if (result2.status === "aborted")
              return INVALID;
            if (result2.status === "dirty")
              return DIRTY(result2.value);
            if (status.value === "dirty")
              return DIRTY(result2.value);
            return result2;
          });
        } else {
          if (status.value === "aborted")
            return INVALID;
          const result2 = this._def.schema._parseSync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          if (result2.status === "aborted")
            return INVALID;
          if (result2.status === "dirty")
            return DIRTY(result2.value);
          if (status.value === "dirty")
            return DIRTY(result2.value);
          return result2;
        }
      }
      if (effect.type === "refinement") {
        const executeRefinement = (acc) => {
          const result2 = effect.refinement(acc, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(result2);
          }
          if (result2 instanceof Promise) {
            throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
          }
          return acc;
        };
        if (ctx.common.async === false) {
          const inner = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          executeRefinement(inner.value);
          return { status: status.value, value: inner.value };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value };
            });
          });
        }
      }
      if (effect.type === "transform") {
        if (ctx.common.async === false) {
          const base = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (!isValid(base))
            return INVALID;
          const result2 = effect.transform(base.value, checkCtx);
          if (result2 instanceof Promise) {
            throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
          }
          return { status: status.value, value: result2 };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
            if (!isValid(base))
              return INVALID;
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result2) => ({
              status: status.value,
              value: result2
            }));
          });
        }
      }
      util.assertNever(effect);
    }
  }
  ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params)
    });
  };
  ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
      schema,
      effect: { type: "preprocess", transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params)
    });
  };
  class ZodOptional extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.undefined) {
        return OK(void 0);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  ZodOptional.create = (type, params) => {
    return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params)
    });
  };
  class ZodNullable extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.null) {
        return OK(null);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  ZodNullable.create = (type, params) => {
    return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params)
    });
  };
  class ZodDefault extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      let data = ctx.data;
      if (ctx.parsedType === ZodParsedType.undefined) {
        data = this._def.defaultValue();
      }
      return this._def.innerType._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    removeDefault() {
      return this._def.innerType;
    }
  }
  ZodDefault.create = (type, params) => {
    return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof params.default === "function" ? params.default : () => params.default,
      ...processCreateParams(params)
    });
  };
  class ZodCatch extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const newCtx = {
        ...ctx,
        common: {
          ...ctx.common,
          issues: []
        }
      };
      const result2 = this._def.innerType._parse({
        data: newCtx.data,
        path: newCtx.path,
        parent: {
          ...newCtx
        }
      });
      if (isAsync(result2)) {
        return result2.then((result3) => {
          return {
            status: "valid",
            value: result3.status === "valid" ? result3.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        });
      } else {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      }
    }
    removeCatch() {
      return this._def.innerType;
    }
  }
  ZodCatch.create = (type, params) => {
    return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
      ...processCreateParams(params)
    });
  };
  class ZodNaN extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.nan) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.nan,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
  }
  ZodNaN.create = (params) => {
    return new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params)
    });
  };
  class ZodBranded extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const data = ctx.data;
      return this._def.type._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    unwrap() {
      return this._def.type;
    }
  }
  class ZodPipeline extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.common.async) {
        const handleAsync = async () => {
          const inResult = await this._def.in._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return DIRTY(inResult.value);
          } else {
            return this._def.out._parseAsync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        };
        return handleAsync();
      } else {
        const inResult = this._def.in._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return {
            status: "dirty",
            value: inResult.value
          };
        } else {
          return this._def.out._parseSync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }
    }
    static create(a, b) {
      return new ZodPipeline({
        in: a,
        out: b,
        typeName: ZodFirstPartyTypeKind.ZodPipeline
      });
    }
  }
  class ZodReadonly extends ZodType {
    _parse(input) {
      const result2 = this._def.innerType._parse(input);
      const freeze = (data) => {
        if (isValid(data)) {
          data.value = Object.freeze(data.value);
        }
        return data;
      };
      return isAsync(result2) ? result2.then((data) => freeze(data)) : freeze(result2);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params)
    });
  };
  var ZodFirstPartyTypeKind;
  (function(ZodFirstPartyTypeKind2) {
    ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
  })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  const stringType = ZodString.create;
  const numberType = ZodNumber.create;
  const booleanType = ZodBoolean.create;
  const anyType = ZodAny.create;
  ZodNever.create;
  const arrayType = ZodArray.create;
  const objectType = ZodObject.create;
  ZodUnion.create;
  ZodIntersection.create;
  ZodTuple.create;
  const recordType = ZodRecord.create;
  const enumType = ZodEnum.create;
  ZodPromise.create;
  ZodOptional.create;
  ZodNullable.create;
  const SubscriptionTierSchema = enumType(["free", "pro", "elite"]);
  objectType({
    id: stringType().uuid(),
    email: stringType().email(),
    firstName: stringType().optional(),
    lastName: stringType().optional(),
    fullName: stringType().optional(),
    phone: stringType().optional(),
    address: stringType().optional(),
    education: arrayType(objectType({
      school: stringType(),
      degree: stringType().optional(),
      field: stringType().optional(),
      startDate: stringType().optional(),
      endDate: stringType().optional()
    })).default([]),
    certifications: arrayType(objectType({
      name: stringType(),
      issuer: stringType().optional(),
      date: stringType().optional(),
      credentialId: stringType().optional()
    })).default([]),
    experience: arrayType(objectType({
      company: stringType(),
      role: stringType(),
      startDate: stringType().optional(),
      endDate: stringType().optional(),
      bullets: arrayType(stringType()).default([]),
      keywords: arrayType(stringType()).default([])
    })).default([]),
    projects: arrayType(objectType({
      name: stringType(),
      description: stringType().optional(),
      technologies: arrayType(stringType()).default([]),
      url: stringType().url().optional()
    })).default([]),
    skills: arrayType(stringType()).default([]),
    subscriptionTier: SubscriptionTierSchema.default("free"),
    subscriptionExpiresAt: stringType().datetime().optional(),
    createdAt: stringType().datetime(),
    updatedAt: stringType().datetime()
  });
  const LinkedInProfileSchema = objectType({
    id: stringType(),
    // LinkedIn public identifier
    publicId: stringType().optional(),
    name: stringType(),
    headline: stringType().optional(),
    location: stringType().optional(),
    industry: stringType().optional(),
    avatarUrl: stringType().url().optional(),
    photoUrl: stringType().url().optional(),
    // Alias for avatarUrl
    profileUrl: stringType().url().optional(),
    // LinkedIn profile URL
    about: stringType().optional(),
    currentRole: objectType({
      title: stringType(),
      company: stringType()
    }).optional(),
    // Current employment position
    experience: arrayType(objectType({
      company: stringType(),
      title: stringType(),
      duration: stringType().optional(),
      location: stringType().optional()
    })).default([]),
    education: arrayType(objectType({
      school: stringType(),
      degree: stringType().optional(),
      field: stringType().optional(),
      startYear: numberType().optional(),
      // Year started (e.g., 2016)
      endYear: numberType().optional()
      // Year graduated (e.g., 2020, null if Present)
    })).default([]),
    certifications: arrayType(objectType({
      name: stringType(),
      issuer: stringType().optional(),
      dateObtained: stringType().optional()
      // ISO date string
    })).default([]),
    skills: arrayType(objectType({
      name: stringType(),
      endorsementCount: numberType().default(0),
      // Number of endorsements
      endorsedBy: arrayType(stringType()).default([])
      // Array of profile IDs who endorsed
    })).default([]),
    connections: numberType().optional(),
    mutualConnections: arrayType(stringType()).default([]),
    recentPosts: arrayType(objectType({
      content: stringType(),
      date: stringType(),
      engagement: numberType().optional()
    })).default([]),
    userPosts: arrayType(objectType({
      content: stringType(),
      timestamp: stringType().datetime(),
      likes: numberType().default(0),
      comments: numberType().default(0)
    })).default([]),
    engagedPosts: arrayType(objectType({
      authorId: stringType(),
      // LinkedIn profile ID of post author
      authorName: stringType(),
      // Display name of post author
      topic: stringType(),
      // Post topic/content preview
      timestamp: stringType().datetime(),
      engagementType: enumType(["comment", "reaction", "share"]).optional()
    })).default([]),
    recentActivity: arrayType(objectType({
      preview: stringType(),
      // Activity content preview
      timestamp: stringType().datetime().optional(),
      type: stringType().optional(),
      // Activity type (post, comment, share, etc.)
      url: stringType().url().optional()
      // URL to the activity
    })).default([]),
    scrapedAt: stringType().datetime()
  });
  const ConnectionStatusSchema = enumType(["connected", "pending", "not_contacted"]);
  const NetworkNodeSchema = objectType({
    id: stringType(),
    profile: LinkedInProfileSchema,
    status: ConnectionStatusSchema,
    degree: numberType().min(1).max(3),
    // 1st, 2nd, 3rd degree
    matchScore: numberType().min(0).max(100),
    // 0-100 percentage
    activityScore: numberType().optional(),
    lastContactedAt: stringType().datetime().optional()
  });
  const NetworkEdgeSchema = objectType({
    from: stringType(),
    // node ID
    to: stringType(),
    // node ID
    weight: numberType().min(0.1).max(1),
    // Lower is better for Dijkstra
    relationshipType: enumType(["mutual", "colleague", "school", "unknown"]).optional()
  });
  const ConnectionRouteSchema = objectType({
    targetId: stringType(),
    nodes: arrayType(NetworkNodeSchema),
    edges: arrayType(NetworkEdgeSchema),
    totalWeight: numberType(),
    successProbability: numberType().min(0).max(100),
    // Percentage
    computedAt: stringType().datetime()
  });
  const WatchlistPersonSchema = objectType({
    id: stringType().uuid(),
    profileId: stringType(),
    profile: LinkedInProfileSchema,
    bestRoute: ConnectionRouteSchema.optional(),
    matchScore: numberType().min(0).max(100),
    progress: objectType({
      connectedNodes: numberType(),
      totalNodes: numberType(),
      percentage: numberType().min(0).max(100)
    }),
    keywords: arrayType(stringType()).default([]),
    notes: stringType().optional(),
    addedAt: stringType().datetime(),
    lastCheckedAt: stringType().datetime().optional()
  });
  objectType({
    id: stringType().uuid(),
    companyId: stringType(),
    name: stringType(),
    description: stringType().optional(),
    logoUrl: stringType().url().optional(),
    website: stringType().url().optional(),
    industry: stringType().optional(),
    size: stringType().optional(),
    location: stringType().optional(),
    jobs: arrayType(objectType({
      id: stringType(),
      title: stringType(),
      location: stringType().optional(),
      postedDate: stringType().optional(),
      url: stringType().url()
    })).default([]),
    bestContact: WatchlistPersonSchema.optional(),
    addedAt: stringType().datetime(),
    lastCheckedAt: stringType().datetime().optional()
  });
  const JobPostingSchema = objectType({
    id: stringType(),
    title: stringType(),
    company: stringType(),
    location: stringType().optional(),
    description: stringType(),
    requirements: arrayType(stringType()).default([]),
    keywords: arrayType(stringType()).default([]),
    salaryRange: stringType().optional(),
    experienceLevel: enumType(["entry", "mid", "senior", "lead", "executive"]).optional(),
    jobType: enumType(["full-time", "part-time", "contract", "internship"]).optional(),
    postedDate: stringType(),
    url: stringType().url(),
    source: enumType(["linkedin", "manual"]),
    scrapedAt: stringType().datetime()
  });
  objectType({
    id: stringType().uuid(),
    job: JobPostingSchema,
    tailoredResume: stringType().optional(),
    // PDF base64 or URL
    coverLetter: stringType().optional(),
    matchScore: numberType().min(0).max(100).optional(),
    applicationStatus: enumType(["saved", "applied", "interview", "rejected", "accepted"]).default("saved"),
    appliedAt: stringType().datetime().optional(),
    notes: stringType().optional(),
    savedAt: stringType().datetime()
  });
  objectType({
    targetProfileId: stringType(),
    messageType: enumType(["connection_request", "follow_up", "introduction"]),
    content: stringType(),
    tone: enumType(["professional", "casual", "enthusiastic", "formal"]).default("professional"),
    citations: arrayType(objectType({
      fact: stringType(),
      source: stringType()
      // e.g., "profile.about", "recentPosts[0]"
    })).default([]),
    validatedAt: stringType().datetime(),
    generatedAt: stringType().datetime()
  });
  objectType({
    jobId: stringType(),
    sections: objectType({
      opening: stringType(),
      body: arrayType(stringType()),
      value: stringType(),
      closing: stringType()
    }),
    fullText: stringType(),
    tone: enumType(["professional", "casual", "enthusiastic", "formal"]).default("professional"),
    generatedAt: stringType().datetime()
  });
  const NotificationTypeSchema = enumType([
    "job_alert",
    "connection_accepted",
    "message_follow_up",
    "activity_update",
    "system"
  ]);
  objectType({
    id: stringType().uuid(),
    type: NotificationTypeSchema,
    title: stringType(),
    message: stringType(),
    actionUrl: stringType().url().optional(),
    read: booleanType().default(false),
    createdAt: stringType().datetime()
  });
  const NotificationPreferencesSchema = objectType({
    email: objectType({
      enabled: booleanType().default(false),
      types: arrayType(NotificationTypeSchema).default([]),
      frequency: enumType(["instant", "daily", "weekly"]).default("daily")
    }),
    sms: objectType({
      enabled: booleanType().default(false),
      types: arrayType(NotificationTypeSchema).default([])
    }),
    push: objectType({
      enabled: booleanType().default(true),
      types: arrayType(NotificationTypeSchema).default(["job_alert", "connection_accepted"])
    })
  });
  const ThemeSchema = objectType({
    mode: enumType(["light", "dark", "system"]).default("system"),
    accentColor: stringType().regex(/^#[0-9A-Fa-f]{6}$/).default("#0A66C2"),
    // LinkedIn blue
    blurIntensity: numberType().min(0).max(20).default(10),
    curvePreset: enumType(["subtle", "moderate", "pronounced"]).default("moderate")
  });
  const PrivacySettingsSchema = objectType({
    cloudSyncEnabled: booleanType().default(false),
    autoSendEnabled: booleanType().default(false),
    // Elite only
    analyticsEnabled: booleanType().default(false),
    clearDataOnLogout: booleanType().default(false)
  });
  objectType({
    theme: ThemeSchema,
    notifications: NotificationPreferencesSchema,
    privacy: PrivacySettingsSchema,
    panelPosition: objectType({
      x: numberType().default(100),
      y: numberType().default(100)
    }),
    panelSize: objectType({
      width: numberType().default(420),
      height: numberType().default(680)
    })
  });
  objectType({
    type: enumType(["message", "resume", "cover_letter", "rewrite"]),
    context: recordType(anyType()),
    // Flexible context object
    tone: enumType(["professional", "casual", "enthusiastic", "formal"]).optional(),
    maxTokens: numberType().optional()
  });
  const STORAGE_KEYS = {
    // Session storage (in-memory, sensitive)
    AUTH_TOKEN: "auth_token",
    REFRESH_TOKEN: "refresh_token",
    // Local storage (persistent)
    USER_PROFILE: "user_profile",
    APP_SETTINGS: "app_settings",
    WATCHLIST_PEOPLE: "watchlist_people",
    WATCHLIST_COMPANIES: "watchlist_companies",
    SAVED_JOBS: "saved_jobs",
    NOTIFICATIONS: "notifications",
    // Session storage (temporary)
    CURRENT_ROUTE: "current_route",
    TEMP_MESSAGE: "temp_message"
  };
  background;
  class StorageManager {
    /**
     * Get data from session storage (in-memory, cleared on restart)
     * Use for sensitive data like tokens
     */
    static async getSession(key) {
      try {
        const result2 = await chrome.storage.session.get(key);
        return result2[key] ?? null;
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return null;
        }
        const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
        if (errorMsg.includes("cannot access") || errorMsg.includes("not available") || errorMsg.includes("disconnected") || errorMsg.includes("receiving end does not exist")) {
          return null;
        }
        console.error("Session storage get error:", error);
        return null;
      }
    }
    /**
     * Set data in session storage
     */
    static async setSession(key, value) {
      try {
        await chrome.storage.session.set({ [key]: value });
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return;
        }
        const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
        if (errorMsg.includes("cannot access") || errorMsg.includes("not available") || errorMsg.includes("disconnected") || errorMsg.includes("receiving end does not exist")) {
          return;
        }
        console.error("Session storage set error:", error);
        throw error;
      }
    }
    /**
     * Get data from local storage (persistent)
     */
    static async getLocal(key) {
      try {
        const result2 = await chrome.storage.local.get(key);
        return result2[key] ?? null;
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return null;
        }
        const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
        if (errorMsg.includes("cannot access") || errorMsg.includes("not available") || errorMsg.includes("disconnected") || errorMsg.includes("receiving end does not exist")) {
          return null;
        }
        console.error("Local storage get error:", error);
        return null;
      }
    }
    /**
     * Set data in local storage
     */
    static async setLocal(key, value) {
      try {
        await chrome.storage.local.set({ [key]: value });
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return;
        }
        const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
        if (errorMsg.includes("cannot access") || errorMsg.includes("not available") || errorMsg.includes("disconnected") || errorMsg.includes("receiving end does not exist")) {
          return;
        }
        console.error("Local storage set error:", error);
        throw error;
      }
    }
    /**
     * Remove from session storage
     */
    static async removeSession(key) {
      try {
        await chrome.storage.session.remove(key);
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return;
        }
        console.error("Session storage remove error:", error);
      }
    }
    /**
     * Remove from local storage
     */
    static async removeLocal(key) {
      try {
        await chrome.storage.local.remove(key);
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return;
        }
        console.error("Local storage remove error:", error);
      }
    }
    /**
     * Clear all session storage
     */
    static async clearSession() {
      try {
        await chrome.storage.session.clear();
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return;
        }
        console.error("Session storage clear error:", error);
      }
    }
    /**
     * Clear all local storage
     */
    static async clearLocal() {
      try {
        await chrome.storage.local.clear();
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return;
        }
        console.error("Local storage clear error:", error);
      }
    }
    /**
     * Get auth tokens (from session storage)
     */
    static async getAuthToken() {
      return this.getSession(STORAGE_KEYS.AUTH_TOKEN);
    }
    /**
     * Set auth tokens (in session storage)
     */
    static async setAuthToken(token) {
      await this.setSession(STORAGE_KEYS.AUTH_TOKEN, token);
    }
    /**
     * Clear all auth data
     */
    static async clearAuth() {
      await this.removeSession(STORAGE_KEYS.AUTH_TOKEN);
      await this.removeSession(STORAGE_KEYS.REFRESH_TOKEN);
    }
    /**
     * Listen to storage changes
     */
    static onChanged(callback) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" || areaName === "session") {
          callback(changes);
        }
      });
    }
  }
  background;
  const DEFAULT_FEED_PREFERENCES = {
    enabledCompanies: [],
    globalFilters: {}
  };
  const DEFAULT_SETTINGS = {
    theme: {
      mode: "system",
      accentColor: "#0A66C2",
      blurIntensity: 10,
      curvePreset: "moderate"
    },
    notifications: {
      email: { enabled: false, types: [], frequency: "daily" },
      sms: { enabled: false, types: [] },
      push: { enabled: true, types: ["job_alert", "connection_accepted"] }
    },
    privacy: {
      cloudSyncEnabled: false,
      autoSendEnabled: false,
      analyticsEnabled: false,
      clearDataOnLogout: false
    },
    panelPosition: { x: 100, y: 100 },
    panelSize: { width: 420, height: 680 }
  };
  create((set, get) => ({
    ...DEFAULT_SETTINGS,
    feedPreferences: DEFAULT_FEED_PREFERENCES,
    loadSettings: async () => {
      const settings = await StorageManager.getLocal("app_settings");
      const feedPreferences = await StorageManager.getLocal("feed_preferences");
      if (settings) {
        set({ ...settings, feedPreferences: feedPreferences || DEFAULT_FEED_PREFERENCES });
      }
    },
    updateTheme: async (themeUpdates) => {
      const currentTheme = get().theme;
      const updatedTheme = { ...currentTheme, ...themeUpdates };
      const newSettings = {
        ...get(),
        theme: updatedTheme
      };
      await StorageManager.setLocal("app_settings", newSettings);
      set({ theme: updatedTheme });
    },
    updateNotifications: async (notificationUpdates) => {
      const currentNotifications = get().notifications;
      const updatedNotifications = {
        ...currentNotifications,
        ...notificationUpdates
      };
      const newSettings = {
        ...get(),
        notifications: updatedNotifications
      };
      await StorageManager.setLocal("app_settings", newSettings);
      set({ notifications: updatedNotifications });
    },
    updatePrivacy: async (privacyUpdates) => {
      const currentPrivacy = get().privacy;
      const updatedPrivacy = { ...currentPrivacy, ...privacyUpdates };
      const newSettings = {
        ...get(),
        privacy: updatedPrivacy
      };
      await StorageManager.setLocal("app_settings", newSettings);
      set({ privacy: updatedPrivacy });
    },
    updatePanelPosition: async (position) => {
      const newSettings = {
        ...get(),
        panelPosition: position
      };
      await StorageManager.setLocal("app_settings", newSettings);
      set({ panelPosition: position });
    },
    updatePanelSize: async (size) => {
      const newSettings = {
        ...get(),
        panelSize: size
      };
      await StorageManager.setLocal("app_settings", newSettings);
      set({ panelSize: size });
    },
    updateFeedPreferences: async (updates) => {
      const currentFeedPreferences = get().feedPreferences;
      const updatedFeedPreferences = {
        ...currentFeedPreferences,
        ...updates,
        globalFilters: {
          ...currentFeedPreferences.globalFilters,
          ...updates.globalFilters || {}
        }
      };
      await StorageManager.setLocal("feed_preferences", updatedFeedPreferences);
      set({ feedPreferences: updatedFeedPreferences });
    },
    resetSettings: async () => {
      await StorageManager.setLocal("app_settings", DEFAULT_SETTINGS);
      await StorageManager.setLocal("feed_preferences", DEFAULT_FEED_PREFERENCES);
      set({ ...DEFAULT_SETTINGS, feedPreferences: DEFAULT_FEED_PREFERENCES });
    }
  }));
  background;
  async function getCompanyWatchlist() {
    return log.trackAsync(LogCategory.STORAGE, "getCompanyWatchlist", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Fetching company watchlist from storage");
        const result2 = await chrome.storage.local.get(WATCHLIST_COMPANIES_STORAGE_KEY);
        const companies = result2[WATCHLIST_COMPANIES_STORAGE_KEY] || [];
        log.info(LogCategory.STORAGE, "Company watchlist retrieved", { count: companies.length });
        console.log("[Uproot] Retrieved company watchlist:", companies.length, "companies");
        return companies;
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return [];
        }
        log.error(LogCategory.STORAGE, "Error getting company watchlist", { error });
        console.error("[Uproot] Error getting company watchlist:", error);
        return [];
      }
    });
  }
  async function isCompanyInWatchlist(companyUrl) {
    return log.trackAsync(LogCategory.STORAGE, "isCompanyInWatchlist", async () => {
      log.debug(LogCategory.STORAGE, "Checking if company is in watchlist", { companyUrl });
      const companies = await getCompanyWatchlist();
      const isInList = companies.some((c) => c.id === companyUrl);
      log.info(LogCategory.STORAGE, "Company watchlist check complete", { companyUrl, isInList });
      return isInList;
    });
  }
  background;
  const FEED_STORAGE_KEY = "uproot_feed";
  background;
  async function getFeedItems() {
    return log.trackAsync(LogCategory.STORAGE, "getFeedItems", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Fetching feed items from storage");
        const result2 = await chrome.storage.local.get(FEED_STORAGE_KEY);
        const items = result2[FEED_STORAGE_KEY] || [];
        const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
        log.info(LogCategory.STORAGE, "Feed items retrieved", { count: sortedItems.length });
        console.log("[Uproot] Retrieved feed items:", sortedItems.length, "items");
        return sortedItems;
      } catch (error) {
        log.error(LogCategory.STORAGE, "Error getting feed items", { error });
        console.error("[Uproot] Error getting feed items:", error);
        return [];
      }
    });
  }
  async function saveFeedItems(items) {
    return log.trackAsync(LogCategory.STORAGE, "saveFeedItems", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Saving feed items to storage", { count: items.length });
        const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
        await chrome.storage.local.set({ [FEED_STORAGE_KEY]: sortedItems });
        log.change(LogCategory.STORAGE, "feedItems", "update", { count: items.length });
        console.log("[Uproot] Feed items saved:", items.length, "items");
      } catch (error) {
        log.error(LogCategory.STORAGE, "Error saving feed items", { error, count: items.length });
        console.error("[Uproot] Error saving feed items:", error);
        throw error;
      }
    });
  }
  async function addFeedItem(item) {
    return log.trackAsync(LogCategory.STORAGE, "addFeedItem", async () => {
      log.debug(LogCategory.STORAGE, "Adding feed item", { type: item.type, title: item.title });
      const items = await getFeedItems();
      const id = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newItem = {
        ...item,
        id
      };
      items.unshift(newItem);
      await saveFeedItems(items);
      log.change(LogCategory.STORAGE, "feedItems", "create", { id, type: newItem.type, title: newItem.title });
      console.log("[Uproot] Added feed item:", newItem.type, newItem.title);
      return newItem;
    });
  }
  async function cleanupOldFeedItems(maxAgeDays = 30) {
    return log.trackAsync(LogCategory.STORAGE, "cleanupOldFeedItems", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Starting feed cleanup", { maxAgeDays });
        const items = await getFeedItems();
        const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1e3;
        const freshItems = items.filter((item) => item.timestamp > cutoffTime);
        const removedCount = items.length - freshItems.length;
        if (removedCount > 0) {
          await saveFeedItems(freshItems);
          log.change(LogCategory.STORAGE, "feedItems", "cleanup", { removedCount, maxAgeDays });
          console.log(`[Uproot] Cleaned up ${removedCount} old items (older than ${maxAgeDays} days)`);
        } else {
          log.debug(LogCategory.STORAGE, "No old items to clean up");
        }
        return removedCount;
      } catch (error) {
        log.error(LogCategory.STORAGE, "Error cleaning up old items", { error, maxAgeDays });
        console.error("[Uproot] Error cleaning up old items:", error);
        return 0;
      }
    });
  }
  async function getStorageStats() {
    return log.trackAsync(LogCategory.STORAGE, "getStorageStats", async () => {
      try {
        const items = await getFeedItems();
        const now = Date.now();
        const oldestItem = items.reduce(
          (oldest, item) => item.timestamp < oldest ? item.timestamp : oldest,
          now
        );
        const estimatedSizeKB = Math.round(items.length * 500 / 1024);
        const oldestItemAge = items.length > 0 ? Math.round((now - oldestItem) / (24 * 60 * 60 * 1e3)) : 0;
        return {
          feedItemCount: items.length,
          estimatedSizeKB,
          oldestItemAge
        };
      } catch (error) {
        log.error(LogCategory.STORAGE, "Error getting storage stats", { error });
        console.error("[Uproot] Error getting storage stats:", error);
        return {
          feedItemCount: 0,
          estimatedSizeKB: 0,
          oldestItemAge: 0
        };
      }
    });
  }
  background;
  const WARM_PATH_DEDUPE_KEY = "uproot_warm_path_dedupe";
  const DEDUPE_WINDOW_MS = 30 * 24 * 60 * 60 * 1e3;
  async function getWarmPathDedupe() {
    return log.trackAsync(LogCategory.STORAGE, "getWarmPathDedupe", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Fetching warm path dedupe entries from storage");
        const result2 = await chrome.storage.local.get(WARM_PATH_DEDUPE_KEY);
        const entries = result2[WARM_PATH_DEDUPE_KEY] || [];
        log.info(LogCategory.STORAGE, "Warm path dedupe entries retrieved", { count: entries.length });
        return entries;
      } catch (error) {
        log.error(LogCategory.STORAGE, "Error getting warm path dedupe entries", { error });
        console.error("[Uproot] Error getting warm path dedupe entries:", error);
        return [];
      }
    });
  }
  async function saveWarmPathDedupe(entries) {
    return log.trackAsync(LogCategory.STORAGE, "saveWarmPathDedupe", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Saving warm path dedupe entries to storage", { count: entries.length });
        await chrome.storage.local.set({ [WARM_PATH_DEDUPE_KEY]: entries });
        log.change(LogCategory.STORAGE, "warmPathDedupe", "update", { count: entries.length });
      } catch (error) {
        log.error(LogCategory.STORAGE, "Error saving warm path dedupe entries", { error, count: entries.length });
        console.error("[Uproot] Error saving warm path dedupe entries:", error);
        throw error;
      }
    });
  }
  async function addWarmPathDedupe(entry) {
    return log.trackAsync(LogCategory.STORAGE, "addWarmPathDedupe", async () => {
      log.debug(LogCategory.STORAGE, "Adding warm path dedupe entry", entry);
      const entries = await getWarmPathDedupe();
      const key = `${entry.targetCompanyUrl}_${entry.viaPersonProfileUrl}_${entry.pathLength}`;
      const existingIndex = entries.findIndex((e) => e.key === key);
      if (existingIndex !== -1) {
        log.debug(LogCategory.STORAGE, "Warm path dedupe entry already exists", { key });
        return;
      }
      const newEntry = {
        ...entry,
        key,
        createdAt: Date.now()
      };
      entries.push(newEntry);
      await saveWarmPathDedupe(entries);
      log.change(LogCategory.STORAGE, "warmPathDedupe", "create", { key });
      console.log("[Uproot] Added warm path dedupe entry:", key);
    });
  }
  async function pruneWarmPathDedupe() {
    return log.trackAsync(LogCategory.STORAGE, "pruneWarmPathDedupe", async () => {
      log.debug(LogCategory.STORAGE, "Pruning old warm path dedupe entries");
      const entries = await getWarmPathDedupe();
      const now = Date.now();
      const cutoff = now - DEDUPE_WINDOW_MS;
      const validEntries = entries.filter((entry) => entry.createdAt > cutoff);
      const prunedCount = entries.length - validEntries.length;
      if (prunedCount > 0) {
        await saveWarmPathDedupe(validEntries);
        log.change(LogCategory.STORAGE, "warmPathDedupe", "prune", { prunedCount, remaining: validEntries.length });
        console.log(`[Uproot] Pruned ${prunedCount} old warm path dedupe entries`);
      } else {
        log.debug(LogCategory.STORAGE, "No old warm path dedupe entries to prune");
      }
    });
  }
  async function isDuplicateWarmPath(targetCompanyUrl, viaPersonProfileUrl, pathLength) {
    return log.trackAsync(LogCategory.STORAGE, "isDuplicateWarmPath", async () => {
      log.debug(LogCategory.STORAGE, "Checking for duplicate warm path", {
        targetCompanyUrl,
        viaPersonProfileUrl,
        pathLength
      });
      await pruneWarmPathDedupe();
      const entries = await getWarmPathDedupe();
      const key = `${targetCompanyUrl}_${viaPersonProfileUrl}_${pathLength}`;
      const isDuplicate = entries.some((entry) => entry.key === key);
      log.debug(LogCategory.STORAGE, "Duplicate check result", { key, isDuplicate });
      return isDuplicate;
    });
  }
  background;
  async function detectWarmPathForConnection(newConnectionProfileUrl, newConnectionProfile) {
    return log.trackAsync(
      LogCategory.MONITORING,
      "detectWarmPathForConnection",
      async () => {
        log.debug(LogCategory.MONITORING, "Checking for warm path", {
          profileUrl: newConnectionProfileUrl,
          name: newConnectionProfile.name
        });
        try {
          const directPath = await detectDirectWarmPath(
            newConnectionProfileUrl,
            newConnectionProfile
          );
          if (directPath) {
            log.info(
              LogCategory.MONITORING,
              "Direct warm path detected",
              directPath
            );
            return directPath;
          }
          log.debug(
            LogCategory.MONITORING,
            "No warm path detected",
            { profileUrl: newConnectionProfileUrl }
          );
          return null;
        } catch (error) {
          log.error(LogCategory.MONITORING, "Error detecting warm path", {
            error,
            profileUrl: newConnectionProfileUrl
          });
          return null;
        }
      }
    );
  }
  async function detectDirectWarmPath(profileUrl, profile) {
    const currentCompany = profile.currentRole?.company;
    const currentCompanyUrl = "";
    if (!currentCompany) {
      log.debug(LogCategory.MONITORING, "No company info in profile", {
        profileUrl
      });
      return null;
    }
    const isWatchlisted = await isCompanyInWatchlist(currentCompany);
    if (!isWatchlisted) {
      log.debug(LogCategory.MONITORING, "Company not watchlisted", {
        company: currentCompany,
        companyUrl: currentCompanyUrl
      });
      return null;
    }
    const watchlist = await getCompanyWatchlist();
    const watchlistedCompany = watchlist.find(
      (c) => c.companyUrl === currentCompanyUrl
    );
    const descriptor = {
      targetCompany: currentCompany || "",
      targetCompanyUrl: currentCompanyUrl || "",
      targetCompanyLogo: watchlistedCompany?.companyLogo || void 0,
      viaPersonName: profile.name,
      viaPersonProfileUrl: profileUrl,
      viaPersonImage: profile.photoUrl,
      viaPersonTitle: profile.currentRole?.title,
      pathLength: 1
    };
    log.info(LogCategory.MONITORING, "Direct warm path found", descriptor);
    return descriptor;
  }
  async function shouldCreateWarmPathItem(targetCompanyUrl, viaPersonProfileUrl, pathLength) {
    return log.trackAsync(
      LogCategory.MONITORING,
      "shouldCreateWarmPathItem",
      async () => {
        log.debug(LogCategory.MONITORING, "Checking if warm path item should be created", {
          targetCompanyUrl,
          viaPersonProfileUrl,
          pathLength
        });
        const isDupe = await isDuplicateWarmPath(
          targetCompanyUrl,
          viaPersonProfileUrl,
          pathLength
        );
        if (isDupe) {
          log.debug(
            LogCategory.MONITORING,
            "Warm path is duplicate, skipping creation",
            {
              targetCompanyUrl,
              viaPersonProfileUrl,
              pathLength
            }
          );
          return false;
        }
        log.debug(
          LogCategory.MONITORING,
          "Warm path is not duplicate, should create",
          {
            targetCompanyUrl,
            viaPersonProfileUrl,
            pathLength
          }
        );
        return true;
      }
    );
  }
  async function generateWarmPathFeedItem(descriptor) {
    return log.trackAsync(
      LogCategory.MONITORING,
      "generateWarmPathFeedItem",
      async () => {
        log.debug(
          LogCategory.MONITORING,
          "Generating warm path feed item",
          descriptor
        );
        try {
          const feedItem = {
            type: "warm_path_opened",
            timestamp: Date.now(),
            read: false,
            title: generateTitle(descriptor),
            description: generateDescription(descriptor),
            actionUrl: descriptor.viaPersonProfileUrl,
            actionLabel: getActionLabel(descriptor.pathLength),
            warmPath: {
              targetCompany: descriptor.targetCompany,
              targetCompanyUrl: descriptor.targetCompanyUrl,
              targetCompanyLogo: descriptor.targetCompanyLogo,
              viaPersonName: descriptor.viaPersonName,
              viaPersonProfileUrl: descriptor.viaPersonProfileUrl,
              viaPersonImage: descriptor.viaPersonImage,
              viaPersonTitle: descriptor.viaPersonTitle,
              pathLength: descriptor.pathLength,
              bridgeToName: descriptor.bridgeToName,
              bridgeToProfileUrl: descriptor.bridgeToProfileUrl,
              bridgeToTitle: descriptor.bridgeToTitle
            }
          };
          await addFeedItem(feedItem);
          await addWarmPathDedupe({
            targetCompanyUrl: descriptor.targetCompanyUrl,
            viaPersonProfileUrl: descriptor.viaPersonProfileUrl,
            pathLength: descriptor.pathLength
          });
          log.change(
            LogCategory.MONITORING,
            "warmPathOpened",
            "create",
            descriptor
          );
          console.log(
            "[Uproot] Warm path opened:",
            descriptor.viaPersonName,
            "→",
            descriptor.targetCompany
          );
        } catch (error) {
          log.error(LogCategory.MONITORING, "Error generating warm path feed item", {
            error,
            descriptor
          });
          throw error;
        }
      }
    );
  }
  function generateTitle(descriptor) {
    if (descriptor.pathLength === 1) {
      return `Warm path opened to ${descriptor.targetCompany}`;
    } else {
      return `New bridge into ${descriptor.targetCompany}`;
    }
  }
  function generateDescription(descriptor) {
    if (descriptor.pathLength === 1) {
      return `Your new connection ${descriptor.viaPersonName} works at ${descriptor.targetCompany} (a watchlisted company). Now's a great time to reach out!`;
    } else {
      const bridgeName = descriptor.bridgeToName || "someone";
      return `Your new connection ${descriptor.viaPersonName} knows ${bridgeName} at ${descriptor.targetCompany}. Ask ${descriptor.viaPersonName} for an intro!`;
    }
  }
  function getActionLabel(pathLength) {
    if (pathLength === 1) {
      return "View Profile";
    } else {
      return "Ask for Intro";
    }
  }
  background;
  const LOGGED_ACCEPTANCES_KEY = "uproot_logged_acceptances";
  async function detectConnectionAcceptances(currentConnections, connectionPaths) {
    const acceptances = [];
    const result2 = await chrome.storage.local.get(LOGGED_ACCEPTANCES_KEY);
    const loggedAcceptances = new Set(
      result2[LOGGED_ACCEPTANCES_KEY] || []
    );
    for (const path of connectionPaths) {
      for (let i = 0; i < path.path.length; i++) {
        const step = path.path[i];
        const acceptanceId = `${path.id}_${step.profileUrl}`;
        const isConnected = currentConnections.includes(step.profileUrl);
        const alreadyLogged = loggedAcceptances.has(acceptanceId);
        if (isConnected && !step.connected && !alreadyLogged) {
          acceptances.push({
            pathId: path.id,
            stepIndex: i,
            personName: step.name
          });
        }
      }
    }
    return acceptances;
  }
  async function logConnectionAcceptance(pathId, stepIndex, personName, personProfileUrl) {
    const feedItem = {
      type: "connection_update",
      timestamp: Date.now(),
      read: false,
      connectionName: personName,
      connectionUpdate: `${personName} accepted your connection request`,
      title: "Connection Accepted",
      description: `${personName} is now in your network`,
      actionUrl: personProfileUrl,
      actionLabel: "View Profile"
    };
    const feedResult = await chrome.storage.local.get("uproot_feed");
    const feedItems = feedResult["uproot_feed"] || [];
    const newItem = { ...feedItem, id: `feed_${Date.now()}` };
    feedItems.unshift(newItem);
    await chrome.storage.local.set({ uproot_feed: feedItems });
    const pathsResult = await chrome.storage.local.get("uproot_connection_paths");
    const paths = pathsResult["uproot_connection_paths"] || [];
    const pathIndex = paths.findIndex((p) => p.id === pathId);
    if (pathIndex !== -1) {
      const path = paths[pathIndex];
      if (stepIndex >= 0 && stepIndex < path.path.length) {
        path.path[stepIndex].connected = true;
        path.completedSteps = path.path.filter((step) => step.connected).length;
        path.isComplete = path.completedSteps === path.totalSteps;
        path.lastUpdated = Date.now();
        await chrome.storage.local.set({ uproot_connection_paths: paths });
      }
    }
    const loggedResult = await chrome.storage.local.get(LOGGED_ACCEPTANCES_KEY);
    const loggedAcceptances = loggedResult[LOGGED_ACCEPTANCES_KEY] || [];
    const acceptanceId = `${pathId}_${personProfileUrl}`;
    loggedAcceptances.push(acceptanceId);
    await chrome.storage.local.set({ [LOGGED_ACCEPTANCES_KEY]: loggedAcceptances });
    try {
      await checkForWarmPath(personProfileUrl, personName);
    } catch (error) {
      console.error("[Uproot] Failed to check warm path:", error);
    }
  }
  async function checkForWarmPath(profileUrl, personName) {
    console.log(`[Uproot] Checking for warm path: ${personName}`);
    let profile = null;
    try {
      profile = scrapePersonProfile();
    } catch (error) {
      console.log("[Uproot] Could not scrape profile for warm path check:", error);
      return;
    }
    if (!profile) {
      console.log("[Uproot] No profile data available for warm path check");
      return;
    }
    const linkedInProfile = {
      id: profile.profileUrl,
      name: profile.name,
      headline: profile.headline,
      location: profile.location,
      photoUrl: profile.photoUrl,
      profileUrl: profile.profileUrl,
      currentRole: profile.currentRole,
      experience: profile.currentRole ? [{
        company: profile.currentRole.company,
        title: profile.currentRole.title,
        duration: profile.currentRole.startDate,
        location: profile.location
      }] : [],
      education: [],
      certifications: [],
      skills: [],
      mutualConnections: [],
      recentPosts: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: (profile.recentActivity || []).map((activity) => ({
        preview: activity.preview,
        type: activity.type,
        url: activity.url,
        timestamp: new Date(activity.timestamp).toISOString()
      })),
      scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const descriptor = await detectWarmPathForConnection(profileUrl, linkedInProfile);
    if (!descriptor) {
      console.log("[Uproot] No warm path detected");
      return;
    }
    const shouldCreate = await shouldCreateWarmPathItem(
      descriptor.targetCompanyUrl,
      descriptor.viaPersonProfileUrl,
      descriptor.pathLength
    );
    if (!shouldCreate) {
      console.log("[Uproot] Warm path is duplicate, skipping");
      return;
    }
    await generateWarmPathFeedItem(descriptor);
    console.log(`[Uproot] Warm path opened: ${personName} → ${descriptor.targetCompany}`);
  }
  background;
  async function getConnectionPaths() {
    return log.trackAsync(LogCategory.STORAGE, "getConnectionPaths", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Fetching connection paths from storage");
        const result2 = await chrome.storage.local.get(CONNECTION_PATHS_STORAGE_KEY);
        const paths = result2[CONNECTION_PATHS_STORAGE_KEY] || [];
        log.info(LogCategory.STORAGE, "Connection paths retrieved", { count: paths.length });
        console.log("[Uproot] Retrieved connection paths:", paths.length, "paths");
        return paths;
      } catch (error) {
        log.error(LogCategory.STORAGE, "Error getting connection paths", { error });
        console.error("[Uproot] Error getting connection paths:", error);
        return [];
      }
    });
  }
  background;
  async function getWatchlist() {
    return log.trackAsync(LogCategory.STORAGE, "getWatchlist", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Fetching watchlist from storage");
        const result2 = await chrome.storage.local.get("uproot_watchlist");
        const watchlist = result2.uproot_watchlist || [];
        log.info(LogCategory.STORAGE, "Watchlist retrieved", { count: watchlist.length });
        console.log("[Uproot] Retrieved watchlist:", watchlist.length, "people");
        return watchlist;
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return [];
        }
        log.error(LogCategory.STORAGE, "Error getting watchlist", { error });
        console.error("[Uproot] Error getting watchlist:", error);
        return [];
      }
    });
  }
  background;
  const ONBOARDING_STORAGE_KEY = "uproot_onboarding";
  background;
  async function getOnboardingState() {
    return log.trackAsync(LogCategory.STORAGE, "getOnboardingState", async () => {
      try {
        log.debug(LogCategory.STORAGE, "Fetching onboarding state from storage");
        const result2 = await chrome.storage.local.get(ONBOARDING_STORAGE_KEY);
        const state = result2[ONBOARDING_STORAGE_KEY] || {
          isComplete: false,
          currentStep: 0
        };
        log.info(LogCategory.STORAGE, "Onboarding state retrieved", { isComplete: state.isComplete, currentStep: state.currentStep });
        console.log("[Uproot] Retrieved onboarding state:", state);
        return state;
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          return {
            isComplete: false,
            currentStep: 0
          };
        }
        log.error(LogCategory.STORAGE, "Error getting onboarding state", { error });
        console.error("[Uproot] Error getting onboarding state:", error);
        return {
          isComplete: false,
          currentStep: 0
        };
      }
    });
  }
  background;
  const JOB_SNAPSHOTS_KEY = "uproot_job_snapshots";
  const PERSON_SNAPSHOTS_KEY = "uproot_person_snapshots";
  const COMPANY_SNAPSHOTS_KEY = "uproot_company_snapshots";
  background;
  function calculateJobMatch(job, criteria) {
    const endTrace = log.trace(LogCategory.SERVICE, "calculateJobMatch", {
      jobTitle: job.title,
      criteriaJobTitles: criteria.jobTitles.length
    });
    try {
      log.debug(LogCategory.SERVICE, "Starting job match calculation", {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        criteriaSet: {
          titles: criteria.jobTitles.length,
          experienceLevels: criteria.experienceLevel.length,
          workLocations: criteria.workLocation.length,
          locations: criteria.locations.length
        }
      });
      const matches = {
        title: false,
        experienceLevel: false,
        workLocation: false,
        location: false
      };
      const reasons = [];
      let score = 0;
      log.debug(LogCategory.SERVICE, "Checking title match");
      if (criteria.jobTitles.length > 0) {
        const titleLower = job.title.toLowerCase();
        const matchedTitle = criteria.jobTitles.find(
          (prefTitle) => titleLower.includes(prefTitle.toLowerCase()) || prefTitle.toLowerCase().includes(titleLower)
        );
        if (matchedTitle) {
          matches.title = true;
          score += 40;
          reasons.push(`Matches "${matchedTitle}"`);
          log.info(LogCategory.SERVICE, `Title matched: "${matchedTitle}"`, { points: 40 });
        } else {
          log.debug(LogCategory.SERVICE, "No title match found");
        }
      } else {
        score += 20;
        log.debug(LogCategory.SERVICE, "No title criteria set, partial credit", { points: 20 });
      }
      log.debug(LogCategory.SERVICE, "Checking experience level match");
      if (criteria.experienceLevel.length > 0 && job.experienceLevel) {
        if (criteria.experienceLevel.includes(job.experienceLevel)) {
          matches.experienceLevel = true;
          score += 25;
          reasons.push(`${job.experienceLevel} level`);
          log.info(LogCategory.SERVICE, `Experience level matched: ${job.experienceLevel}`, { points: 25 });
        } else {
          log.debug(LogCategory.SERVICE, "Experience level did not match", {
            jobLevel: job.experienceLevel,
            criteriaLevels: criteria.experienceLevel
          });
        }
      } else {
        score += 15;
        log.debug(LogCategory.SERVICE, "No experience level criteria, partial credit", { points: 15 });
      }
      log.debug(LogCategory.SERVICE, "Checking work location match");
      if (criteria.workLocation.length > 0 && job.workLocation) {
        if (criteria.workLocation.includes(job.workLocation)) {
          matches.workLocation = true;
          score += 20;
          reasons.push(`${job.workLocation} work`);
          log.info(LogCategory.SERVICE, `Work location matched: ${job.workLocation}`, { points: 20 });
        } else {
          log.debug(LogCategory.SERVICE, "Work location did not match", {
            jobLocation: job.workLocation,
            criteriaLocations: criteria.workLocation
          });
        }
      } else {
        score += 10;
        log.debug(LogCategory.SERVICE, "No work location criteria, partial credit", { points: 10 });
      }
      log.debug(LogCategory.SERVICE, "Checking geographic location match");
      if (criteria.locations.length > 0) {
        const locationLower = job.location.toLowerCase();
        const matchedLocation = criteria.locations.find(
          (prefLoc) => locationLower.includes(prefLoc.toLowerCase()) || prefLoc.toLowerCase().includes(locationLower)
        );
        if (matchedLocation) {
          matches.location = true;
          score += 15;
          reasons.push(`Located in ${matchedLocation}`);
          log.info(LogCategory.SERVICE, `Location matched: ${matchedLocation}`, { points: 15 });
        } else {
          log.debug(LogCategory.SERVICE, "No location match found", { jobLocation: job.location });
        }
      } else {
        score += 10;
        log.debug(LogCategory.SERVICE, "No location criteria, partial credit", { points: 10 });
      }
      if (job.isEasyApply) {
        score = Math.min(100, score + 5);
        reasons.push("Easy Apply available");
        log.debug(LogCategory.SERVICE, "Easy Apply bonus applied", { points: 5 });
      }
      const hoursSincePosted = (Date.now() - job.postedTimestamp) / (1e3 * 60 * 60);
      if (hoursSincePosted < 24) {
        score = Math.min(100, score + 3);
        reasons.push("Posted recently");
        log.debug(LogCategory.SERVICE, "Recent posting bonus applied", {
          points: 3,
          hoursAgo: hoursSincePosted.toFixed(1)
        });
      }
      const result2 = {
        score: Math.round(score),
        matches,
        reasons
      };
      log.info(LogCategory.SERVICE, "Job match calculation completed", {
        jobTitle: job.title,
        finalScore: result2.score,
        matchedCriteria: Object.entries(matches).filter(([_, v]) => v).map(([k]) => k),
        reasonsCount: reasons.length
      });
      endTrace(result2);
      return result2;
    } catch (error) {
      log.error(LogCategory.SERVICE, "Job match calculation failed", error, {
        jobId: job.id,
        jobTitle: job.title
      });
      endTrace();
      throw error;
    }
  }
  function filterMatchingJobs(jobs, criteria, minScore = 50) {
    const endTrace = log.trace(LogCategory.SERVICE, "filterMatchingJobs", {
      totalJobs: jobs.length,
      minScore
    });
    try {
      log.debug(LogCategory.SERVICE, "Filtering jobs by match score", {
        jobsToEvaluate: jobs.length,
        minScoreThreshold: minScore
      });
      const evaluated = jobs.map((job) => ({
        job,
        match: calculateJobMatch(job, criteria)
      }));
      log.info(LogCategory.SERVICE, "All jobs evaluated", {
        totalEvaluated: evaluated.length,
        scoreDistribution: {
          excellent: evaluated.filter((e) => e.match.score >= 80).length,
          good: evaluated.filter((e) => e.match.score >= 65 && e.match.score < 80).length,
          fair: evaluated.filter((e) => e.match.score >= 50 && e.match.score < 65).length,
          poor: evaluated.filter((e) => e.match.score < 50).length
        }
      });
      const filtered = evaluated.filter(({ match }) => match.score >= minScore);
      log.info(LogCategory.SERVICE, `Filtered to ${filtered.length} jobs meeting threshold`);
      const sorted = filtered.sort((a, b) => b.match.score - a.match.score);
      log.info(LogCategory.SERVICE, "Job filtering completed", {
        totalInput: jobs.length,
        passedFilter: sorted.length,
        filteredOut: jobs.length - sorted.length,
        topScores: sorted.slice(0, 5).map((m) => ({ title: m.job.title, score: m.match.score }))
      });
      endTrace(sorted);
      return sorted;
    } catch (error) {
      log.error(LogCategory.SERVICE, "Job filtering failed", error, {
        jobCount: jobs.length,
        minScore
      });
      endTrace();
      throw error;
    }
  }
  background;
  const APPLICATIONS_KEY = "uproot_applications";
  background;
  background;
  background;
  background;
  background;
  background;
  background;
  async function getApplications() {
    return log.trackAsync(LogCategory.STORAGE, "getApplications", async () => {
      log.debug(LogCategory.STORAGE, "Fetching all applications from storage");
      try {
        const result2 = await chrome.storage.local.get(APPLICATIONS_KEY);
        const apps = result2[APPLICATIONS_KEY] || [];
        const sorted = apps.sort((a, b) => b.appliedDate - a.appliedDate);
        log.info(LogCategory.STORAGE, "Applications retrieved", { count: sorted.length });
        return sorted;
      } catch (error) {
        log.error(LogCategory.STORAGE, "Failed to get applications", error);
        console.error("[Uproot] Error getting applications:", error);
        return [];
      }
    });
  }
  background;
  background;
  background;
  background;
  const HIRING_KEYWORDS = [
    "hiring",
    "we're hiring",
    "we are hiring",
    "looking for",
    "seeking",
    "intern",
    "internship",
    "open role",
    "open position",
    "join our team",
    "join us",
    "we're looking",
    "we are looking",
    "recruiting",
    "applications"
  ];
  async function isCompanyWatchlisted(companyName) {
    try {
      const result2 = await chrome.storage.local.get("uproot_watchlist_companies");
      const companies = result2.uproot_watchlist_companies || [];
      const normalizedName = companyName.toLowerCase().trim();
      return companies.some((c) => c.name.toLowerCase().trim() === normalizedName);
    } catch (error) {
      log.error(LogCategory.SERVICE, "Error checking if company is watchlisted", { error, companyName });
      return false;
    }
  }
  function containsHiringKeywords(text) {
    const lowerText = text.toLowerCase();
    return HIRING_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  }
  async function detectPersonInsights(current, previous, person) {
    log.debug(LogCategory.SERVICE, "Detecting person insights", {
      personName: person.name,
      currentCompany: current.currentRole?.company,
      previousCompany: previous?.currentRole?.company
    });
    if (!current.currentRole) {
      return await detectHiringActivity(current, person);
    }
    if (!previous || !previous.currentRole) {
      return await detectHiringActivity(current, person);
    }
    if (current.currentRole.company !== previous.currentRole.company) {
      log.info(LogCategory.SERVICE, "Job change detected", {
        personName: person.name,
        from: previous.currentRole.company,
        to: current.currentRole.company
      });
      const isTargetCompany = await isCompanyWatchlisted(current.currentRole.company);
      const isSeniorRole = /senior|lead|manager|director|head|vp|chief/i.test(current.currentRole.title);
      if (isTargetCompany || isSeniorRole) {
        const feedItem = {
          id: `person_insight_${person.id}_${Date.now()}`,
          type: "person_update",
          timestamp: Date.now(),
          read: false,
          // Person details
          personName: current.name,
          personTitle: current.currentRole.title,
          personUrl: current.profileUrl,
          personImage: current.photoUrl,
          // Insight details
          insightType: "job_change",
          newCompany: current.currentRole.company,
          newRole: current.currentRole.title,
          isTargetCompany,
          // Metadata
          title: isTargetCompany ? `${current.name} joined ${current.currentRole.company}` : `${current.name} changed jobs`,
          description: `${current.name} is now ${current.currentRole.title} at ${current.currentRole.company}${isTargetCompany ? " (Watchlisted Company!)" : ""}`,
          updateText: `Started new position at ${current.currentRole.company}`,
          actionUrl: current.profileUrl,
          actionLabel: "View Profile"
        };
        log.info(LogCategory.SERVICE, "Created job change feed item", {
          personName: current.name,
          isTargetCompany,
          isSeniorRole
        });
        return feedItem;
      }
      log.debug(LogCategory.SERVICE, "Job change not opportunity-relevant, skipping feed item", {
        isTargetCompany,
        isSeniorRole,
        role: current.currentRole.title
      });
      return null;
    }
    if (current.currentRole.title !== previous.currentRole.title) {
      const isTargetCompany = await isCompanyWatchlisted(current.currentRole.company);
      const isSeniorRole = /senior|lead|manager|director|head|vp|chief/i.test(current.currentRole.title);
      if (isTargetCompany && isSeniorRole) {
        const feedItem = {
          id: `person_insight_${person.id}_${Date.now()}`,
          type: "person_update",
          timestamp: Date.now(),
          read: false,
          // Person details
          personName: current.name,
          personTitle: current.currentRole.title,
          personUrl: current.profileUrl,
          personImage: current.photoUrl,
          // Insight details
          insightType: "job_change",
          // Treat promotion as job_change for V1
          newCompany: current.currentRole.company,
          newRole: current.currentRole.title,
          isTargetCompany: true,
          // Metadata
          title: `${current.name} promoted at ${current.currentRole.company}`,
          description: `${current.name} is now ${current.currentRole.title} at ${current.currentRole.company} (Watchlisted Company!)`,
          updateText: `Promoted to ${current.currentRole.title}`,
          actionUrl: current.profileUrl,
          actionLabel: "View Profile"
        };
        log.info(LogCategory.SERVICE, "Created promotion feed item", {
          personName: current.name,
          newTitle: current.currentRole.title
        });
        return feedItem;
      }
      log.debug(LogCategory.SERVICE, "Promotion not opportunity-relevant, skipping feed item", {
        isTargetCompany,
        isSeniorRole
      });
      return null;
    }
    return await detectHiringActivity(current, person);
  }
  async function detectHiringActivity(profile, person) {
    if (!profile.recentActivity || profile.recentActivity.length === 0) {
      return null;
    }
    for (const activity of profile.recentActivity) {
      if (containsHiringKeywords(activity.preview)) {
        log.info(LogCategory.SERVICE, "Hiring-related activity detected", {
          personName: person.name,
          activityPreview: activity.preview.substring(0, 100)
        });
        const feedItem = {
          id: `person_insight_${person.id}_${Date.now()}`,
          type: "person_update",
          timestamp: Date.now(),
          read: false,
          // Person details
          personName: profile.name,
          personTitle: profile.currentRole?.title,
          personUrl: profile.profileUrl,
          personImage: profile.photoUrl,
          // Insight details
          insightType: "new_activity",
          updateText: activity.preview,
          // Metadata
          title: `${profile.name} posted about hiring`,
          description: activity.preview.substring(0, 200) + (activity.preview.length > 200 ? "..." : ""),
          actionUrl: activity.url || profile.profileUrl,
          actionLabel: "View Post"
        };
        log.info(LogCategory.SERVICE, "Created hiring activity feed item", {
          personName: profile.name
        });
        return feedItem;
      }
    }
    return null;
  }
  background;
  const DETECTION_WINDOW_DAYS = 7;
  const MIN_NEW_JOBS_THRESHOLD = 3;
  const HEAT_THRESHOLDS = {
    // 3-5 new jobs
    HOT: 6,
    // 6-9 new jobs
    VERY_HOT: 10
    // 10+ new jobs
  };
  const JUNIOR_KEYWORDS = [
    "intern",
    "internship",
    "co-op",
    "coop",
    "entry",
    "junior",
    "associate",
    "new grad",
    "graduate",
    "entry level",
    "entry-level"
  ];
  function detectHiringHeat(currentJobs, previousSnapshot, company) {
    log.debug(LogCategory.SERVICE, "Detecting hiring heat for company", {
      company: company.name,
      currentJobCount: currentJobs.length
    });
    const now = Date.now();
    const windowStart = now - DETECTION_WINDOW_DAYS * 24 * 60 * 60 * 1e3;
    const recentJobs = currentJobs.filter((job) => job.postedTimestamp >= windowStart);
    log.debug(LogCategory.SERVICE, "Recent jobs within window", {
      recentJobCount: recentJobs.length,
      windowDays: DETECTION_WINDOW_DAYS
    });
    if (recentJobs.length < MIN_NEW_JOBS_THRESHOLD) {
      log.debug(LogCategory.SERVICE, "Not enough recent jobs", {
        recentJobCount: recentJobs.length,
        threshold: MIN_NEW_JOBS_THRESHOLD
      });
      return null;
    }
    const previousJobIds = new Set(previousSnapshot?.jobs.map((j) => j.id) || []);
    const newJobs = recentJobs.filter((job) => !previousJobIds.has(job.id));
    log.debug(LogCategory.SERVICE, "New jobs detected", {
      newJobCount: newJobs.length,
      previousSnapshotSize: previousJobIds.size
    });
    if (newJobs.length < MIN_NEW_JOBS_THRESHOLD) {
      log.debug(LogCategory.SERVICE, "Not enough NEW jobs", {
        newJobCount: newJobs.length,
        threshold: MIN_NEW_JOBS_THRESHOLD
      });
      return null;
    }
    const heatLevel = newJobs.length >= HEAT_THRESHOLDS.VERY_HOT ? "very_hot" : newJobs.length >= HEAT_THRESHOLDS.HOT ? "hot" : "warming";
    const internshipJobs = newJobs.filter(
      (job) => JUNIOR_KEYWORDS.some((keyword) => job.title.toLowerCase().includes(keyword))
    );
    log.info(LogCategory.SERVICE, "Hiring heat detected", {
      company: company.name,
      newJobCount: newJobs.length,
      internshipCount: internshipJobs.length,
      heatLevel
    });
    const topJobs = [
      ...internshipJobs.slice(0, 3),
      ...newJobs.filter((j) => !internshipJobs.includes(j)).slice(0, 3 - internshipJobs.length)
    ];
    return {
      company,
      jobCount: newJobs.length,
      internshipCount: internshipJobs.length,
      heatLevel,
      topJobTitles: topJobs.map((j) => j.title),
      detectionWindow: DETECTION_WINDOW_DAYS,
      actionUrl: `${company.companyUrl}/jobs/`
    };
  }
  async function shouldCreateHiringHeatItem(company, detectionWindow) {
    log.debug(LogCategory.SERVICE, "Checking for existing hiring_heat items", {
      company: company.name,
      detectionWindow
    });
    try {
      const feedItems = await getFeedItems();
      const windowStart = Date.now() - detectionWindow * 24 * 60 * 60 * 1e3;
      const existingHeat = feedItems.find(
        (item) => item.type === "hiring_heat" && item.company === company.name && item.timestamp >= windowStart
      );
      if (existingHeat) {
        log.debug(LogCategory.SERVICE, "Found existing hiring_heat item, skipping", {
          company: company.name,
          existingItemId: existingHeat.id,
          existingItemAge: Date.now() - existingHeat.timestamp
        });
        return false;
      }
      log.debug(LogCategory.SERVICE, "No existing hiring_heat item found, OK to create", {
        company: company.name
      });
      return true;
    } catch (error) {
      log.error(LogCategory.SERVICE, "Error checking existing hiring_heat items", { error });
      return true;
    }
  }
  async function generateHiringHeatFeedItem(indicator) {
    const { company, jobCount, internshipCount, heatLevel, topJobTitles, detectionWindow, actionUrl } = indicator;
    log.debug(LogCategory.SERVICE, "Generating hiring_heat feed item", {
      company: company.name,
      jobCount,
      heatLevel
    });
    const shouldCreate = await shouldCreateHiringHeatItem(company, detectionWindow);
    if (!shouldCreate) {
      log.info(LogCategory.SERVICE, "Skipping duplicate hiring_heat item", {
        company: company.name
      });
      console.log(`[Uproot] Skipping duplicate hiring_heat for ${company.name}`);
      return;
    }
    const heatEmoji = {
      warming: "🔥",
      hot: "🔥🔥",
      very_hot: "🔥🔥🔥"
    }[heatLevel];
    const title = `${company.name} is ramping up hiring ${heatEmoji}`;
    const description = `${jobCount} new position${jobCount > 1 ? "s" : ""} posted in the last ${detectionWindow} days${internshipCount && internshipCount > 0 ? ` (${internshipCount} intern/junior)` : ""}.

Top roles: ${topJobTitles.slice(0, 3).join(", ")}`;
    const feedItem = {
      type: "hiring_heat",
      timestamp: Date.now(),
      read: false,
      company: company.name,
      companyLogo: company.companyLogo || void 0,
      jobCount,
      detectionWindow,
      heatLevel,
      topJobTitles: topJobTitles.slice(0, 3),
      internshipCount,
      title,
      description,
      actionUrl,
      actionLabel: "View Open Roles"
    };
    try {
      await addFeedItem(feedItem);
      log.change(LogCategory.SERVICE, "feedItems", "create", {
        type: "hiring_heat",
        company: company.name,
        jobCount,
        heatLevel
      });
      console.log(
        `[Uproot] Created hiring_heat feed item for ${company.name} (${jobCount} jobs, ${heatLevel})`
      );
    } catch (error) {
      log.error(LogCategory.SERVICE, "Error creating hiring_heat feed item", {
        company: company.name,
        error
      });
      console.error(`[Uproot] Error creating hiring_heat feed item:`, error);
      throw error;
    }
  }
  background;
  function convertPersonProfileToLinkedInProfile(profile) {
    return {
      id: profile.profileUrl,
      profileUrl: profile.profileUrl,
      name: profile.name,
      headline: profile.headline,
      location: profile.location,
      photoUrl: profile.photoUrl,
      avatarUrl: profile.photoUrl,
      currentRole: profile.currentRole,
      experience: profile.currentRole ? [{
        company: profile.currentRole.company,
        title: profile.currentRole.title,
        location: profile.location
      }] : [],
      education: [],
      certifications: [],
      skills: [],
      connections: 0,
      mutualConnections: [],
      recentPosts: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: (profile.recentActivity || []).map((activity) => ({
        preview: activity.preview,
        timestamp: new Date(activity.timestamp).toISOString(),
        type: activity.type,
        url: activity.url
      })),
      scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async function getJobSnapshots() {
    try {
      const result2 = await chrome.storage.local.get(JOB_SNAPSHOTS_KEY);
      const snapshots = result2[JOB_SNAPSHOTS_KEY] || [];
      return new Map(snapshots.map((s) => [s.companyId, s]));
    } catch (error) {
      console.error("[Uproot] Error getting job snapshots:", error);
      return /* @__PURE__ */ new Map();
    }
  }
  async function saveJobSnapshots(snapshots) {
    try {
      const snapshotsArray = Array.from(snapshots.values());
      await chrome.storage.local.set({ [JOB_SNAPSHOTS_KEY]: snapshotsArray });
      console.log(`[Uproot] Saved ${snapshotsArray.length} job snapshots`);
    } catch (error) {
      console.error("[Uproot] Error saving job snapshots:", error);
    }
  }
  async function getPersonSnapshots() {
    try {
      const result2 = await chrome.storage.local.get(PERSON_SNAPSHOTS_KEY);
      const snapshots = result2[PERSON_SNAPSHOTS_KEY] || [];
      return new Map(snapshots.map((s) => [s.personId, s]));
    } catch (error) {
      console.error("[Uproot] Error getting person snapshots:", error);
      return /* @__PURE__ */ new Map();
    }
  }
  async function savePersonSnapshots(snapshots) {
    try {
      const snapshotsArray = Array.from(snapshots.values());
      await chrome.storage.local.set({ [PERSON_SNAPSHOTS_KEY]: snapshotsArray });
      console.log(`[Uproot] Saved ${snapshotsArray.length} person snapshots`);
    } catch (error) {
      console.error("[Uproot] Error saving person snapshots:", error);
    }
  }
  async function getCompanySnapshots() {
    try {
      const result2 = await chrome.storage.local.get(COMPANY_SNAPSHOTS_KEY);
      const snapshots = result2[COMPANY_SNAPSHOTS_KEY] || [];
      return new Map(snapshots.map((s) => [s.companyId, s]));
    } catch (error) {
      console.error("[Uproot] Error getting company snapshots:", error);
      return /* @__PURE__ */ new Map();
    }
  }
  async function saveCompanySnapshots(snapshots) {
    try {
      const snapshotsArray = Array.from(snapshots.values());
      await chrome.storage.local.set({ [COMPANY_SNAPSHOTS_KEY]: snapshotsArray });
      console.log(`[Uproot] Saved ${snapshotsArray.length} company snapshots`);
    } catch (error) {
      console.error("[Uproot] Error saving company snapshots:", error);
    }
  }
  async function checkCompanyJobs(company, preferences) {
    return log.trackAsync(LogCategory.SERVICE, "checkCompanyJobs", async () => {
      console.log(`[Uproot] Checking jobs for ${company.name}...`);
      log.debug(LogCategory.SERVICE, "Starting job check for company", {
        companyId: company.id,
        companyName: company.name,
        jobAlertEnabled: company.jobAlertEnabled
      });
      try {
        log.debug(LogCategory.SERVICE, "Scraping company jobs from page");
        const currentJobs = scrapeCompanyJobs(company.companyUrl);
        if (currentJobs.length === 0) {
          console.log(`[Uproot] No jobs found for ${company.name}`);
          log.warn(LogCategory.SERVICE, "No jobs found for company", { companyName: company.name });
          return [];
        }
        log.info(LogCategory.SERVICE, `Scraped ${currentJobs.length} current jobs`);
        log.debug(LogCategory.SERVICE, "Retrieving previous job snapshot");
        const snapshots = await getJobSnapshots();
        const previousSnapshot = snapshots.get(company.id);
        log.debug(LogCategory.SERVICE, "Detecting new jobs");
        const newJobs = detectNewJobs(currentJobs, previousSnapshot);
        console.log(`[Uproot] Found ${newJobs.length} new jobs for ${company.name}`);
        log.info(LogCategory.SERVICE, `Detected ${newJobs.length} new jobs`, {
          companyName: company.name,
          totalJobs: currentJobs.length,
          newJobs: newJobs.length
        });
        log.debug(LogCategory.SERVICE, "Updating job snapshot");
        snapshots.set(company.id, {
          companyId: company.id,
          lastChecked: Date.now(),
          jobs: currentJobs
        });
        await saveJobSnapshots(snapshots);
        log.debug(LogCategory.SERVICE, "Filtering jobs by user preferences");
        const matchCriteria = {
          jobTitles: preferences.jobTitles,
          experienceLevel: preferences.experienceLevel,
          workLocation: preferences.workLocation,
          locations: preferences.locations,
          industries: preferences.industries
        };
        const matchingJobs = filterMatchingJobs(newJobs, matchCriteria, 50);
        console.log(`[Uproot] ${matchingJobs.length} jobs match user preferences`);
        log.info(LogCategory.SERVICE, "Jobs filtered by preferences", {
          newJobs: newJobs.length,
          matchingJobs: matchingJobs.length,
          minScore: 50
        });
        log.debug(LogCategory.SERVICE, "Generating feed items for matching jobs");
        for (const { job, match } of matchingJobs) {
          await generateJobAlertFeedItem(job, company, match.score, match.reasons);
        }
        log.info(LogCategory.SERVICE, `Created ${matchingJobs.length} job alert feed items`);
        try {
          log.debug(LogCategory.SERVICE, "Detecting hiring heat for company");
          const hiringHeat = detectHiringHeat(currentJobs, previousSnapshot, company);
          if (hiringHeat) {
            log.info(LogCategory.SERVICE, "Hiring heat detected, generating feed item");
            await generateHiringHeatFeedItem(hiringHeat);
          }
        } catch (error) {
          log.error(LogCategory.SERVICE, "Error detecting hiring heat", error, {
            companyName: company.name
          });
          console.error("[Uproot] Error detecting hiring heat:", error);
        }
        return matchingJobs.map((m) => m.job);
      } catch (error) {
        console.error(`[Uproot] Error checking jobs for ${company.name}:`, error);
        log.error(LogCategory.SERVICE, "Job check failed", error, {
          companyId: company.id,
          companyName: company.name
        });
        return [];
      }
    });
  }
  function detectNewJobs(currentJobs, previousSnapshot) {
    if (!previousSnapshot) {
      return currentJobs;
    }
    const previousJobIds = new Set(previousSnapshot.jobs.map((j) => j.id));
    return currentJobs.filter((job) => !previousJobIds.has(job.id));
  }
  async function generateJobAlertFeedItem(job, company, matchScore, _reasons) {
    try {
      const feedItem = {
        type: "job_alert",
        timestamp: Date.now(),
        read: false,
        title: "New Job Match",
        description: job.title,
        company: company.name,
        companyLogo: company.companyLogo ?? void 0,
        location: job.location,
        jobUrl: job.jobUrl,
        matchScore,
        actionUrl: job.jobUrl,
        actionLabel: job.isEasyApply ? "Easy Apply" : "View Job",
        jobTitle: job.title
      };
      await addFeedItem(feedItem);
      console.log(`[Uproot] Created feed item for job: ${job.title} at ${company.name} (${matchScore}% match)`);
    } catch (error) {
      console.error("[Uproot] Error generating job alert feed item:", error);
    }
  }
  async function checkPersonProfile(person) {
    return log.trackAsync(LogCategory.SERVICE, "checkPersonProfile", async () => {
      console.log(`[Uproot] Checking profile for ${person.name}...`);
      log.debug(LogCategory.SERVICE, "Starting profile check", {
        personId: person.id,
        personName: person.name
      });
      try {
        log.debug(LogCategory.SERVICE, "Scraping person profile from page");
        const currentProfile = scrapePersonProfile();
        if (!currentProfile) {
          console.log(`[Uproot] Could not scrape profile for ${person.name}`);
          log.warn(LogCategory.SERVICE, "Failed to scrape profile", { personName: person.name });
          return;
        }
        log.info(LogCategory.SERVICE, "Profile scraped successfully", {
          personName: currentProfile.name,
          currentRole: currentProfile.currentRole.title,
          currentCompany: currentProfile.currentRole.company
        });
        log.debug(LogCategory.SERVICE, "Retrieving previous profile snapshot");
        const snapshots = await getPersonSnapshots();
        const previousSnapshot = snapshots.get(person.id);
        const currentLinkedInProfile = convertPersonProfileToLinkedInProfile(currentProfile);
        const previousLinkedInProfile = previousSnapshot?.profile ? convertPersonProfileToLinkedInProfile(previousSnapshot.profile) : void 0;
        log.debug(LogCategory.SERVICE, "Detecting person insights");
        const insight = await detectPersonInsights(
          currentLinkedInProfile,
          previousLinkedInProfile,
          person
        );
        if (insight) {
          log.info(LogCategory.SERVICE, "Person insight detected, adding to feed", {
            personName: person.name,
            insightType: insight.insightType
          });
          await addFeedItem(insight);
        } else {
          log.debug(LogCategory.SERVICE, "No opportunity-relevant insights detected");
        }
        log.debug(LogCategory.SERVICE, "Updating profile snapshot");
        snapshots.set(person.id, {
          personId: person.id,
          lastChecked: Date.now(),
          profile: currentProfile
        });
        await savePersonSnapshots(snapshots);
        console.log(`[Uproot] Updated profile snapshot for ${person.name}`);
        log.info(LogCategory.SERVICE, "Profile check completed", { personName: person.name });
      } catch (error) {
        console.error(`[Uproot] Error checking profile for ${person.name}:`, error);
        log.error(LogCategory.SERVICE, "Profile check failed", error, {
          personId: person.id,
          personName: person.name
        });
      }
    });
  }
  async function checkCompanyUpdates(company) {
    return log.trackAsync(LogCategory.SERVICE, "checkCompanyUpdates", async () => {
      console.log(`[Uproot] Checking updates for ${company.name}...`);
      log.debug(LogCategory.SERVICE, "Starting company updates check", {
        companyId: company.id,
        companyName: company.name
      });
      try {
        log.debug(LogCategory.SERVICE, "Scraping company updates from page");
        const currentUpdates = scrapeCompanyUpdates(company.companyUrl);
        if (currentUpdates.length === 0) {
          console.log(`[Uproot] No updates found for ${company.name}`);
          log.warn(LogCategory.SERVICE, "No updates found for company", { companyName: company.name });
          return;
        }
        log.info(LogCategory.SERVICE, `Scraped ${currentUpdates.length} current updates`);
        log.debug(LogCategory.SERVICE, "Retrieving previous updates snapshot");
        const snapshots = await getCompanySnapshots();
        const previousSnapshot = snapshots.get(company.id);
        log.debug(LogCategory.SERVICE, "Detecting new updates");
        const newUpdates = detectNewUpdates(currentUpdates, previousSnapshot);
        console.log(`[Uproot] Found ${newUpdates.length} new updates for ${company.name}`);
        log.info(LogCategory.SERVICE, `Detected ${newUpdates.length} new updates`, {
          companyName: company.name,
          totalUpdates: currentUpdates.length
        });
        log.debug(LogCategory.SERVICE, "Generating feed items for new updates");
        for (const update of newUpdates) {
          await generateCompanyUpdateFeedItem(update, company);
        }
        log.info(LogCategory.SERVICE, `Created ${newUpdates.length} company update feed items`);
        log.debug(LogCategory.SERVICE, "Updating company updates snapshot");
        snapshots.set(company.id, {
          companyId: company.id,
          lastChecked: Date.now(),
          updates: currentUpdates
        });
        await saveCompanySnapshots(snapshots);
        log.info(LogCategory.SERVICE, "Company updates check completed", { companyName: company.name });
      } catch (error) {
        console.error(`[Uproot] Error checking updates for ${company.name}:`, error);
        log.error(LogCategory.SERVICE, "Company updates check failed", error, {
          companyId: company.id,
          companyName: company.name
        });
      }
    });
  }
  function detectNewUpdates(currentUpdates, previousSnapshot) {
    if (!previousSnapshot) {
      return currentUpdates.slice(0, 1);
    }
    const previousUpdateIds = new Set(previousSnapshot.updates.map((u) => u.id));
    return currentUpdates.filter((update) => !previousUpdateIds.has(update.id));
  }
  async function generateCompanyUpdateFeedItem(update, company) {
    try {
      await addFeedItem({
        type: "company_update",
        timestamp: update.timestamp,
        read: false,
        title: "Company Update",
        description: update.preview,
        company: company.name,
        companyLogo: company.companyLogo ?? void 0,
        actionUrl: update.url,
        actionLabel: "See Post"
      });
      console.log(`[Uproot] Created feed item for ${company.name} update`);
    } catch (error) {
      console.error("[Uproot] Error generating company update feed item:", error);
    }
  }
  background;
  function waitForElement(selector, timeout = 5e3) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
  function inferIndustryFromHeadline(headline) {
    if (!headline) return void 0;
    const text = headline.toLowerCase();
    const industryKeywords = {
      "Software Development": ["software engineer", "software developer", "programmer", "full stack", "backend", "frontend", "mobile developer", "web developer"],
      "Information Technology": ["it manager", "system administrator", "devops", "sre", "cloud engineer", "infrastructure"],
      "Data Science": ["data scientist", "machine learning", "ai engineer", "data engineer", "analytics"],
      "Product Management": ["product manager", "product owner", "technical product"],
      "Design": ["designer", "ux", "ui", "product design", "graphic design"],
      "Finance": ["finance", "investment banker", "financial analyst", "trading", "portfolio manager"],
      "Consulting": ["consultant", "advisory", "strategy consultant"],
      "Healthcare": ["doctor", "physician", "nurse", "medical", "healthcare"],
      "Education": ["teacher", "professor", "educator", "instructor"],
      "Marketing": ["marketing", "brand manager", "growth", "digital marketing"],
      "Sales": ["sales", "account executive", "business development"],
      "Human Resources": ["hr", "recruiter", "talent acquisition", "people operations"],
      "Legal": ["lawyer", "attorney", "legal counsel", "paralegal"],
      "Research": ["researcher", "research scientist", "phd", "postdoc"],
      "Engineering": ["mechanical engineer", "civil engineer", "electrical engineer", "hardware engineer"],
      "Management": ["ceo", "cto", "cfo", "director", "vp", "head of", "manager"]
    };
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return industry;
        }
      }
    }
    return void 0;
  }
  function parseDateString(dateString) {
    if (!dateString) return {};
    const text = dateString.trim();
    const rangeMatch = text.match(/(\d{4})\s*[-–]\s*(\d{4}|Present)/i);
    if (rangeMatch) {
      return {
        startYear: parseInt(rangeMatch[1]),
        endYear: rangeMatch[2].toLowerCase() === "present" ? (/* @__PURE__ */ new Date()).getFullYear() : parseInt(rangeMatch[2])
      };
    }
    const singleYearMatch = text.match(/(\d{4})/);
    if (singleYearMatch) {
      const year = parseInt(singleYearMatch[1]);
      return {
        startYear: year,
        endYear: year
      };
    }
    return {};
  }
  function extractNumberFromText(text) {
    if (!text) return 0;
    const cleanedText = text.replace(/,/g, "");
    const match = cleanedText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  background;
  class RateLimiter {
    /**
     * Create a new rate limiter
     *
     * @param maxRequestsPerHour - Maximum requests allowed per hour (default: 100)
     * @param minDelayMs - Minimum delay between requests in ms (default: 5000)
     * @param maxDelayMs - Maximum delay between requests in ms (default: 15000)
     */
    constructor(maxRequestsPerHour = 100, minDelayMs = 5e3, maxDelayMs = 15e3) {
      __publicField(this, "queue", []);
      __publicField(this, "processing", false);
      __publicField(this, "requestCount", 0);
      __publicField(this, "hourStartTime", Date.now());
      this.maxRequestsPerHour = maxRequestsPerHour;
      this.minDelayMs = minDelayMs;
      this.maxDelayMs = maxDelayMs;
      console.log(
        `[RateLimiter] Initialized: ${maxRequestsPerHour} req/hr, ${minDelayMs}-${maxDelayMs}ms delays`
      );
    }
    /**
     * Enqueue a function to be executed with rate limiting
     *
     * @param fn - Async function to execute
     * @returns Promise that resolves with function result
     * @throws Error if queue is full or function execution fails
     *
     * @example
     * ```typescript
     * const profile = await rateLimiter.enqueue(() => scrapeProfile(url));
     * ```
     */
    async enqueue(fn) {
      if (this.queue.length >= 1e3) {
        throw new Error("[RateLimiter] Queue full (1000 requests). Too many pending requests.");
      }
      return new Promise((resolve, reject) => {
        this.queue.push(async () => {
          try {
            const result2 = await fn();
            resolve(result2);
          } catch (error) {
            reject(error);
          }
        });
        if (!this.processing) {
          this.processQueue();
        }
      });
    }
    /**
     * Process queued functions one at a time
     * Handles hourly quota, delays, and error recovery
     */
    async processQueue() {
      this.processing = true;
      console.log(`[RateLimiter] Starting queue processing (${this.queue.length} pending)`);
      while (this.queue.length > 0) {
        const hourElapsed = Date.now() - this.hourStartTime;
        if (hourElapsed > 36e5) {
          console.log(
            `[RateLimiter] Hour elapsed. Resetting counter (was ${this.requestCount} requests)`
          );
          this.requestCount = 0;
          this.hourStartTime = Date.now();
        }
        if (this.requestCount >= this.maxRequestsPerHour) {
          const waitTime = 36e5 - hourElapsed;
          const waitTimeMin = Math.ceil(waitTime / 6e4);
          console.warn(
            `[RateLimiter] Rate limit reached (${this.requestCount}/${this.maxRequestsPerHour}). Waiting ${waitTimeMin} minutes until next hour.`
          );
          await this.sleep(waitTime);
          this.requestCount = 0;
          this.hourStartTime = Date.now();
          console.log("[RateLimiter] Rate limit reset. Resuming queue processing.");
        }
        const fn = this.queue.shift();
        if (fn) {
          try {
            await fn();
            this.requestCount++;
            console.log(
              `[RateLimiter] Request ${this.requestCount}/${this.maxRequestsPerHour} complete. Queue: ${this.queue.length} remaining.`
            );
            if (this.queue.length > 0) {
              const delay = this.randomDelay();
              const delaySec = (delay / 1e3).toFixed(1);
              console.log(`[RateLimiter] Waiting ${delaySec}s before next request...`);
              await this.sleep(delay);
            }
          } catch (error) {
            console.error("[RateLimiter] Request failed (continuing queue):", error);
          }
        }
      }
      console.log("[RateLimiter] Queue empty. Stopping processing.");
      this.processing = false;
    }
    /**
     * Generate random delay between min and max
     * Mimics human browsing patterns
     */
    randomDelay() {
      return Math.floor(Math.random() * (this.maxDelayMs - this.minDelayMs) + this.minDelayMs);
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get current queue statistics
     * Useful for debugging and monitoring
     */
    getStats() {
      const timeUntilReset = Math.max(0, 36e5 - (Date.now() - this.hourStartTime));
      return {
        queueLength: this.queue.length,
        requestCount: this.requestCount,
        maxRequests: this.maxRequestsPerHour,
        timeUntilReset,
        processing: this.processing
      };
    }
  }
  const rateLimiter = new RateLimiter();
  background;
  function querySelectorFallback$1(parent, selectors) {
    for (const selector of selectors) {
      const element = parent.querySelector(selector);
      if (element) {
        return element;
      }
    }
    return null;
  }
  function querySelectorAllFallback$1(parent, selectors) {
    for (const selector of selectors) {
      const elements = parent.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements);
      }
    }
    return [];
  }
  function sleep$1(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function scrollToLoadMore(_containerSelector, maxScrolls = 50) {
    let previousHeight = 0;
    let scrollAttempts = 0;
    let noChangeCount = 0;
    console.log("[ActivityScraper] Starting infinite scroll loading...");
    while (scrollAttempts < maxScrolls) {
      const currentHeight = document.body.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep$1(1500);
      if (currentHeight === previousHeight) {
        noChangeCount++;
        if (noChangeCount >= 2) {
          console.log("[ActivityScraper] Reached end of content (no new items loaded)");
          break;
        }
      } else {
        noChangeCount = 0;
      }
      previousHeight = currentHeight;
      scrollAttempts++;
      if (scrollAttempts % 10 === 0) {
        console.log(`[ActivityScraper] Scrolled ${scrollAttempts} times...`);
      }
    }
    console.log(
      `[ActivityScraper] Scroll complete. Total scrolls: ${scrollAttempts}`
    );
  }
  function generateUUID() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  background;
  const ACTOR_SELECTORS = [
    ".update-components-actor__name",
    ".feed-shared-actor__name",
    '[data-control-name="actor"] a',
    'a[href*="/in/"]'
  ];
  const TARGET_SELECTORS = [
    ".feed-shared-actor__name",
    ".update-components-target__name",
    '[data-control-name="target"] a'
  ];
  const CONTENT_SELECTORS = [
    '.feed-shared-text__text-view span[dir="ltr"]',
    ".feed-shared-text__text-view",
    ".feed-shared-inline-show-more-text",
    '[data-test-id="post-content"]',
    ".feed-shared-text"
  ];
  const TIME_SELECTORS = [
    "time[datetime]",
    "time",
    ".feed-shared-actor__sub-description time",
    '[data-control-name="time"]'
  ];
  const COMMENT_INDICATORS = [
    ".comment-entity",
    '[data-test-id="comment"]',
    ".comments-comment-item",
    '[aria-label*="comment"]'
  ];
  const REACTION_INDICATORS = [
    ".social-details-social-activity",
    ".reactions-react-button",
    '[data-control-name="like"]',
    '[aria-label*="react"]'
  ];
  const SHARE_INDICATORS = [
    ".feed-shared-update-v2__reshared",
    ".feed-shared-reshare-header",
    '[data-test-id="reshare"]',
    '[aria-label*="share"]'
  ];
  function extractActivity(element) {
    try {
      const type = detectActivityType(element);
      const actorElement = querySelectorFallback$1(element, ACTOR_SELECTORS);
      const actorId = extractProfileId(actorElement);
      const targetElement = querySelectorFallback$1(element, TARGET_SELECTORS);
      const targetId = extractProfileId(targetElement) || actorId;
      const contentElement = querySelectorFallback$1(element, CONTENT_SELECTORS);
      const content = contentElement?.textContent?.trim() || void 0;
      const timeElement = querySelectorFallback$1(element, TIME_SELECTORS);
      const timestamp = timeElement?.getAttribute("datetime") || (/* @__PURE__ */ new Date()).toISOString();
      const postId = element.getAttribute("data-urn") || element.getAttribute("data-activity-urn") || void 0;
      if (!actorId) {
        console.warn("[ActivityScraper] Missing actorId, skipping activity");
        return null;
      }
      const id = generateUUID();
      return {
        id,
        actorId,
        targetId: targetId || actorId,
        type,
        content,
        postId,
        timestamp,
        scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("[ActivityScraper] Error extracting activity:", error);
      return null;
    }
  }
  function detectActivityType(element) {
    if (querySelectorFallback$1(element, COMMENT_INDICATORS)) {
      return "comment";
    }
    if (querySelectorFallback$1(element, REACTION_INDICATORS)) {
      return "reaction";
    }
    if (querySelectorFallback$1(element, SHARE_INDICATORS)) {
      return "share";
    }
    return "post";
  }
  function extractProfileId(element) {
    if (!element) return null;
    const href = element.getAttribute("href");
    if (!href) return null;
    const match = href.match(/\/in\/([^\/\?]+)/);
    return match ? match[1] : null;
  }
  background;
  const ACTIVITY_CONTAINER_SELECTORS = [
    ".profile-creator-shared-feed-update__container",
    ".feed-shared-update-v2",
    '[data-urn*="activity"]'
  ];
  async function scrapeProfileActivity(profileUrl) {
    const activities = [];
    try {
      console.log("[ActivityScraper] Starting activity scrape:", profileUrl);
      const activityUrl = profileUrl.endsWith("/") ? `${profileUrl}recent-activity/all/` : `${profileUrl}/recent-activity/all/`;
      console.log("[ActivityScraper] Activity URL:", activityUrl);
      const containerLoaded = await waitForElement(
        ACTIVITY_CONTAINER_SELECTORS[0],
        1e4
      );
      if (!containerLoaded) {
        console.warn("[ActivityScraper] Activity container did not load.");
        return [];
      }
      await scrollToLoadMore(".scaffold-finite-scroll__content", 50);
      const activityElements = querySelectorAllFallback$1(
        document,
        ACTIVITY_CONTAINER_SELECTORS
      );
      console.log(`[ActivityScraper] Found ${activityElements.length} activity elements`);
      for (const element of activityElements) {
        const activity = extractActivity(element);
        if (activity) {
          activities.push(activity);
        }
      }
      console.log(
        `[ActivityScraper] Successfully extracted ${activities.length} activities`
      );
      return activities;
    } catch (error) {
      console.error("[ActivityScraper] Failed to scrape activities:", error);
      return [];
    }
  }
  async function scrapeProfileActivityWithRetry(profileUrl, maxRetries = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[ActivityScraper] Attempt ${attempt}/${maxRetries} for ${profileUrl}`
        );
        const activities = await scrapeProfileActivity(profileUrl);
        if (activities.length > 0 || attempt === maxRetries) {
          return activities;
        }
        console.warn(
          `[ActivityScraper] Got 0 activities on attempt ${attempt}, retrying...`
        );
      } catch (error) {
        lastError = error;
        console.error(
          `[ActivityScraper] Attempt ${attempt}/${maxRetries} failed:`,
          error
        );
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1e3;
          console.log(
            `[ActivityScraper] Waiting ${backoffMs}ms before retry...`
          );
          await sleep$1(backoffMs);
        }
      }
    }
    if (lastError) {
      console.error(
        `[ActivityScraper] All ${maxRetries} attempts failed:`,
        lastError
      );
    }
    return [];
  }
  async function scrapeProfileActivitySafe(profileUrl, maxRetries = 3) {
    return rateLimiter.enqueue(
      () => scrapeProfileActivityWithRetry(profileUrl, maxRetries)
    );
  }
  background;
  async function processActivityData(profileData, activities) {
    const userPosts = activities.filter((event) => event.type === "post" && event.actorId === profileData.id).map((event) => ({
      content: event.content || "",
      timestamp: event.timestamp,
      likes: 0,
      comments: 0
    }));
    const engagedPosts = activities.filter(
      (event) => event.actorId === profileData.id && event.targetId !== profileData.id && ["comment", "reaction", "share"].includes(event.type)
    ).map((event) => ({
      authorId: event.targetId,
      authorName: "",
      topic: event.content || "",
      timestamp: event.timestamp,
      engagementType: event.type
    }));
    return { userPosts, engagedPosts };
  }
  async function scrapeActivityForProfile(profileUrl, profileId) {
    console.log("[ProfileScraper] Scraping activity data (rate-limited)...");
    const activities = await scrapeProfileActivitySafe(profileUrl);
    console.log(`[ProfileScraper] Found ${activities.length} activities`);
    return activities;
  }
  background;
  async function scrapeProfileData(options) {
    try {
      await waitForElement(".pv-top-card");
      const profileData = {
        scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const urlMatch = window.location.href.match(/\/in\/([^\/]+)/);
      if (urlMatch) {
        profileData.publicId = urlMatch[1];
        profileData.id = urlMatch[1];
      }
      const nameElement = document.querySelector(".pv-top-card--list li:first-child");
      if (nameElement) {
        profileData.name = nameElement.textContent?.trim() || "";
      }
      const headlineElement = document.querySelector(".pv-top-card--list-bullet li:first-child");
      if (headlineElement) {
        const headline = headlineElement.textContent?.trim();
        profileData.headline = headline;
        if (headline) {
          profileData.industry = inferIndustryFromHeadline(headline);
        }
      }
      const locationElement = document.querySelector(".pv-top-card--list-bullet li:nth-child(2)");
      if (locationElement) {
        profileData.location = locationElement.textContent?.trim();
      }
      const avatarElement = document.querySelector(".pv-top-card__photo") || document.querySelector(".pv-top-card-profile-picture__image") || document.querySelector('img[data-ghost-classes*="profile"]') || document.querySelector(".profile-photo-edit__preview") || document.querySelector(".pv-top-card-profile-picture__image--show");
      if (avatarElement?.src && !avatarElement.src.includes("data:image")) {
        profileData.avatarUrl = avatarElement.src;
        console.log("[Uproot] [AVATAR] Extracted avatar URL:", profileData.avatarUrl);
      } else {
        console.warn("[Uproot] [AVATAR] No avatar found or using placeholder image");
      }
      const aboutElement = document.querySelector('#about ~ div .pv-shared-text-with-see-more span[aria-hidden="true"]');
      if (aboutElement) {
        profileData.about = aboutElement.textContent?.trim();
      }
      profileData.experience = [];
      const experienceSection = document.querySelector("#experience");
      if (experienceSection) {
        const experienceItems = experienceSection.parentElement?.querySelectorAll(".pvs-list__item--line-separated");
        experienceItems?.forEach((item) => {
          const companyElement = item.querySelector('.t-bold span[aria-hidden="true"]');
          const titleElement = item.querySelector('.t-14 span[aria-hidden="true"]');
          const durationElement = item.querySelector('.t-black--light span[aria-hidden="true"]');
          if (companyElement && titleElement) {
            profileData.experience?.push({
              company: companyElement.textContent?.trim() || "",
              title: titleElement.textContent?.trim() || "",
              duration: durationElement?.textContent?.trim()
            });
          }
        });
      }
      if (!profileData.industry && profileData.experience && profileData.experience.length > 0) {
        const firstJobTitle = profileData.experience[0].title;
        if (firstJobTitle) {
          profileData.industry = inferIndustryFromHeadline(firstJobTitle);
        }
      }
      profileData.education = [];
      const educationSection = document.querySelector("#education");
      if (educationSection) {
        const educationItems = educationSection.parentElement?.querySelectorAll(".pvs-list__item--line-separated");
        educationItems?.forEach((item) => {
          const schoolElement = item.querySelector('.t-bold span[aria-hidden="true"]');
          const degreeElement = item.querySelector('.t-14 span[aria-hidden="true"]');
          const dateElement = item.querySelector(".pvs-entity__caption-wrapper") || item.querySelector('.t-black--light:last-child span[aria-hidden="true"]') || item.querySelector('.pvs-entity__sub-components span[aria-hidden="true"]');
          const dates = parseDateString(dateElement?.textContent?.trim());
          if (schoolElement) {
            profileData.education?.push({
              school: schoolElement.textContent?.trim() || "",
              degree: degreeElement?.textContent?.trim(),
              field: void 0,
              startYear: dates.startYear,
              endYear: dates.endYear
            });
          }
        });
      }
      profileData.certifications = [];
      const certificationsSection = document.querySelector("#licenses_and_certifications");
      if (certificationsSection) {
        const certItems = certificationsSection.parentElement?.querySelectorAll(".pvs-list__item--line-separated");
        certItems?.forEach((item) => {
          const nameElement2 = item.querySelector('.t-bold span[aria-hidden="true"]');
          const issuerElement = item.querySelector('.t-14 span[aria-hidden="true"]');
          const dateElement = item.querySelector(".pvs-entity__caption-wrapper") || item.querySelector('.t-black--light span[aria-hidden="true"]');
          if (nameElement2) {
            profileData.certifications?.push({
              name: nameElement2.textContent?.trim() || "",
              issuer: issuerElement?.textContent?.trim(),
              dateObtained: dateElement?.textContent?.trim()
            });
          }
        });
      }
      profileData.skills = [];
      const skillsSection = document.querySelector("#skills");
      if (skillsSection) {
        const skillItems = skillsSection.parentElement?.querySelectorAll(".pvs-list__item--line-separated");
        skillItems?.forEach((item) => {
          const skillElement = item.querySelector('.t-bold span[aria-hidden="true"]');
          const endorsementElement = item.querySelector(".pvs-entity__supplementary-info") || item.querySelector('.t-black--light span[aria-hidden="true"]');
          const endorsementCount = endorsementElement ? extractNumberFromText(endorsementElement.textContent) : 0;
          if (skillElement) {
            profileData.skills?.push({
              name: skillElement.textContent?.trim() || "",
              endorsementCount,
              endorsedBy: []
            });
          }
        });
      }
      const connectionsElement = document.querySelector(".pv-top-card--list-bullet li span.t-black--light");
      if (connectionsElement) {
        const text = connectionsElement.textContent?.trim() || "";
        const match = text.match(/(\d+)/);
        if (match) {
          profileData.connections = parseInt(match[1], 10);
        }
      }
      console.log("Scraped profile data:", profileData);
      if (options?.includeActivity) {
        const profileUrl = window.location.href;
        const activities = await scrapeActivityForProfile(profileUrl, profileData.id);
        const { userPosts, engagedPosts } = await processActivityData(profileData, activities);
        console.log(`[ProfileScraper] Extracted ${userPosts.length} user posts, ${engagedPosts.length} engaged posts`);
        return {
          ...profileData,
          userPosts,
          engagedPosts,
          activities
        };
      }
      return profileData;
    } catch (error) {
      console.error("Profile scraping error:", error);
      return null;
    }
  }
  background;
  function querySelectorFallback(parent, selectors) {
    for (const selector of selectors) {
      const element = parent.querySelector(selector);
      if (element) {
        return element;
      }
    }
    return null;
  }
  function querySelectorAllFallback(parent, selectors) {
    for (const selector of selectors) {
      const elements = parent.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements);
      }
    }
    return [];
  }
  function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function scrollToLoadAllEmployees(maxScrolls = 100) {
    let previousHeight = 0;
    let scrollAttempts = 0;
    let noChangeCount = 0;
    console.log("[CompanyScraper] Starting infinite scroll for employees...");
    while (scrollAttempts < maxScrolls) {
      const currentHeight = document.body.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(randomDelay(2e3, 4e3));
      if (currentHeight === previousHeight) {
        noChangeCount++;
        if (noChangeCount >= 3) {
          console.log("[CompanyScraper] Reached end of employee list (no new items loaded)");
          break;
        }
      } else {
        noChangeCount = 0;
      }
      previousHeight = currentHeight;
      scrollAttempts++;
      if (scrollAttempts % 10 === 0) {
        console.log(`[CompanyScraper] Scrolled ${scrollAttempts} times...`);
      }
    }
    console.log(`[CompanyScraper] Scroll complete. Total scrolls: ${scrollAttempts}`);
  }
  background;
  const PROFILE_LINK_SELECTORS = [
    'a.app-aware-link[href*="/in/"]',
    'a[href*="/in/"]',
    'a[data-control-name="view_profile"]',
    ".artdeco-entity-lockup__title a"
  ];
  const NAME_SELECTORS = [
    ".org-people-profile-card__profile-title",
    "h3.artdeco-entity-lockup__title",
    '[data-control-name="people_profile_card"] h3',
    'a[href*="/in/"] .t-16'
  ];
  const HEADLINE_SELECTORS = [
    ".artdeco-entity-lockup__subtitle",
    ".org-people-profile-card__subtitle",
    'a[href*="/in/"] + div .t-14',
    '[data-control-name="people_profile_card"] .t-14'
  ];
  const ROLE_SELECTORS = [
    ".org-people-profile-card__profile-info-list li",
    ".artdeco-entity-lockup__caption",
    ".org-people-profile-card__profile-info .t-12"
  ];
  const CONNECTION_DEGREE_SELECTORS = [
    ".dist-value",
    ".member-distance-badge .dist-value",
    '[data-control-name="people_profile_card"] .dist-value',
    'span[aria-label*="degree"]'
  ];
  const MUTUAL_CONNECTIONS_SELECTORS = [
    ".org-people-profile-card__profile-info-subtitle",
    'span[aria-label*="mutual"]',
    ".artdeco-entity-lockup__badge"
  ];
  function extractEmployee(cardElement) {
    try {
      const linkElement = querySelectorFallback(cardElement, PROFILE_LINK_SELECTORS);
      if (!linkElement) {
        return null;
      }
      const profileUrl = linkElement.getAttribute("href") || "";
      const profileIdMatch = profileUrl.match(/\/in\/([^\/\?]+)/);
      if (!profileIdMatch) {
        return null;
      }
      const profileId = profileIdMatch[1];
      const nameElement = querySelectorFallback(cardElement, NAME_SELECTORS);
      const name = nameElement?.textContent?.trim();
      if (!name) {
        return null;
      }
      const headlineElement = querySelectorFallback(cardElement, HEADLINE_SELECTORS);
      const headline = headlineElement?.textContent?.trim() || void 0;
      const roleElement = querySelectorFallback(cardElement, ROLE_SELECTORS);
      const role = roleElement?.textContent?.trim() || headline || "Unknown";
      const connectionDegree = extractConnectionDegree(cardElement);
      const mutualConnectionCount = connectionDegree === 2 ? extractMutualConnectionCount(cardElement) : 0;
      const department = inferDepartmentFromHeadline(headline);
      const fullProfileUrl = profileUrl.startsWith("http") ? profileUrl : `https://www.linkedin.com${profileUrl}`;
      const employee = {
        profileId,
        name,
        headline,
        role,
        department,
        connectionDegree,
        mutualConnections: mutualConnectionCount > 0 ? Array(mutualConnectionCount).fill("") : [],
        profileUrl: fullProfileUrl,
        startDate: void 0,
        endDate: void 0
      };
      return employee;
    } catch (error) {
      console.error("[CompanyScraper] Error extracting employee:", error);
      return null;
    }
  }
  function extractConnectionDegree(cardElement) {
    try {
      const degreeElement = querySelectorFallback(cardElement, CONNECTION_DEGREE_SELECTORS);
      if (degreeElement) {
        const text = degreeElement.textContent?.trim() || "";
        if (text.includes("1st")) return 1;
        if (text.includes("2nd")) return 2;
        if (text.includes("3rd") || text.includes("3+")) return 3;
      }
      const messageButton = cardElement.querySelector('button[aria-label*="Message"]');
      if (messageButton) return 1;
      const connectButton = cardElement.querySelector(
        'button[aria-label*="Connect"], button.artdeco-button--secondary'
      );
      if (connectButton) return 3;
      const ariaElement = cardElement.querySelector('[aria-label*="degree"]');
      if (ariaElement) {
        const ariaLabel = ariaElement.getAttribute("aria-label") || "";
        if (ariaLabel.includes("1st")) return 1;
        if (ariaLabel.includes("2nd")) return 2;
        if (ariaLabel.includes("3rd")) return 3;
      }
      return 3;
    } catch (error) {
      console.error("[CompanyScraper] Error extracting connection degree:", error);
      return 3;
    }
  }
  function extractMutualConnectionCount(cardElement) {
    try {
      const mutualElement = querySelectorFallback(cardElement, MUTUAL_CONNECTIONS_SELECTORS);
      if (!mutualElement) return 0;
      const text = mutualElement.textContent?.trim() || "";
      const match = text.match(/(\d+)\s+mutual/i);
      if (match) {
        return parseInt(match[1], 10);
      }
      return 0;
    } catch (error) {
      console.error("[CompanyScraper] Error extracting mutual connections:", error);
      return 0;
    }
  }
  function inferDepartmentFromHeadline(headline) {
    if (!headline) return void 0;
    const text = headline.toLowerCase();
    const departmentKeywords = {
      "Engineering": ["engineer", "developer", "software", "sre", "devops", "architect"],
      "Product": ["product manager", "product owner", "product designer"],
      "Design": ["designer", "ux", "ui", "creative"],
      "Sales": ["sales", "account executive", "business development"],
      "Marketing": ["marketing", "brand", "growth", "content"],
      "Finance": ["finance", "accounting", "controller", "treasury"],
      "HR": ["hr", "recruiter", "talent", "people operations"],
      "Operations": ["operations", "ops", "supply chain", "logistics"],
      "Legal": ["lawyer", "attorney", "legal", "counsel"],
      "Executive": ["ceo", "cto", "cfo", "coo", "vp", "chief", "president"],
      "Research": ["researcher", "scientist", "phd", "research"],
      "IT": ["it manager", "system admin", "infrastructure", "security"]
    };
    for (const [department, keywords] of Object.entries(departmentKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return department;
        }
      }
    }
    return void 0;
  }
  background;
  const EMPLOYEE_CARD_SELECTORS = [
    ".org-people-profile-card",
    ".org-people-profile-card__card-spacing",
    '[data-control-name="people_profile_card"]',
    ".artdeco-entity-lockup"
  ];
  const COMPANY_NAME_SELECTORS = [
    ".org-top-card-summary__title",
    ".org-top-card__title",
    'h1[data-test-id="org-name"]'
  ];
  async function scrapeCompanyEmployees(companyUrl) {
    const employees = [];
    try {
      console.log("[CompanyScraper] Starting employee scrape:", companyUrl);
      const peopleUrl = companyUrl.endsWith("/") ? `${companyUrl}people/` : `${companyUrl}/people/`;
      console.log("[CompanyScraper] People URL:", peopleUrl);
      const cardsLoaded = await waitForElement(
        EMPLOYEE_CARD_SELECTORS[0],
        1e4
      );
      if (!cardsLoaded) {
        console.warn("[CompanyScraper] Employee cards did not load.");
        return [];
      }
      await scrollToLoadAllEmployees(100);
      const cardElements = querySelectorAllFallback(
        document,
        EMPLOYEE_CARD_SELECTORS
      );
      console.log(`[CompanyScraper] Found ${cardElements.length} employee cards`);
      for (const cardElement of cardElements) {
        const employee = extractEmployee(cardElement);
        if (employee) {
          employees.push(employee);
        }
      }
      console.log(
        `[CompanyScraper] Successfully extracted ${employees.length} employees`
      );
      return employees;
    } catch (error) {
      console.error("[CompanyScraper] Failed to scrape employees:", error);
      return [];
    }
  }
  function buildCompanyMap(companyUrl, companyName, employees) {
    const companyIdMatch = companyUrl.match(/\/company\/([^\/]+)/);
    const companyId = companyIdMatch ? companyIdMatch[1] : companyUrl;
    return {
      companyId,
      companyName,
      employees,
      scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async function scrapeCompanyMap(companyUrl) {
    try {
      const companyNameElement = querySelectorFallback(
        document,
        COMPANY_NAME_SELECTORS
      );
      const companyName = companyNameElement?.textContent?.trim() || "Unknown Company";
      const employees = await scrapeCompanyEmployees(companyUrl);
      if (employees.length === 0) {
        console.warn("[CompanyScraper] No employees found");
        return null;
      }
      return buildCompanyMap(companyUrl, companyName, employees);
    } catch (error) {
      console.error("[CompanyScraper] Failed to scrape company map:", error);
      return null;
    }
  }
  async function scrapeCompanyMapSafe(companyUrl) {
    return rateLimiter.enqueue(() => scrapeCompanyMap(companyUrl));
  }
  background;
  var dexie_min$1 = { exports: {} };
  var dexie_min = dexie_min$1.exports;
  var hasRequiredDexie_min;
  function requireDexie_min() {
    if (hasRequiredDexie_min) return dexie_min$1.exports;
    hasRequiredDexie_min = 1;
    (function(module, exports$1) {
      (function(e, t) {
        module.exports = t();
      })(dexie_min, function() {
        var s = function(e2, t2) {
          return (s = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e3, t3) {
            e3.__proto__ = t3;
          } || function(e3, t3) {
            for (var n2 in t3) Object.prototype.hasOwnProperty.call(t3, n2) && (e3[n2] = t3[n2]);
          })(e2, t2);
        };
        var _ = function() {
          return (_ = Object.assign || function(e2) {
            for (var t2, n2 = 1, r2 = arguments.length; n2 < r2; n2++) for (var i2 in t2 = arguments[n2]) Object.prototype.hasOwnProperty.call(t2, i2) && (e2[i2] = t2[i2]);
            return e2;
          }).apply(this, arguments);
        };
        function i(e2, t2, n2) {
          for (var r2, i2 = 0, o2 = t2.length; i2 < o2; i2++) !r2 && i2 in t2 || ((r2 = r2 || Array.prototype.slice.call(t2, 0, i2))[i2] = t2[i2]);
          return e2.concat(r2 || Array.prototype.slice.call(t2));
        }
        var f = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : commonjsGlobal, O = Object.keys, x = Array.isArray;
        function a(t2, n2) {
          return "object" != typeof n2 || O(n2).forEach(function(e2) {
            t2[e2] = n2[e2];
          }), t2;
        }
        "undefined" == typeof Promise || f.Promise || (f.Promise = Promise);
        var c = Object.getPrototypeOf, n = {}.hasOwnProperty;
        function m(e2, t2) {
          return n.call(e2, t2);
        }
        function r(t2, n2) {
          "function" == typeof n2 && (n2 = n2(c(t2))), ("undefined" == typeof Reflect ? O : Reflect.ownKeys)(n2).forEach(function(e2) {
            l(t2, e2, n2[e2]);
          });
        }
        var u = Object.defineProperty;
        function l(e2, t2, n2, r2) {
          u(e2, t2, a(n2 && m(n2, "get") && "function" == typeof n2.get ? { get: n2.get, set: n2.set, configurable: true } : { value: n2, configurable: true, writable: true }, r2));
        }
        function o(t2) {
          return { from: function(e2) {
            return t2.prototype = Object.create(e2.prototype), l(t2.prototype, "constructor", t2), { extend: r.bind(null, t2.prototype) };
          } };
        }
        var h = Object.getOwnPropertyDescriptor;
        var d = [].slice;
        function b(e2, t2, n2) {
          return d.call(e2, t2, n2);
        }
        function p(e2, t2) {
          return t2(e2);
        }
        function y(e2) {
          if (!e2) throw new Error("Assertion Failed");
        }
        function v(e2) {
          f.setImmediate ? setImmediate(e2) : setTimeout(e2, 0);
        }
        function g(e2, t2) {
          if ("string" == typeof t2 && m(e2, t2)) return e2[t2];
          if (!t2) return e2;
          if ("string" != typeof t2) {
            for (var n2 = [], r2 = 0, i2 = t2.length; r2 < i2; ++r2) {
              var o2 = g(e2, t2[r2]);
              n2.push(o2);
            }
            return n2;
          }
          var a2 = t2.indexOf(".");
          if (-1 !== a2) {
            var u2 = e2[t2.substr(0, a2)];
            return null == u2 ? void 0 : g(u2, t2.substr(a2 + 1));
          }
        }
        function w(e2, t2, n2) {
          if (e2 && void 0 !== t2 && !("isFrozen" in Object && Object.isFrozen(e2))) if ("string" != typeof t2 && "length" in t2) {
            y("string" != typeof n2 && "length" in n2);
            for (var r2 = 0, i2 = t2.length; r2 < i2; ++r2) w(e2, t2[r2], n2[r2]);
          } else {
            var o2, a2, u2 = t2.indexOf(".");
            -1 !== u2 ? (o2 = t2.substr(0, u2), "" === (a2 = t2.substr(u2 + 1)) ? void 0 === n2 ? x(e2) && !isNaN(parseInt(o2)) ? e2.splice(o2, 1) : delete e2[o2] : e2[o2] = n2 : w(u2 = !(u2 = e2[o2]) || !m(e2, o2) ? e2[o2] = {} : u2, a2, n2)) : void 0 === n2 ? x(e2) && !isNaN(parseInt(t2)) ? e2.splice(t2, 1) : delete e2[t2] : e2[t2] = n2;
          }
        }
        function k(e2) {
          var t2, n2 = {};
          for (t2 in e2) m(e2, t2) && (n2[t2] = e2[t2]);
          return n2;
        }
        var t = [].concat;
        function P(e2) {
          return t.apply([], e2);
        }
        var e = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(P([8, 16, 32, 64].map(function(t2) {
          return ["Int", "Uint", "Float"].map(function(e2) {
            return e2 + t2 + "Array";
          });
        }))).filter(function(e2) {
          return f[e2];
        }), K = new Set(e.map(function(e2) {
          return f[e2];
        }));
        var E = null;
        function S(e2) {
          E = /* @__PURE__ */ new WeakMap();
          e2 = (function e3(t2) {
            if (!t2 || "object" != typeof t2) return t2;
            var n2 = E.get(t2);
            if (n2) return n2;
            if (x(t2)) {
              n2 = [], E.set(t2, n2);
              for (var r2 = 0, i2 = t2.length; r2 < i2; ++r2) n2.push(e3(t2[r2]));
            } else if (K.has(t2.constructor)) n2 = t2;
            else {
              var o2, a2 = c(t2);
              for (o2 in n2 = a2 === Object.prototype ? {} : Object.create(a2), E.set(t2, n2), t2) m(t2, o2) && (n2[o2] = e3(t2[o2]));
            }
            return n2;
          })(e2);
          return E = null, e2;
        }
        var j = {}.toString;
        function A(e2) {
          return j.call(e2).slice(8, -1);
        }
        var C = "undefined" != typeof Symbol ? Symbol.iterator : "@@iterator", T = "symbol" == typeof C ? function(e2) {
          var t2;
          return null != e2 && (t2 = e2[C]) && t2.apply(e2);
        } : function() {
          return null;
        };
        function I(e2, t2) {
          t2 = e2.indexOf(t2);
          return 0 <= t2 && e2.splice(t2, 1), 0 <= t2;
        }
        var q = {};
        function D(e2) {
          var t2, n2, r2, i2;
          if (1 === arguments.length) {
            if (x(e2)) return e2.slice();
            if (this === q && "string" == typeof e2) return [e2];
            if (i2 = T(e2)) {
              for (n2 = []; !(r2 = i2.next()).done; ) n2.push(r2.value);
              return n2;
            }
            if (null == e2) return [e2];
            if ("number" != typeof (t2 = e2.length)) return [e2];
            for (n2 = new Array(t2); t2--; ) n2[t2] = e2[t2];
            return n2;
          }
          for (t2 = arguments.length, n2 = new Array(t2); t2--; ) n2[t2] = arguments[t2];
          return n2;
        }
        var B = "undefined" != typeof Symbol ? function(e2) {
          return "AsyncFunction" === e2[Symbol.toStringTag];
        } : function() {
          return false;
        }, R = ["Unknown", "Constraint", "Data", "TransactionInactive", "ReadOnly", "Version", "NotFound", "InvalidState", "InvalidAccess", "Abort", "Timeout", "QuotaExceeded", "Syntax", "DataClone"], F = ["Modify", "Bulk", "OpenFailed", "VersionChange", "Schema", "Upgrade", "InvalidTable", "MissingAPI", "NoSuchDatabase", "InvalidArgument", "SubTransaction", "Unsupported", "Internal", "DatabaseClosed", "PrematureCommit", "ForeignAwait"].concat(R), M = { VersionChanged: "Database version changed by other database connection", DatabaseClosed: "Database has been closed", Abort: "Transaction aborted", TransactionInactive: "Transaction has already completed or failed", MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb" };
        function N(e2, t2) {
          this.name = e2, this.message = t2;
        }
        function L(e2, t2) {
          return e2 + ". Errors: " + Object.keys(t2).map(function(e3) {
            return t2[e3].toString();
          }).filter(function(e3, t3, n2) {
            return n2.indexOf(e3) === t3;
          }).join("\n");
        }
        function U(e2, t2, n2, r2) {
          this.failures = t2, this.failedKeys = r2, this.successCount = n2, this.message = L(e2, t2);
        }
        function V(e2, t2) {
          this.name = "BulkError", this.failures = Object.keys(t2).map(function(e3) {
            return t2[e3];
          }), this.failuresByPos = t2, this.message = L(e2, this.failures);
        }
        o(N).from(Error).extend({ toString: function() {
          return this.name + ": " + this.message;
        } }), o(U).from(N), o(V).from(N);
        var z = F.reduce(function(e2, t2) {
          return e2[t2] = t2 + "Error", e2;
        }, {}), W = N, Y = F.reduce(function(e2, n2) {
          var r2 = n2 + "Error";
          function t2(e3, t3) {
            this.name = r2, e3 ? "string" == typeof e3 ? (this.message = "".concat(e3).concat(t3 ? "\n " + t3 : ""), this.inner = t3 || null) : "object" == typeof e3 && (this.message = "".concat(e3.name, " ").concat(e3.message), this.inner = e3) : (this.message = M[n2] || r2, this.inner = null);
          }
          return o(t2).from(W), e2[n2] = t2, e2;
        }, {});
        Y.Syntax = SyntaxError, Y.Type = TypeError, Y.Range = RangeError;
        var $ = R.reduce(function(e2, t2) {
          return e2[t2 + "Error"] = Y[t2], e2;
        }, {});
        var Q = F.reduce(function(e2, t2) {
          return -1 === ["Syntax", "Type", "Range"].indexOf(t2) && (e2[t2 + "Error"] = Y[t2]), e2;
        }, {});
        function G() {
        }
        function X(e2) {
          return e2;
        }
        function H(t2, n2) {
          return null == t2 || t2 === X ? n2 : function(e2) {
            return n2(t2(e2));
          };
        }
        function J(e2, t2) {
          return function() {
            e2.apply(this, arguments), t2.apply(this, arguments);
          };
        }
        function Z(i2, o2) {
          return i2 === G ? o2 : function() {
            var e2 = i2.apply(this, arguments);
            void 0 !== e2 && (arguments[0] = e2);
            var t2 = this.onsuccess, n2 = this.onerror;
            this.onsuccess = null, this.onerror = null;
            var r2 = o2.apply(this, arguments);
            return t2 && (this.onsuccess = this.onsuccess ? J(t2, this.onsuccess) : t2), n2 && (this.onerror = this.onerror ? J(n2, this.onerror) : n2), void 0 !== r2 ? r2 : e2;
          };
        }
        function ee(n2, r2) {
          return n2 === G ? r2 : function() {
            n2.apply(this, arguments);
            var e2 = this.onsuccess, t2 = this.onerror;
            this.onsuccess = this.onerror = null, r2.apply(this, arguments), e2 && (this.onsuccess = this.onsuccess ? J(e2, this.onsuccess) : e2), t2 && (this.onerror = this.onerror ? J(t2, this.onerror) : t2);
          };
        }
        function te(i2, o2) {
          return i2 === G ? o2 : function(e2) {
            var t2 = i2.apply(this, arguments);
            a(e2, t2);
            var n2 = this.onsuccess, r2 = this.onerror;
            this.onsuccess = null, this.onerror = null;
            e2 = o2.apply(this, arguments);
            return n2 && (this.onsuccess = this.onsuccess ? J(n2, this.onsuccess) : n2), r2 && (this.onerror = this.onerror ? J(r2, this.onerror) : r2), void 0 === t2 ? void 0 === e2 ? void 0 : e2 : a(t2, e2);
          };
        }
        function ne(e2, t2) {
          return e2 === G ? t2 : function() {
            return false !== t2.apply(this, arguments) && e2.apply(this, arguments);
          };
        }
        function re(i2, o2) {
          return i2 === G ? o2 : function() {
            var e2 = i2.apply(this, arguments);
            if (e2 && "function" == typeof e2.then) {
              for (var t2 = this, n2 = arguments.length, r2 = new Array(n2); n2--; ) r2[n2] = arguments[n2];
              return e2.then(function() {
                return o2.apply(t2, r2);
              });
            }
            return o2.apply(this, arguments);
          };
        }
        Q.ModifyError = U, Q.DexieError = N, Q.BulkError = V;
        var ie = "undefined" != typeof location && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
        function oe(e2) {
          ie = e2;
        }
        var ae = {}, ue = 100, e = "undefined" == typeof Promise ? [] : (function() {
          var e2 = Promise.resolve();
          if ("undefined" == typeof crypto || !crypto.subtle) return [e2, c(e2), e2];
          var t2 = crypto.subtle.digest("SHA-512", new Uint8Array([0]));
          return [t2, c(t2), e2];
        })(), R = e[0], F = e[1], e = e[2], F = F && F.then, se = R && R.constructor, ce = !!e;
        var le = function(e2, t2) {
          be.push([e2, t2]), he && (queueMicrotask(Se), he = false);
        }, fe = true, he = true, de = [], pe = [], ye = X, ve = { id: "global", global: true, ref: 0, unhandleds: [], onunhandled: G, pgp: false, env: {}, finalize: G }, me = ve, be = [], ge = 0, we = [];
        function _e(e2) {
          if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
          this._listeners = [], this._lib = false;
          var t2 = this._PSD = me;
          if ("function" != typeof e2) {
            if (e2 !== ae) throw new TypeError("Not a function");
            return this._state = arguments[1], this._value = arguments[2], void (false === this._state && Oe(this, this._value));
          }
          this._state = null, this._value = null, ++t2.ref, (function t3(r2, e3) {
            try {
              e3(function(n2) {
                if (null === r2._state) {
                  if (n2 === r2) throw new TypeError("A promise cannot be resolved with itself.");
                  var e4 = r2._lib && je();
                  n2 && "function" == typeof n2.then ? t3(r2, function(e5, t4) {
                    n2 instanceof _e ? n2._then(e5, t4) : n2.then(e5, t4);
                  }) : (r2._state = true, r2._value = n2, Pe(r2)), e4 && Ae();
                }
              }, Oe.bind(null, r2));
            } catch (e4) {
              Oe(r2, e4);
            }
          })(this, e2);
        }
        var xe = { get: function() {
          var u2 = me, t2 = Fe;
          function e2(n2, r2) {
            var i2 = this, o2 = !u2.global && (u2 !== me || t2 !== Fe), a2 = o2 && !Ue(), e3 = new _e(function(e4, t3) {
              Ke(i2, new ke(Qe(n2, u2, o2, a2), Qe(r2, u2, o2, a2), e4, t3, u2));
            });
            return this._consoleTask && (e3._consoleTask = this._consoleTask), e3;
          }
          return e2.prototype = ae, e2;
        }, set: function(e2) {
          l(this, "then", e2 && e2.prototype === ae ? xe : { get: function() {
            return e2;
          }, set: xe.set });
        } };
        function ke(e2, t2, n2, r2, i2) {
          this.onFulfilled = "function" == typeof e2 ? e2 : null, this.onRejected = "function" == typeof t2 ? t2 : null, this.resolve = n2, this.reject = r2, this.psd = i2;
        }
        function Oe(e2, t2) {
          var n2, r2;
          pe.push(t2), null === e2._state && (n2 = e2._lib && je(), t2 = ye(t2), e2._state = false, e2._value = t2, r2 = e2, de.some(function(e3) {
            return e3._value === r2._value;
          }) || de.push(r2), Pe(e2), n2 && Ae());
        }
        function Pe(e2) {
          var t2 = e2._listeners;
          e2._listeners = [];
          for (var n2 = 0, r2 = t2.length; n2 < r2; ++n2) Ke(e2, t2[n2]);
          var i2 = e2._PSD;
          --i2.ref || i2.finalize(), 0 === ge && (++ge, le(function() {
            0 == --ge && Ce();
          }, []));
        }
        function Ke(e2, t2) {
          if (null !== e2._state) {
            var n2 = e2._state ? t2.onFulfilled : t2.onRejected;
            if (null === n2) return (e2._state ? t2.resolve : t2.reject)(e2._value);
            ++t2.psd.ref, ++ge, le(Ee, [n2, e2, t2]);
          } else e2._listeners.push(t2);
        }
        function Ee(e2, t2, n2) {
          try {
            var r2, i2 = t2._value;
            !t2._state && pe.length && (pe = []), r2 = ie && t2._consoleTask ? t2._consoleTask.run(function() {
              return e2(i2);
            }) : e2(i2), t2._state || -1 !== pe.indexOf(i2) || (function(e3) {
              var t3 = de.length;
              for (; t3; ) if (de[--t3]._value === e3._value) return de.splice(t3, 1);
            })(t2), n2.resolve(r2);
          } catch (e3) {
            n2.reject(e3);
          } finally {
            0 == --ge && Ce(), --n2.psd.ref || n2.psd.finalize();
          }
        }
        function Se() {
          $e(ve, function() {
            je() && Ae();
          });
        }
        function je() {
          var e2 = fe;
          return he = fe = false, e2;
        }
        function Ae() {
          var e2, t2, n2;
          do {
            for (; 0 < be.length; ) for (e2 = be, be = [], n2 = e2.length, t2 = 0; t2 < n2; ++t2) {
              var r2 = e2[t2];
              r2[0].apply(null, r2[1]);
            }
          } while (0 < be.length);
          he = fe = true;
        }
        function Ce() {
          var e2 = de;
          de = [], e2.forEach(function(e3) {
            e3._PSD.onunhandled.call(null, e3._value, e3);
          });
          for (var t2 = we.slice(0), n2 = t2.length; n2; ) t2[--n2]();
        }
        function Te(e2) {
          return new _e(ae, false, e2);
        }
        function Ie(n2, r2) {
          var i2 = me;
          return function() {
            var e2 = je(), t2 = me;
            try {
              return We(i2, true), n2.apply(this, arguments);
            } catch (e3) {
              r2 && r2(e3);
            } finally {
              We(t2, false), e2 && Ae();
            }
          };
        }
        r(_e.prototype, { then: xe, _then: function(e2, t2) {
          Ke(this, new ke(null, null, e2, t2, me));
        }, catch: function(e2) {
          if (1 === arguments.length) return this.then(null, e2);
          var t2 = e2, n2 = arguments[1];
          return "function" == typeof t2 ? this.then(null, function(e3) {
            return (e3 instanceof t2 ? n2 : Te)(e3);
          }) : this.then(null, function(e3) {
            return (e3 && e3.name === t2 ? n2 : Te)(e3);
          });
        }, finally: function(t2) {
          return this.then(function(e2) {
            return _e.resolve(t2()).then(function() {
              return e2;
            });
          }, function(e2) {
            return _e.resolve(t2()).then(function() {
              return Te(e2);
            });
          });
        }, timeout: function(r2, i2) {
          var o2 = this;
          return r2 < 1 / 0 ? new _e(function(e2, t2) {
            var n2 = setTimeout(function() {
              return t2(new Y.Timeout(i2));
            }, r2);
            o2.then(e2, t2).finally(clearTimeout.bind(null, n2));
          }) : this;
        } }), "undefined" != typeof Symbol && Symbol.toStringTag && l(_e.prototype, Symbol.toStringTag, "Dexie.Promise"), ve.env = Ye(), r(_e, { all: function() {
          var o2 = D.apply(null, arguments).map(Ve);
          return new _e(function(n2, r2) {
            0 === o2.length && n2([]);
            var i2 = o2.length;
            o2.forEach(function(e2, t2) {
              return _e.resolve(e2).then(function(e3) {
                o2[t2] = e3, --i2 || n2(o2);
              }, r2);
            });
          });
        }, resolve: function(n2) {
          return n2 instanceof _e ? n2 : n2 && "function" == typeof n2.then ? new _e(function(e2, t2) {
            n2.then(e2, t2);
          }) : new _e(ae, true, n2);
        }, reject: Te, race: function() {
          var e2 = D.apply(null, arguments).map(Ve);
          return new _e(function(t2, n2) {
            e2.map(function(e3) {
              return _e.resolve(e3).then(t2, n2);
            });
          });
        }, PSD: { get: function() {
          return me;
        }, set: function(e2) {
          return me = e2;
        } }, totalEchoes: { get: function() {
          return Fe;
        } }, newPSD: Ne, usePSD: $e, scheduler: { get: function() {
          return le;
        }, set: function(e2) {
          le = e2;
        } }, rejectionMapper: { get: function() {
          return ye;
        }, set: function(e2) {
          ye = e2;
        } }, follow: function(i2, n2) {
          return new _e(function(e2, t2) {
            return Ne(function(n3, r2) {
              var e3 = me;
              e3.unhandleds = [], e3.onunhandled = r2, e3.finalize = J(function() {
                var t3, e4 = this;
                t3 = function() {
                  0 === e4.unhandleds.length ? n3() : r2(e4.unhandleds[0]);
                }, we.push(function e5() {
                  t3(), we.splice(we.indexOf(e5), 1);
                }), ++ge, le(function() {
                  0 == --ge && Ce();
                }, []);
              }, e3.finalize), i2();
            }, n2, e2, t2);
          });
        } }), se && (se.allSettled && l(_e, "allSettled", function() {
          var e2 = D.apply(null, arguments).map(Ve);
          return new _e(function(n2) {
            0 === e2.length && n2([]);
            var r2 = e2.length, i2 = new Array(r2);
            e2.forEach(function(e3, t2) {
              return _e.resolve(e3).then(function(e4) {
                return i2[t2] = { status: "fulfilled", value: e4 };
              }, function(e4) {
                return i2[t2] = { status: "rejected", reason: e4 };
              }).then(function() {
                return --r2 || n2(i2);
              });
            });
          });
        }), se.any && "undefined" != typeof AggregateError && l(_e, "any", function() {
          var e2 = D.apply(null, arguments).map(Ve);
          return new _e(function(n2, r2) {
            0 === e2.length && r2(new AggregateError([]));
            var i2 = e2.length, o2 = new Array(i2);
            e2.forEach(function(e3, t2) {
              return _e.resolve(e3).then(function(e4) {
                return n2(e4);
              }, function(e4) {
                o2[t2] = e4, --i2 || r2(new AggregateError(o2));
              });
            });
          });
        }), se.withResolvers && (_e.withResolvers = se.withResolvers));
        var qe = { awaits: 0, echoes: 0, id: 0 }, De = 0, Be = [], Re = 0, Fe = 0, Me = 0;
        function Ne(e2, t2, n2, r2) {
          var i2 = me, o2 = Object.create(i2);
          o2.parent = i2, o2.ref = 0, o2.global = false, o2.id = ++Me, ve.env, o2.env = ce ? { Promise: _e, PromiseProp: { value: _e, configurable: true, writable: true }, all: _e.all, race: _e.race, allSettled: _e.allSettled, any: _e.any, resolve: _e.resolve, reject: _e.reject } : {}, t2 && a(o2, t2), ++i2.ref, o2.finalize = function() {
            --this.parent.ref || this.parent.finalize();
          };
          r2 = $e(o2, e2, n2, r2);
          return 0 === o2.ref && o2.finalize(), r2;
        }
        function Le() {
          return qe.id || (qe.id = ++De), ++qe.awaits, qe.echoes += ue, qe.id;
        }
        function Ue() {
          return !!qe.awaits && (0 == --qe.awaits && (qe.id = 0), qe.echoes = qe.awaits * ue, true);
        }
        function Ve(e2) {
          return qe.echoes && e2 && e2.constructor === se ? (Le(), e2.then(function(e3) {
            return Ue(), e3;
          }, function(e3) {
            return Ue(), Xe(e3);
          })) : e2;
        }
        function ze() {
          var e2 = Be[Be.length - 1];
          Be.pop(), We(e2, false);
        }
        function We(e2, t2) {
          var n2, r2 = me;
          (t2 ? !qe.echoes || Re++ && e2 === me : !Re || --Re && e2 === me) || queueMicrotask(t2 ? function(e3) {
            ++Fe, qe.echoes && 0 != --qe.echoes || (qe.echoes = qe.awaits = qe.id = 0), Be.push(me), We(e3, true);
          }.bind(null, e2) : ze), e2 !== me && (me = e2, r2 === ve && (ve.env = Ye()), ce && (n2 = ve.env.Promise, t2 = e2.env, (r2.global || e2.global) && (Object.defineProperty(f, "Promise", t2.PromiseProp), n2.all = t2.all, n2.race = t2.race, n2.resolve = t2.resolve, n2.reject = t2.reject, t2.allSettled && (n2.allSettled = t2.allSettled), t2.any && (n2.any = t2.any))));
        }
        function Ye() {
          var e2 = f.Promise;
          return ce ? { Promise: e2, PromiseProp: Object.getOwnPropertyDescriptor(f, "Promise"), all: e2.all, race: e2.race, allSettled: e2.allSettled, any: e2.any, resolve: e2.resolve, reject: e2.reject } : {};
        }
        function $e(e2, t2, n2, r2, i2) {
          var o2 = me;
          try {
            return We(e2, true), t2(n2, r2, i2);
          } finally {
            We(o2, false);
          }
        }
        function Qe(t2, n2, r2, i2) {
          return "function" != typeof t2 ? t2 : function() {
            var e2 = me;
            r2 && Le(), We(n2, true);
            try {
              return t2.apply(this, arguments);
            } finally {
              We(e2, false), i2 && queueMicrotask(Ue);
            }
          };
        }
        function Ge(e2) {
          Promise === se && 0 === qe.echoes ? 0 === Re ? e2() : enqueueNativeMicroTask(e2) : setTimeout(e2, 0);
        }
        -1 === ("" + F).indexOf("[native code]") && (Le = Ue = G);
        var Xe = _e.reject;
        var He = String.fromCharCode(65535), Je = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", Ze = "String expected.", et = [], tt = "__dbnames", nt = "readonly", rt = "readwrite";
        function it(e2, t2) {
          return e2 ? t2 ? function() {
            return e2.apply(this, arguments) && t2.apply(this, arguments);
          } : e2 : t2;
        }
        var ot = { type: 3, lower: -1 / 0, lowerOpen: false, upper: [[]], upperOpen: false };
        function at(t2) {
          return "string" != typeof t2 || /\./.test(t2) ? function(e2) {
            return e2;
          } : function(e2) {
            return void 0 === e2[t2] && t2 in e2 && delete (e2 = S(e2))[t2], e2;
          };
        }
        function ut() {
          throw Y.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
        }
        function st(e2, t2) {
          try {
            var n2 = ct(e2), r2 = ct(t2);
            if (n2 !== r2) return "Array" === n2 ? 1 : "Array" === r2 ? -1 : "binary" === n2 ? 1 : "binary" === r2 ? -1 : "string" === n2 ? 1 : "string" === r2 ? -1 : "Date" === n2 ? 1 : "Date" !== r2 ? NaN : -1;
            switch (n2) {
              case "number":
              case "Date":
              case "string":
                return t2 < e2 ? 1 : e2 < t2 ? -1 : 0;
              case "binary":
                return (function(e3, t3) {
                  for (var n3 = e3.length, r3 = t3.length, i2 = n3 < r3 ? n3 : r3, o2 = 0; o2 < i2; ++o2) if (e3[o2] !== t3[o2]) return e3[o2] < t3[o2] ? -1 : 1;
                  return n3 === r3 ? 0 : n3 < r3 ? -1 : 1;
                })(lt(e2), lt(t2));
              case "Array":
                return (function(e3, t3) {
                  for (var n3 = e3.length, r3 = t3.length, i2 = n3 < r3 ? n3 : r3, o2 = 0; o2 < i2; ++o2) {
                    var a2 = st(e3[o2], t3[o2]);
                    if (0 !== a2) return a2;
                  }
                  return n3 === r3 ? 0 : n3 < r3 ? -1 : 1;
                })(e2, t2);
            }
          } catch (e3) {
          }
          return NaN;
        }
        function ct(e2) {
          var t2 = typeof e2;
          if ("object" != t2) return t2;
          if (ArrayBuffer.isView(e2)) return "binary";
          e2 = A(e2);
          return "ArrayBuffer" === e2 ? "binary" : e2;
        }
        function lt(e2) {
          return e2 instanceof Uint8Array ? e2 : ArrayBuffer.isView(e2) ? new Uint8Array(e2.buffer, e2.byteOffset, e2.byteLength) : new Uint8Array(e2);
        }
        function ft(t2, n2, r2) {
          var e2 = t2.schema.yProps;
          return e2 ? (n2 && 0 < r2.numFailures && (n2 = n2.filter(function(e3, t3) {
            return !r2.failures[t3];
          })), Promise.all(e2.map(function(e3) {
            e3 = e3.updatesTable;
            return n2 ? t2.db.table(e3).where("k").anyOf(n2).delete() : t2.db.table(e3).clear();
          })).then(function() {
            return r2;
          })) : r2;
        }
        var ht = (dt.prototype.execute = function(e2) {
          var t2 = this["@@propmod"];
          if (void 0 !== t2.add) {
            var n2 = t2.add;
            if (x(n2)) return i(i([], x(e2) ? e2 : [], true), n2).sort();
            if ("number" == typeof n2) return (Number(e2) || 0) + n2;
            if ("bigint" == typeof n2) try {
              return BigInt(e2) + n2;
            } catch (e3) {
              return BigInt(0) + n2;
            }
            throw new TypeError("Invalid term ".concat(n2));
          }
          if (void 0 !== t2.remove) {
            var r2 = t2.remove;
            if (x(r2)) return x(e2) ? e2.filter(function(e3) {
              return !r2.includes(e3);
            }).sort() : [];
            if ("number" == typeof r2) return Number(e2) - r2;
            if ("bigint" == typeof r2) try {
              return BigInt(e2) - r2;
            } catch (e3) {
              return BigInt(0) - r2;
            }
            throw new TypeError("Invalid subtrahend ".concat(r2));
          }
          n2 = null === (n2 = t2.replacePrefix) || void 0 === n2 ? void 0 : n2[0];
          return n2 && "string" == typeof e2 && e2.startsWith(n2) ? t2.replacePrefix[1] + e2.substring(n2.length) : e2;
        }, dt);
        function dt(e2) {
          this["@@propmod"] = e2;
        }
        function pt(e2, t2) {
          for (var n2 = O(t2), r2 = n2.length, i2 = false, o2 = 0; o2 < r2; ++o2) {
            var a2 = n2[o2], u2 = t2[a2], s2 = g(e2, a2);
            u2 instanceof ht ? (w(e2, a2, u2.execute(s2)), i2 = true) : s2 !== u2 && (w(e2, a2, u2), i2 = true);
          }
          return i2;
        }
        var yt = (vt.prototype._trans = function(e2, r2, t2) {
          var n2 = this._tx || me.trans, i2 = this.name, o2 = ie && "undefined" != typeof console && console.createTask && console.createTask("Dexie: ".concat("readonly" === e2 ? "read" : "write", " ").concat(this.name));
          function a2(e3, t3, n3) {
            if (!n3.schema[i2]) throw new Y.NotFound("Table " + i2 + " not part of transaction");
            return r2(n3.idbtrans, n3);
          }
          var u2 = je();
          try {
            var s2 = n2 && n2.db._novip === this.db._novip ? n2 === me.trans ? n2._promise(e2, a2, t2) : Ne(function() {
              return n2._promise(e2, a2, t2);
            }, { trans: n2, transless: me.transless || me }) : (function t3(n3, r3, i3, o3) {
              if (n3.idbdb && (n3._state.openComplete || me.letThrough || n3._vip)) {
                var a3 = n3._createTransaction(r3, i3, n3._dbSchema);
                try {
                  a3.create(), n3._state.PR1398_maxLoop = 3;
                } catch (e3) {
                  return e3.name === z.InvalidState && n3.isOpen() && 0 < --n3._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), n3.close({ disableAutoOpen: false }), n3.open().then(function() {
                    return t3(n3, r3, i3, o3);
                  })) : Xe(e3);
                }
                return a3._promise(r3, function(e3, t4) {
                  return Ne(function() {
                    return me.trans = a3, o3(e3, t4, a3);
                  });
                }).then(function(e3) {
                  if ("readwrite" === r3) try {
                    a3.idbtrans.commit();
                  } catch (e4) {
                  }
                  return "readonly" === r3 ? e3 : a3._completion.then(function() {
                    return e3;
                  });
                });
              }
              if (n3._state.openComplete) return Xe(new Y.DatabaseClosed(n3._state.dbOpenError));
              if (!n3._state.isBeingOpened) {
                if (!n3._state.autoOpen) return Xe(new Y.DatabaseClosed());
                n3.open().catch(G);
              }
              return n3._state.dbReadyPromise.then(function() {
                return t3(n3, r3, i3, o3);
              });
            })(this.db, e2, [this.name], a2);
            return o2 && (s2._consoleTask = o2, s2 = s2.catch(function(e3) {
              return console.trace(e3), Xe(e3);
            })), s2;
          } finally {
            u2 && Ae();
          }
        }, vt.prototype.get = function(t2, e2) {
          var n2 = this;
          return t2 && t2.constructor === Object ? this.where(t2).first(e2) : null == t2 ? Xe(new Y.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(e3) {
            return n2.core.get({ trans: e3, key: t2 }).then(function(e4) {
              return n2.hook.reading.fire(e4);
            });
          }).then(e2);
        }, vt.prototype.where = function(o2) {
          if ("string" == typeof o2) return new this.db.WhereClause(this, o2);
          if (x(o2)) return new this.db.WhereClause(this, "[".concat(o2.join("+"), "]"));
          var n2 = O(o2);
          if (1 === n2.length) return this.where(n2[0]).equals(o2[n2[0]]);
          var e2 = this.schema.indexes.concat(this.schema.primKey).filter(function(t3) {
            if (t3.compound && n2.every(function(e4) {
              return 0 <= t3.keyPath.indexOf(e4);
            })) {
              for (var e3 = 0; e3 < n2.length; ++e3) if (-1 === n2.indexOf(t3.keyPath[e3])) return false;
              return true;
            }
            return false;
          }).sort(function(e3, t3) {
            return e3.keyPath.length - t3.keyPath.length;
          })[0];
          if (e2 && this.db._maxKey !== He) {
            var t2 = e2.keyPath.slice(0, n2.length);
            return this.where(t2).equals(t2.map(function(e3) {
              return o2[e3];
            }));
          }
          !e2 && ie && console.warn("The query ".concat(JSON.stringify(o2), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(n2.join("+"), "]"));
          var a2 = this.schema.idxByName;
          function u2(e3, t3) {
            return 0 === st(e3, t3);
          }
          var r2 = n2.reduce(function(e3, t3) {
            var n3 = e3[0], r3 = e3[1], e3 = a2[t3], i2 = o2[t3];
            return [n3 || e3, n3 || !e3 ? it(r3, e3 && e3.multi ? function(e4) {
              e4 = g(e4, t3);
              return x(e4) && e4.some(function(e5) {
                return u2(i2, e5);
              });
            } : function(e4) {
              return u2(i2, g(e4, t3));
            }) : r3];
          }, [null, null]), t2 = r2[0], r2 = r2[1];
          return t2 ? this.where(t2.name).equals(o2[t2.keyPath]).filter(r2) : e2 ? this.filter(r2) : this.where(n2).equals("");
        }, vt.prototype.filter = function(e2) {
          return this.toCollection().and(e2);
        }, vt.prototype.count = function(e2) {
          return this.toCollection().count(e2);
        }, vt.prototype.offset = function(e2) {
          return this.toCollection().offset(e2);
        }, vt.prototype.limit = function(e2) {
          return this.toCollection().limit(e2);
        }, vt.prototype.each = function(e2) {
          return this.toCollection().each(e2);
        }, vt.prototype.toArray = function(e2) {
          return this.toCollection().toArray(e2);
        }, vt.prototype.toCollection = function() {
          return new this.db.Collection(new this.db.WhereClause(this));
        }, vt.prototype.orderBy = function(e2) {
          return new this.db.Collection(new this.db.WhereClause(this, x(e2) ? "[".concat(e2.join("+"), "]") : e2));
        }, vt.prototype.reverse = function() {
          return this.toCollection().reverse();
        }, vt.prototype.mapToClass = function(r2) {
          var e2, t2 = this.db, n2 = this.name;
          function i2() {
            return null !== e2 && e2.apply(this, arguments) || this;
          }
          (this.schema.mappedClass = r2).prototype instanceof ut && ((function(e3, t3) {
            if ("function" != typeof t3 && null !== t3) throw new TypeError("Class extends value " + String(t3) + " is not a constructor or null");
            function n3() {
              this.constructor = e3;
            }
            s(e3, t3), e3.prototype = null === t3 ? Object.create(t3) : (n3.prototype = t3.prototype, new n3());
          })(i2, e2 = r2), Object.defineProperty(i2.prototype, "db", { get: function() {
            return t2;
          }, enumerable: false, configurable: true }), i2.prototype.table = function() {
            return n2;
          }, r2 = i2);
          for (var o2 = /* @__PURE__ */ new Set(), a2 = r2.prototype; a2; a2 = c(a2)) Object.getOwnPropertyNames(a2).forEach(function(e3) {
            return o2.add(e3);
          });
          function u2(e3) {
            if (!e3) return e3;
            var t3, n3 = Object.create(r2.prototype);
            for (t3 in e3) if (!o2.has(t3)) try {
              n3[t3] = e3[t3];
            } catch (e4) {
            }
            return n3;
          }
          return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = u2, this.hook("reading", u2), r2;
        }, vt.prototype.defineClass = function() {
          return this.mapToClass(function(e2) {
            a(this, e2);
          });
        }, vt.prototype.add = function(t2, n2) {
          var r2 = this, e2 = this.schema.primKey, i2 = e2.auto, o2 = e2.keyPath, a2 = t2;
          return o2 && i2 && (a2 = at(o2)(t2)), this._trans("readwrite", function(e3) {
            return r2.core.mutate({ trans: e3, type: "add", keys: null != n2 ? [n2] : null, values: [a2] });
          }).then(function(e3) {
            return e3.numFailures ? _e.reject(e3.failures[0]) : e3.lastResult;
          }).then(function(e3) {
            if (o2) try {
              w(t2, o2, e3);
            } catch (e4) {
            }
            return e3;
          });
        }, vt.prototype.upsert = function(r2, i2) {
          var o2 = this, a2 = this.schema.primKey.keyPath;
          return this._trans("readwrite", function(n2) {
            return o2.core.get({ trans: n2, key: r2 }).then(function(t2) {
              var e2 = null != t2 ? t2 : {};
              return pt(e2, i2), a2 && w(e2, a2, r2), o2.core.mutate({ trans: n2, type: "put", values: [e2], keys: [r2], upsert: true, updates: { keys: [r2], changeSpecs: [i2] } }).then(function(e3) {
                return e3.numFailures ? _e.reject(e3.failures[0]) : !!t2;
              });
            });
          });
        }, vt.prototype.update = function(e2, t2) {
          if ("object" != typeof e2 || x(e2)) return this.where(":id").equals(e2).modify(t2);
          e2 = g(e2, this.schema.primKey.keyPath);
          return void 0 === e2 ? Xe(new Y.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(e2).modify(t2);
        }, vt.prototype.put = function(t2, n2) {
          var r2 = this, e2 = this.schema.primKey, i2 = e2.auto, o2 = e2.keyPath, a2 = t2;
          return o2 && i2 && (a2 = at(o2)(t2)), this._trans("readwrite", function(e3) {
            return r2.core.mutate({ trans: e3, type: "put", values: [a2], keys: null != n2 ? [n2] : null });
          }).then(function(e3) {
            return e3.numFailures ? _e.reject(e3.failures[0]) : e3.lastResult;
          }).then(function(e3) {
            if (o2) try {
              w(t2, o2, e3);
            } catch (e4) {
            }
            return e3;
          });
        }, vt.prototype.delete = function(t2) {
          var n2 = this;
          return this._trans("readwrite", function(e2) {
            return n2.core.mutate({ trans: e2, type: "delete", keys: [t2] }).then(function(e3) {
              return ft(n2, [t2], e3);
            }).then(function(e3) {
              return e3.numFailures ? _e.reject(e3.failures[0]) : void 0;
            });
          });
        }, vt.prototype.clear = function() {
          var t2 = this;
          return this._trans("readwrite", function(e2) {
            return t2.core.mutate({ trans: e2, type: "deleteRange", range: ot }).then(function(e3) {
              return ft(t2, null, e3);
            });
          }).then(function(e2) {
            return e2.numFailures ? _e.reject(e2.failures[0]) : void 0;
          });
        }, vt.prototype.bulkGet = function(t2) {
          var n2 = this;
          return this._trans("readonly", function(e2) {
            return n2.core.getMany({ keys: t2, trans: e2 }).then(function(e3) {
              return e3.map(function(e4) {
                return n2.hook.reading.fire(e4);
              });
            });
          });
        }, vt.prototype.bulkAdd = function(r2, e2, t2) {
          var o2 = this, a2 = Array.isArray(e2) ? e2 : void 0, u2 = (t2 = t2 || (a2 ? void 0 : e2)) ? t2.allKeys : void 0;
          return this._trans("readwrite", function(e3) {
            var t3 = o2.schema.primKey, n2 = t3.auto, t3 = t3.keyPath;
            if (t3 && a2) throw new Y.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
            if (a2 && a2.length !== r2.length) throw new Y.InvalidArgument("Arguments objects and keys must have the same length");
            var i2 = r2.length, t3 = t3 && n2 ? r2.map(at(t3)) : r2;
            return o2.core.mutate({ trans: e3, type: "add", keys: a2, values: t3, wantResults: u2 }).then(function(e4) {
              var t4 = e4.numFailures, n3 = e4.results, r3 = e4.lastResult, e4 = e4.failures;
              if (0 === t4) return u2 ? n3 : r3;
              throw new V("".concat(o2.name, ".bulkAdd(): ").concat(t4, " of ").concat(i2, " operations failed"), e4);
            });
          });
        }, vt.prototype.bulkPut = function(r2, e2, t2) {
          var o2 = this, a2 = Array.isArray(e2) ? e2 : void 0, u2 = (t2 = t2 || (a2 ? void 0 : e2)) ? t2.allKeys : void 0;
          return this._trans("readwrite", function(e3) {
            var t3 = o2.schema.primKey, n2 = t3.auto, t3 = t3.keyPath;
            if (t3 && a2) throw new Y.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
            if (a2 && a2.length !== r2.length) throw new Y.InvalidArgument("Arguments objects and keys must have the same length");
            var i2 = r2.length, t3 = t3 && n2 ? r2.map(at(t3)) : r2;
            return o2.core.mutate({ trans: e3, type: "put", keys: a2, values: t3, wantResults: u2 }).then(function(e4) {
              var t4 = e4.numFailures, n3 = e4.results, r3 = e4.lastResult, e4 = e4.failures;
              if (0 === t4) return u2 ? n3 : r3;
              throw new V("".concat(o2.name, ".bulkPut(): ").concat(t4, " of ").concat(i2, " operations failed"), e4);
            });
          });
        }, vt.prototype.bulkUpdate = function(t2) {
          var h2 = this, n2 = this.core, r2 = t2.map(function(e2) {
            return e2.key;
          }), i2 = t2.map(function(e2) {
            return e2.changes;
          }), d2 = [];
          return this._trans("readwrite", function(e2) {
            return n2.getMany({ trans: e2, keys: r2, cache: "clone" }).then(function(c2) {
              var l2 = [], f2 = [];
              t2.forEach(function(e3, t3) {
                var n3 = e3.key, r3 = e3.changes, i3 = c2[t3];
                if (i3) {
                  for (var o2 = 0, a2 = Object.keys(r3); o2 < a2.length; o2++) {
                    var u2 = a2[o2], s3 = r3[u2];
                    if (u2 === h2.schema.primKey.keyPath) {
                      if (0 !== st(s3, n3)) throw new Y.Constraint("Cannot update primary key in bulkUpdate()");
                    } else w(i3, u2, s3);
                  }
                  d2.push(t3), l2.push(n3), f2.push(i3);
                }
              });
              var s2 = l2.length;
              return n2.mutate({ trans: e2, type: "put", keys: l2, values: f2, updates: { keys: r2, changeSpecs: i2 } }).then(function(e3) {
                var t3 = e3.numFailures, n3 = e3.failures;
                if (0 === t3) return s2;
                for (var r3 = 0, i3 = Object.keys(n3); r3 < i3.length; r3++) {
                  var o2, a2 = i3[r3], u2 = d2[Number(a2)];
                  null != u2 && (o2 = n3[a2], delete n3[a2], n3[u2] = o2);
                }
                throw new V("".concat(h2.name, ".bulkUpdate(): ").concat(t3, " of ").concat(s2, " operations failed"), n3);
              });
            });
          });
        }, vt.prototype.bulkDelete = function(t2) {
          var r2 = this, i2 = t2.length;
          return this._trans("readwrite", function(e2) {
            return r2.core.mutate({ trans: e2, type: "delete", keys: t2 }).then(function(e3) {
              return ft(r2, t2, e3);
            });
          }).then(function(e2) {
            var t3 = e2.numFailures, n2 = e2.lastResult, e2 = e2.failures;
            if (0 === t3) return n2;
            throw new V("".concat(r2.name, ".bulkDelete(): ").concat(t3, " of ").concat(i2, " operations failed"), e2);
          });
        }, vt);
        function vt() {
        }
        function mt(i2) {
          function t2(e3, t3) {
            if (t3) {
              for (var n3 = arguments.length, r2 = new Array(n3 - 1); --n3; ) r2[n3 - 1] = arguments[n3];
              return a2[e3].subscribe.apply(null, r2), i2;
            }
            if ("string" == typeof e3) return a2[e3];
          }
          var a2 = {};
          t2.addEventType = u2;
          for (var e2 = 1, n2 = arguments.length; e2 < n2; ++e2) u2(arguments[e2]);
          return t2;
          function u2(e3, n3, r2) {
            if ("object" != typeof e3) {
              var i3;
              n3 = n3 || ne;
              var o2 = { subscribers: [], fire: r2 = r2 || G, subscribe: function(e4) {
                -1 === o2.subscribers.indexOf(e4) && (o2.subscribers.push(e4), o2.fire = n3(o2.fire, e4));
              }, unsubscribe: function(t3) {
                o2.subscribers = o2.subscribers.filter(function(e4) {
                  return e4 !== t3;
                }), o2.fire = o2.subscribers.reduce(n3, r2);
              } };
              return a2[e3] = t2[e3] = o2;
            }
            O(i3 = e3).forEach(function(e4) {
              var t3 = i3[e4];
              if (x(t3)) u2(e4, i3[e4][0], i3[e4][1]);
              else {
                if ("asap" !== t3) throw new Y.InvalidArgument("Invalid event config");
                var n4 = u2(e4, X, function() {
                  for (var e5 = arguments.length, t4 = new Array(e5); e5--; ) t4[e5] = arguments[e5];
                  n4.subscribers.forEach(function(e6) {
                    v(function() {
                      e6.apply(null, t4);
                    });
                  });
                });
              }
            });
          }
        }
        function bt(e2, t2) {
          return o(t2).from({ prototype: e2 }), t2;
        }
        function gt(e2, t2) {
          return !(e2.filter || e2.algorithm || e2.or) && (t2 ? e2.justLimit : !e2.replayFilter);
        }
        function wt(e2, t2) {
          e2.filter = it(e2.filter, t2);
        }
        function _t(e2, t2, n2) {
          var r2 = e2.replayFilter;
          e2.replayFilter = r2 ? function() {
            return it(r2(), t2());
          } : t2, e2.justLimit = n2 && !r2;
        }
        function xt(e2, t2) {
          if (e2.isPrimKey) return t2.primaryKey;
          var n2 = t2.getIndexByKeyPath(e2.index);
          if (!n2) throw new Y.Schema("KeyPath " + e2.index + " on object store " + t2.name + " is not indexed");
          return n2;
        }
        function kt(e2, t2, n2) {
          var r2 = xt(e2, t2.schema);
          return t2.openCursor({ trans: n2, values: !e2.keysOnly, reverse: "prev" === e2.dir, unique: !!e2.unique, query: { index: r2, range: e2.range } });
        }
        function Ot(e2, o2, t2, n2) {
          var a2 = e2.replayFilter ? it(e2.filter, e2.replayFilter()) : e2.filter;
          if (e2.or) {
            var u2 = {}, r2 = function(e3, t3, n3) {
              var r3, i2;
              a2 && !a2(t3, n3, function(e4) {
                return t3.stop(e4);
              }, function(e4) {
                return t3.fail(e4);
              }) || ("[object ArrayBuffer]" === (i2 = "" + (r3 = t3.primaryKey)) && (i2 = "" + new Uint8Array(r3)), m(u2, i2) || (u2[i2] = true, o2(e3, t3, n3)));
            };
            return Promise.all([e2.or._iterate(r2, t2), Pt(kt(e2, n2, t2), e2.algorithm, r2, !e2.keysOnly && e2.valueMapper)]);
          }
          return Pt(kt(e2, n2, t2), it(e2.algorithm, a2), o2, !e2.keysOnly && e2.valueMapper);
        }
        function Pt(e2, r2, i2, o2) {
          var a2 = Ie(o2 ? function(e3, t2, n2) {
            return i2(o2(e3), t2, n2);
          } : i2);
          return e2.then(function(n2) {
            if (n2) return n2.start(function() {
              var t2 = function() {
                return n2.continue();
              };
              r2 && !r2(n2, function(e3) {
                return t2 = e3;
              }, function(e3) {
                n2.stop(e3), t2 = G;
              }, function(e3) {
                n2.fail(e3), t2 = G;
              }) || a2(n2.value, n2, function(e3) {
                return t2 = e3;
              }), t2();
            });
          });
        }
        var Kt = (Et.prototype._read = function(e2, t2) {
          var n2 = this._ctx;
          return n2.error ? n2.table._trans(null, Xe.bind(null, n2.error)) : n2.table._trans("readonly", e2).then(t2);
        }, Et.prototype._write = function(e2) {
          var t2 = this._ctx;
          return t2.error ? t2.table._trans(null, Xe.bind(null, t2.error)) : t2.table._trans("readwrite", e2, "locked");
        }, Et.prototype._addAlgorithm = function(e2) {
          var t2 = this._ctx;
          t2.algorithm = it(t2.algorithm, e2);
        }, Et.prototype._iterate = function(e2, t2) {
          return Ot(this._ctx, e2, t2, this._ctx.table.core);
        }, Et.prototype.clone = function(e2) {
          var t2 = Object.create(this.constructor.prototype), n2 = Object.create(this._ctx);
          return e2 && a(n2, e2), t2._ctx = n2, t2;
        }, Et.prototype.raw = function() {
          return this._ctx.valueMapper = null, this;
        }, Et.prototype.each = function(t2) {
          var n2 = this._ctx;
          return this._read(function(e2) {
            return Ot(n2, t2, e2, n2.table.core);
          });
        }, Et.prototype.count = function(e2) {
          var i2 = this;
          return this._read(function(e3) {
            var t2 = i2._ctx, n2 = t2.table.core;
            if (gt(t2, true)) return n2.count({ trans: e3, query: { index: xt(t2, n2.schema), range: t2.range } }).then(function(e4) {
              return Math.min(e4, t2.limit);
            });
            var r2 = 0;
            return Ot(t2, function() {
              return ++r2, false;
            }, e3, n2).then(function() {
              return r2;
            });
          }).then(e2);
        }, Et.prototype.sortBy = function(e2, t2) {
          var n2 = e2.split(".").reverse(), r2 = n2[0], i2 = n2.length - 1;
          function o2(e3, t3) {
            return t3 ? o2(e3[n2[t3]], t3 - 1) : e3[r2];
          }
          var a2 = "next" === this._ctx.dir ? 1 : -1;
          function u2(e3, t3) {
            return st(o2(e3, i2), o2(t3, i2)) * a2;
          }
          return this.toArray(function(e3) {
            return e3.sort(u2);
          }).then(t2);
        }, Et.prototype.toArray = function(e2) {
          var o2 = this;
          return this._read(function(e3) {
            var t2 = o2._ctx;
            if ("next" === t2.dir && gt(t2, true) && 0 < t2.limit) {
              var n2 = t2.valueMapper, r2 = xt(t2, t2.table.core.schema);
              return t2.table.core.query({ trans: e3, limit: t2.limit, values: true, query: { index: r2, range: t2.range } }).then(function(e4) {
                e4 = e4.result;
                return n2 ? e4.map(n2) : e4;
              });
            }
            var i2 = [];
            return Ot(t2, function(e4) {
              return i2.push(e4);
            }, e3, t2.table.core).then(function() {
              return i2;
            });
          }, e2);
        }, Et.prototype.offset = function(t2) {
          var e2 = this._ctx;
          return t2 <= 0 || (e2.offset += t2, gt(e2) ? _t(e2, function() {
            var n2 = t2;
            return function(e3, t3) {
              return 0 === n2 || (1 === n2 ? --n2 : t3(function() {
                e3.advance(n2), n2 = 0;
              }), false);
            };
          }) : _t(e2, function() {
            var e3 = t2;
            return function() {
              return --e3 < 0;
            };
          })), this;
        }, Et.prototype.limit = function(e2) {
          return this._ctx.limit = Math.min(this._ctx.limit, e2), _t(this._ctx, function() {
            var r2 = e2;
            return function(e3, t2, n2) {
              return --r2 <= 0 && t2(n2), 0 <= r2;
            };
          }, true), this;
        }, Et.prototype.until = function(r2, i2) {
          return wt(this._ctx, function(e2, t2, n2) {
            return !r2(e2.value) || (t2(n2), i2);
          }), this;
        }, Et.prototype.first = function(e2) {
          return this.limit(1).toArray(function(e3) {
            return e3[0];
          }).then(e2);
        }, Et.prototype.last = function(e2) {
          return this.reverse().first(e2);
        }, Et.prototype.filter = function(t2) {
          var e2;
          return wt(this._ctx, function(e3) {
            return t2(e3.value);
          }), (e2 = this._ctx).isMatch = it(e2.isMatch, t2), this;
        }, Et.prototype.and = function(e2) {
          return this.filter(e2);
        }, Et.prototype.or = function(e2) {
          return new this.db.WhereClause(this._ctx.table, e2, this);
        }, Et.prototype.reverse = function() {
          return this._ctx.dir = "prev" === this._ctx.dir ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
        }, Et.prototype.desc = function() {
          return this.reverse();
        }, Et.prototype.eachKey = function(n2) {
          var e2 = this._ctx;
          return e2.keysOnly = !e2.isMatch, this.each(function(e3, t2) {
            n2(t2.key, t2);
          });
        }, Et.prototype.eachUniqueKey = function(e2) {
          return this._ctx.unique = "unique", this.eachKey(e2);
        }, Et.prototype.eachPrimaryKey = function(n2) {
          var e2 = this._ctx;
          return e2.keysOnly = !e2.isMatch, this.each(function(e3, t2) {
            n2(t2.primaryKey, t2);
          });
        }, Et.prototype.keys = function(e2) {
          var t2 = this._ctx;
          t2.keysOnly = !t2.isMatch;
          var n2 = [];
          return this.each(function(e3, t3) {
            n2.push(t3.key);
          }).then(function() {
            return n2;
          }).then(e2);
        }, Et.prototype.primaryKeys = function(e2) {
          var n2 = this._ctx;
          if ("next" === n2.dir && gt(n2, true) && 0 < n2.limit) return this._read(function(e3) {
            var t2 = xt(n2, n2.table.core.schema);
            return n2.table.core.query({ trans: e3, values: false, limit: n2.limit, query: { index: t2, range: n2.range } });
          }).then(function(e3) {
            return e3.result;
          }).then(e2);
          n2.keysOnly = !n2.isMatch;
          var r2 = [];
          return this.each(function(e3, t2) {
            r2.push(t2.primaryKey);
          }).then(function() {
            return r2;
          }).then(e2);
        }, Et.prototype.uniqueKeys = function(e2) {
          return this._ctx.unique = "unique", this.keys(e2);
        }, Et.prototype.firstKey = function(e2) {
          return this.limit(1).keys(function(e3) {
            return e3[0];
          }).then(e2);
        }, Et.prototype.lastKey = function(e2) {
          return this.reverse().firstKey(e2);
        }, Et.prototype.distinct = function() {
          var e2 = this._ctx, e2 = e2.index && e2.table.schema.idxByName[e2.index];
          if (!e2 || !e2.multi) return this;
          var n2 = {};
          return wt(this._ctx, function(e3) {
            var t2 = e3.primaryKey.toString(), e3 = m(n2, t2);
            return n2[t2] = true, !e3;
          }), this;
        }, Et.prototype.modify = function(x2) {
          var n2 = this, k2 = this._ctx;
          return this._write(function(p2) {
            var y2 = "function" == typeof x2 ? x2 : function(e3) {
              return pt(e3, x2);
            }, v2 = k2.table.core, e2 = v2.schema.primaryKey, m2 = e2.outbound, b2 = e2.extractKey, g2 = 200, e2 = n2.db._options.modifyChunkSize;
            e2 && (g2 = "object" == typeof e2 ? e2[v2.name] || e2["*"] || 200 : e2);
            function w2(e3, t3) {
              var n3 = t3.failures, t3 = t3.numFailures;
              u2 += e3 - t3;
              for (var r2 = 0, i2 = O(n3); r2 < i2.length; r2++) {
                var o2 = i2[r2];
                a2.push(n3[o2]);
              }
            }
            var a2 = [], u2 = 0, t2 = [], _2 = x2 === St;
            return n2.clone().primaryKeys().then(function(f2) {
              function h2(s2) {
                var c2 = Math.min(g2, f2.length - s2), l2 = f2.slice(s2, s2 + c2);
                return (_2 ? Promise.resolve([]) : v2.getMany({ trans: p2, keys: l2, cache: "immutable" })).then(function(e3) {
                  var n3 = [], t3 = [], r2 = m2 ? [] : null, i2 = _2 ? l2 : [];
                  if (!_2) for (var o2 = 0; o2 < c2; ++o2) {
                    var a3 = e3[o2], u3 = { value: S(a3), primKey: f2[s2 + o2] };
                    false !== y2.call(u3, u3.value, u3) && (null == u3.value ? i2.push(f2[s2 + o2]) : m2 || 0 === st(b2(a3), b2(u3.value)) ? (t3.push(u3.value), m2 && r2.push(f2[s2 + o2])) : (i2.push(f2[s2 + o2]), n3.push(u3.value)));
                  }
                  return Promise.resolve(0 < n3.length && v2.mutate({ trans: p2, type: "add", values: n3 }).then(function(e4) {
                    for (var t4 in e4.failures) i2.splice(parseInt(t4), 1);
                    w2(n3.length, e4);
                  })).then(function() {
                    return (0 < t3.length || d2 && "object" == typeof x2) && v2.mutate({ trans: p2, type: "put", keys: r2, values: t3, criteria: d2, changeSpec: "function" != typeof x2 && x2, isAdditionalChunk: 0 < s2 }).then(function(e4) {
                      return w2(t3.length, e4);
                    });
                  }).then(function() {
                    return (0 < i2.length || d2 && _2) && v2.mutate({ trans: p2, type: "delete", keys: i2, criteria: d2, isAdditionalChunk: 0 < s2 }).then(function(e4) {
                      return ft(k2.table, i2, e4);
                    }).then(function(e4) {
                      return w2(i2.length, e4);
                    });
                  }).then(function() {
                    return f2.length > s2 + c2 && h2(s2 + g2);
                  });
                });
              }
              var d2 = gt(k2) && k2.limit === 1 / 0 && ("function" != typeof x2 || _2) && { index: k2.index, range: k2.range };
              return h2(0).then(function() {
                if (0 < a2.length) throw new U("Error modifying one or more objects", a2, u2, t2);
                return f2.length;
              });
            });
          });
        }, Et.prototype.delete = function() {
          var i2 = this._ctx, n2 = i2.range;
          return !gt(i2) || i2.table.schema.yProps || !i2.isPrimKey && 3 !== n2.type ? this.modify(St) : this._write(function(e2) {
            var t2 = i2.table.core.schema.primaryKey, r2 = n2;
            return i2.table.core.count({ trans: e2, query: { index: t2, range: r2 } }).then(function(n3) {
              return i2.table.core.mutate({ trans: e2, type: "deleteRange", range: r2 }).then(function(e3) {
                var t3 = e3.failures, e3 = e3.numFailures;
                if (e3) throw new U("Could not delete some values", Object.keys(t3).map(function(e4) {
                  return t3[e4];
                }), n3 - e3);
                return n3 - e3;
              });
            });
          });
        }, Et);
        function Et() {
        }
        var St = function(e2, t2) {
          return t2.value = null;
        };
        function jt(e2, t2) {
          return e2 < t2 ? -1 : e2 === t2 ? 0 : 1;
        }
        function At(e2, t2) {
          return t2 < e2 ? -1 : e2 === t2 ? 0 : 1;
        }
        function Ct(e2, t2, n2) {
          e2 = e2 instanceof Bt ? new e2.Collection(e2) : e2;
          return e2._ctx.error = new (n2 || TypeError)(t2), e2;
        }
        function Tt(e2) {
          return new e2.Collection(e2, function() {
            return Dt("");
          }).limit(0);
        }
        function It(e2, s2, n2, r2) {
          var i2, c2, l2, f2, h2, d2, p2, y2 = n2.length;
          if (!n2.every(function(e3) {
            return "string" == typeof e3;
          })) return Ct(e2, Ze);
          function t2(e3) {
            i2 = "next" === e3 ? function(e4) {
              return e4.toUpperCase();
            } : function(e4) {
              return e4.toLowerCase();
            }, c2 = "next" === e3 ? function(e4) {
              return e4.toLowerCase();
            } : function(e4) {
              return e4.toUpperCase();
            }, l2 = "next" === e3 ? jt : At;
            var t3 = n2.map(function(e4) {
              return { lower: c2(e4), upper: i2(e4) };
            }).sort(function(e4, t4) {
              return l2(e4.lower, t4.lower);
            });
            f2 = t3.map(function(e4) {
              return e4.upper;
            }), h2 = t3.map(function(e4) {
              return e4.lower;
            }), p2 = "next" === (d2 = e3) ? "" : r2;
          }
          t2("next");
          e2 = new e2.Collection(e2, function() {
            return qt(f2[0], h2[y2 - 1] + r2);
          });
          e2._ondirectionchange = function(e3) {
            t2(e3);
          };
          var v2 = 0;
          return e2._addAlgorithm(function(e3, t3, n3) {
            var r3 = e3.key;
            if ("string" != typeof r3) return false;
            var i3 = c2(r3);
            if (s2(i3, h2, v2)) return true;
            for (var o2 = null, a2 = v2; a2 < y2; ++a2) {
              var u2 = (function(e4, t4, n4, r4, i4, o3) {
                for (var a3 = Math.min(e4.length, r4.length), u3 = -1, s3 = 0; s3 < a3; ++s3) {
                  var c3 = t4[s3];
                  if (c3 !== r4[s3]) return i4(e4[s3], n4[s3]) < 0 ? e4.substr(0, s3) + n4[s3] + n4.substr(s3 + 1) : i4(e4[s3], r4[s3]) < 0 ? e4.substr(0, s3) + r4[s3] + n4.substr(s3 + 1) : 0 <= u3 ? e4.substr(0, u3) + t4[u3] + n4.substr(u3 + 1) : null;
                  i4(e4[s3], c3) < 0 && (u3 = s3);
                }
                return a3 < r4.length && "next" === o3 ? e4 + n4.substr(e4.length) : a3 < e4.length && "prev" === o3 ? e4.substr(0, n4.length) : u3 < 0 ? null : e4.substr(0, u3) + r4[u3] + n4.substr(u3 + 1);
              })(r3, i3, f2[a2], h2[a2], l2, d2);
              null === u2 && null === o2 ? v2 = a2 + 1 : (null === o2 || 0 < l2(o2, u2)) && (o2 = u2);
            }
            return t3(null !== o2 ? function() {
              e3.continue(o2 + p2);
            } : n3), false;
          }), e2;
        }
        function qt(e2, t2, n2, r2) {
          return { type: 2, lower: e2, upper: t2, lowerOpen: n2, upperOpen: r2 };
        }
        function Dt(e2) {
          return { type: 1, lower: e2, upper: e2 };
        }
        var Bt = (Object.defineProperty(Rt.prototype, "Collection", { get: function() {
          return this._ctx.table.db.Collection;
        }, enumerable: false, configurable: true }), Rt.prototype.between = function(e2, t2, n2, r2) {
          n2 = false !== n2, r2 = true === r2;
          try {
            return 0 < this._cmp(e2, t2) || 0 === this._cmp(e2, t2) && (n2 || r2) && (!n2 || !r2) ? Tt(this) : new this.Collection(this, function() {
              return qt(e2, t2, !n2, !r2);
            });
          } catch (e3) {
            return Ct(this, Je);
          }
        }, Rt.prototype.equals = function(e2) {
          return null == e2 ? Ct(this, Je) : new this.Collection(this, function() {
            return Dt(e2);
          });
        }, Rt.prototype.above = function(e2) {
          return null == e2 ? Ct(this, Je) : new this.Collection(this, function() {
            return qt(e2, void 0, true);
          });
        }, Rt.prototype.aboveOrEqual = function(e2) {
          return null == e2 ? Ct(this, Je) : new this.Collection(this, function() {
            return qt(e2, void 0, false);
          });
        }, Rt.prototype.below = function(e2) {
          return null == e2 ? Ct(this, Je) : new this.Collection(this, function() {
            return qt(void 0, e2, false, true);
          });
        }, Rt.prototype.belowOrEqual = function(e2) {
          return null == e2 ? Ct(this, Je) : new this.Collection(this, function() {
            return qt(void 0, e2);
          });
        }, Rt.prototype.startsWith = function(e2) {
          return "string" != typeof e2 ? Ct(this, Ze) : this.between(e2, e2 + He, true, true);
        }, Rt.prototype.startsWithIgnoreCase = function(e2) {
          return "" === e2 ? this.startsWith(e2) : It(this, function(e3, t2) {
            return 0 === e3.indexOf(t2[0]);
          }, [e2], He);
        }, Rt.prototype.equalsIgnoreCase = function(e2) {
          return It(this, function(e3, t2) {
            return e3 === t2[0];
          }, [e2], "");
        }, Rt.prototype.anyOfIgnoreCase = function() {
          var e2 = D.apply(q, arguments);
          return 0 === e2.length ? Tt(this) : It(this, function(e3, t2) {
            return -1 !== t2.indexOf(e3);
          }, e2, "");
        }, Rt.prototype.startsWithAnyOfIgnoreCase = function() {
          var e2 = D.apply(q, arguments);
          return 0 === e2.length ? Tt(this) : It(this, function(t2, e3) {
            return e3.some(function(e4) {
              return 0 === t2.indexOf(e4);
            });
          }, e2, He);
        }, Rt.prototype.anyOf = function() {
          var t2 = this, i2 = D.apply(q, arguments), o2 = this._cmp;
          try {
            i2.sort(o2);
          } catch (e3) {
            return Ct(this, Je);
          }
          if (0 === i2.length) return Tt(this);
          var e2 = new this.Collection(this, function() {
            return qt(i2[0], i2[i2.length - 1]);
          });
          e2._ondirectionchange = function(e3) {
            o2 = "next" === e3 ? t2._ascending : t2._descending, i2.sort(o2);
          };
          var a2 = 0;
          return e2._addAlgorithm(function(e3, t3, n2) {
            for (var r2 = e3.key; 0 < o2(r2, i2[a2]); ) if (++a2 === i2.length) return t3(n2), false;
            return 0 === o2(r2, i2[a2]) || (t3(function() {
              e3.continue(i2[a2]);
            }), false);
          }), e2;
        }, Rt.prototype.notEqual = function(e2) {
          return this.inAnyRange([[-1 / 0, e2], [e2, this.db._maxKey]], { includeLowers: false, includeUppers: false });
        }, Rt.prototype.noneOf = function() {
          var e2 = D.apply(q, arguments);
          if (0 === e2.length) return new this.Collection(this);
          try {
            e2.sort(this._ascending);
          } catch (e3) {
            return Ct(this, Je);
          }
          var t2 = e2.reduce(function(e3, t3) {
            return e3 ? e3.concat([[e3[e3.length - 1][1], t3]]) : [[-1 / 0, t3]];
          }, null);
          return t2.push([e2[e2.length - 1], this.db._maxKey]), this.inAnyRange(t2, { includeLowers: false, includeUppers: false });
        }, Rt.prototype.inAnyRange = function(e2, t2) {
          var o2 = this, a2 = this._cmp, u2 = this._ascending, n2 = this._descending, s2 = this._min, c2 = this._max;
          if (0 === e2.length) return Tt(this);
          if (!e2.every(function(e3) {
            return void 0 !== e3[0] && void 0 !== e3[1] && u2(e3[0], e3[1]) <= 0;
          })) return Ct(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", Y.InvalidArgument);
          var r2 = !t2 || false !== t2.includeLowers, i2 = t2 && true === t2.includeUppers;
          var l2, f2 = u2;
          function h2(e3, t3) {
            return f2(e3[0], t3[0]);
          }
          try {
            (l2 = e2.reduce(function(e3, t3) {
              for (var n3 = 0, r3 = e3.length; n3 < r3; ++n3) {
                var i3 = e3[n3];
                if (a2(t3[0], i3[1]) < 0 && 0 < a2(t3[1], i3[0])) {
                  i3[0] = s2(i3[0], t3[0]), i3[1] = c2(i3[1], t3[1]);
                  break;
                }
              }
              return n3 === r3 && e3.push(t3), e3;
            }, [])).sort(h2);
          } catch (e3) {
            return Ct(this, Je);
          }
          var d2 = 0, p2 = i2 ? function(e3) {
            return 0 < u2(e3, l2[d2][1]);
          } : function(e3) {
            return 0 <= u2(e3, l2[d2][1]);
          }, y2 = r2 ? function(e3) {
            return 0 < n2(e3, l2[d2][0]);
          } : function(e3) {
            return 0 <= n2(e3, l2[d2][0]);
          };
          var v2 = p2, e2 = new this.Collection(this, function() {
            return qt(l2[0][0], l2[l2.length - 1][1], !r2, !i2);
          });
          return e2._ondirectionchange = function(e3) {
            f2 = "next" === e3 ? (v2 = p2, u2) : (v2 = y2, n2), l2.sort(h2);
          }, e2._addAlgorithm(function(e3, t3, n3) {
            for (var r3, i3 = e3.key; v2(i3); ) if (++d2 === l2.length) return t3(n3), false;
            return !p2(r3 = i3) && !y2(r3) || (0 === o2._cmp(i3, l2[d2][1]) || 0 === o2._cmp(i3, l2[d2][0]) || t3(function() {
              f2 === u2 ? e3.continue(l2[d2][0]) : e3.continue(l2[d2][1]);
            }), false);
          }), e2;
        }, Rt.prototype.startsWithAnyOf = function() {
          var e2 = D.apply(q, arguments);
          return e2.every(function(e3) {
            return "string" == typeof e3;
          }) ? 0 === e2.length ? Tt(this) : this.inAnyRange(e2.map(function(e3) {
            return [e3, e3 + He];
          })) : Ct(this, "startsWithAnyOf() only works with strings");
        }, Rt);
        function Rt() {
        }
        function Ft(t2) {
          return Ie(function(e2) {
            return Mt(e2), t2(e2.target.error), false;
          });
        }
        function Mt(e2) {
          e2.stopPropagation && e2.stopPropagation(), e2.preventDefault && e2.preventDefault();
        }
        var Nt = "storagemutated", Lt = "x-storagemutated-1", Ut = mt(null, Nt), Vt = (zt.prototype._lock = function() {
          return y(!me.global), ++this._reculock, 1 !== this._reculock || me.global || (me.lockOwnerFor = this), this;
        }, zt.prototype._unlock = function() {
          if (y(!me.global), 0 == --this._reculock) for (me.global || (me.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked(); ) {
            var e2 = this._blockedFuncs.shift();
            try {
              $e(e2[1], e2[0]);
            } catch (e3) {
            }
          }
          return this;
        }, zt.prototype._locked = function() {
          return this._reculock && me.lockOwnerFor !== this;
        }, zt.prototype.create = function(t2) {
          var n2 = this;
          if (!this.mode) return this;
          var e2 = this.db.idbdb, r2 = this.db._state.dbOpenError;
          if (y(!this.idbtrans), !t2 && !e2) switch (r2 && r2.name) {
            case "DatabaseClosedError":
              throw new Y.DatabaseClosed(r2);
            case "MissingAPIError":
              throw new Y.MissingAPI(r2.message, r2);
            default:
              throw new Y.OpenFailed(r2);
          }
          if (!this.active) throw new Y.TransactionInactive();
          return y(null === this._completion._state), (t2 = this.idbtrans = t2 || (this.db.core || e2).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = Ie(function(e3) {
            Mt(e3), n2._reject(t2.error);
          }), t2.onabort = Ie(function(e3) {
            Mt(e3), n2.active && n2._reject(new Y.Abort(t2.error)), n2.active = false, n2.on("abort").fire(e3);
          }), t2.oncomplete = Ie(function() {
            n2.active = false, n2._resolve(), "mutatedParts" in t2 && Ut.storagemutated.fire(t2.mutatedParts);
          }), this;
        }, zt.prototype._promise = function(n2, r2, i2) {
          var o2 = this;
          if ("readwrite" === n2 && "readwrite" !== this.mode) return Xe(new Y.ReadOnly("Transaction is readonly"));
          if (!this.active) return Xe(new Y.TransactionInactive());
          if (this._locked()) return new _e(function(e3, t2) {
            o2._blockedFuncs.push([function() {
              o2._promise(n2, r2, i2).then(e3, t2);
            }, me]);
          });
          if (i2) return Ne(function() {
            var e3 = new _e(function(e4, t2) {
              o2._lock();
              var n3 = r2(e4, t2, o2);
              n3 && n3.then && n3.then(e4, t2);
            });
            return e3.finally(function() {
              return o2._unlock();
            }), e3._lib = true, e3;
          });
          var e2 = new _e(function(e3, t2) {
            var n3 = r2(e3, t2, o2);
            n3 && n3.then && n3.then(e3, t2);
          });
          return e2._lib = true, e2;
        }, zt.prototype._root = function() {
          return this.parent ? this.parent._root() : this;
        }, zt.prototype.waitFor = function(e2) {
          var t2, r2 = this._root(), i2 = _e.resolve(e2);
          r2._waitingFor ? r2._waitingFor = r2._waitingFor.then(function() {
            return i2;
          }) : (r2._waitingFor = i2, r2._waitingQueue = [], t2 = r2.idbtrans.objectStore(r2.storeNames[0]), (function e3() {
            for (++r2._spinCount; r2._waitingQueue.length; ) r2._waitingQueue.shift()();
            r2._waitingFor && (t2.get(-1 / 0).onsuccess = e3);
          })());
          var o2 = r2._waitingFor;
          return new _e(function(t3, n2) {
            i2.then(function(e3) {
              return r2._waitingQueue.push(Ie(t3.bind(null, e3)));
            }, function(e3) {
              return r2._waitingQueue.push(Ie(n2.bind(null, e3)));
            }).finally(function() {
              r2._waitingFor === o2 && (r2._waitingFor = null);
            });
          });
        }, zt.prototype.abort = function() {
          this.active && (this.active = false, this.idbtrans && this.idbtrans.abort(), this._reject(new Y.Abort()));
        }, zt.prototype.table = function(e2) {
          var t2 = this._memoizedTables || (this._memoizedTables = {});
          if (m(t2, e2)) return t2[e2];
          var n2 = this.schema[e2];
          if (!n2) throw new Y.NotFound("Table " + e2 + " not part of transaction");
          n2 = new this.db.Table(e2, n2, this);
          return n2.core = this.db.core.table(e2), t2[e2] = n2;
        }, zt);
        function zt() {
        }
        function Wt(e2, t2, n2, r2, i2, o2, a2, u2) {
          return { name: e2, keyPath: t2, unique: n2, multi: r2, auto: i2, compound: o2, src: (n2 && !a2 ? "&" : "") + (r2 ? "*" : "") + (i2 ? "++" : "") + Yt(t2), type: u2 };
        }
        function Yt(e2) {
          return "string" == typeof e2 ? e2 : e2 ? "[" + [].join.call(e2, "+") + "]" : "";
        }
        function $t(e2, t2, n2) {
          return { name: e2, primKey: t2, indexes: n2, mappedClass: null, idxByName: (r2 = function(e3) {
            return [e3.name, e3];
          }, n2.reduce(function(e3, t3, n3) {
            n3 = r2(t3, n3);
            return n3 && (e3[n3[0]] = n3[1]), e3;
          }, {})) };
          var r2;
        }
        var Qt = function(e2) {
          try {
            return e2.only([[]]), Qt = function() {
              return [[]];
            }, [[]];
          } catch (e3) {
            return Qt = function() {
              return He;
            }, He;
          }
        };
        function Gt(t2) {
          return null == t2 ? function() {
          } : "string" == typeof t2 ? 1 === (n2 = t2).split(".").length ? function(e2) {
            return e2[n2];
          } : function(e2) {
            return g(e2, n2);
          } : function(e2) {
            return g(e2, t2);
          };
          var n2;
        }
        function Xt(e2) {
          return [].slice.call(e2);
        }
        var Ht = 0;
        function Jt(e2) {
          return null == e2 ? ":id" : "string" == typeof e2 ? e2 : "[".concat(e2.join("+"), "]");
        }
        function Zt(e2, i2, t2) {
          function _2(e3) {
            if (3 === e3.type) return null;
            if (4 === e3.type) throw new Error("Cannot convert never type to IDBKeyRange");
            var t3 = e3.lower, n3 = e3.upper, r3 = e3.lowerOpen, e3 = e3.upperOpen;
            return void 0 === t3 ? void 0 === n3 ? null : i2.upperBound(n3, !!e3) : void 0 === n3 ? i2.lowerBound(t3, !!r3) : i2.bound(t3, n3, !!r3, !!e3);
          }
          function n2(e3) {
            var h2, w2 = e3.name;
            return { name: w2, schema: e3, mutate: function(e4) {
              var y2 = e4.trans, v2 = e4.type, m2 = e4.keys, b2 = e4.values, g2 = e4.range;
              return new Promise(function(t3, e5) {
                t3 = Ie(t3);
                var n3 = y2.objectStore(w2), r3 = null == n3.keyPath, i3 = "put" === v2 || "add" === v2;
                if (!i3 && "delete" !== v2 && "deleteRange" !== v2) throw new Error("Invalid operation type: " + v2);
                var o3, a3 = (m2 || b2 || { length: 1 }).length;
                if (m2 && b2 && m2.length !== b2.length) throw new Error("Given keys array must have same length as given values array.");
                if (0 === a3) return t3({ numFailures: 0, failures: {}, results: [], lastResult: void 0 });
                function u3(e6) {
                  ++l2, Mt(e6);
                }
                var s3 = [], c3 = [], l2 = 0;
                if ("deleteRange" === v2) {
                  if (4 === g2.type) return t3({ numFailures: l2, failures: c3, results: [], lastResult: void 0 });
                  3 === g2.type ? s3.push(o3 = n3.clear()) : s3.push(o3 = n3.delete(_2(g2)));
                } else {
                  var r3 = i3 ? r3 ? [b2, m2] : [b2, null] : [m2, null], f2 = r3[0], h3 = r3[1];
                  if (i3) for (var d2 = 0; d2 < a3; ++d2) s3.push(o3 = h3 && void 0 !== h3[d2] ? n3[v2](f2[d2], h3[d2]) : n3[v2](f2[d2])), o3.onerror = u3;
                  else for (d2 = 0; d2 < a3; ++d2) s3.push(o3 = n3[v2](f2[d2])), o3.onerror = u3;
                }
                function p2(e6) {
                  e6 = e6.target.result, s3.forEach(function(e7, t4) {
                    return null != e7.error && (c3[t4] = e7.error);
                  }), t3({ numFailures: l2, failures: c3, results: "delete" === v2 ? m2 : s3.map(function(e7) {
                    return e7.result;
                  }), lastResult: e6 });
                }
                o3.onerror = function(e6) {
                  u3(e6), p2(e6);
                }, o3.onsuccess = p2;
              });
            }, getMany: function(e4) {
              var f2 = e4.trans, h3 = e4.keys;
              return new Promise(function(t3, e5) {
                t3 = Ie(t3);
                for (var n3, r3 = f2.objectStore(w2), i3 = h3.length, o3 = new Array(i3), a3 = 0, u3 = 0, s3 = function(e6) {
                  e6 = e6.target;
                  o3[e6._pos] = e6.result, ++u3 === a3 && t3(o3);
                }, c3 = Ft(e5), l2 = 0; l2 < i3; ++l2) null != h3[l2] && ((n3 = r3.get(h3[l2]))._pos = l2, n3.onsuccess = s3, n3.onerror = c3, ++a3);
                0 === a3 && t3(o3);
              });
            }, get: function(e4) {
              var r3 = e4.trans, i3 = e4.key;
              return new Promise(function(t3, e5) {
                t3 = Ie(t3);
                var n3 = r3.objectStore(w2).get(i3);
                n3.onsuccess = function(e6) {
                  return t3(e6.target.result);
                }, n3.onerror = Ft(e5);
              });
            }, query: (h2 = s2, function(f2) {
              return new Promise(function(n3, e4) {
                n3 = Ie(n3);
                var r3, i3, o3, t3 = f2.trans, a3 = f2.values, u3 = f2.limit, s3 = f2.query, c3 = u3 === 1 / 0 ? void 0 : u3, l2 = s3.index, s3 = s3.range, t3 = t3.objectStore(w2), l2 = l2.isPrimaryKey ? t3 : t3.index(l2.name), s3 = _2(s3);
                if (0 === u3) return n3({ result: [] });
                h2 ? ((c3 = a3 ? l2.getAll(s3, c3) : l2.getAllKeys(s3, c3)).onsuccess = function(e5) {
                  return n3({ result: e5.target.result });
                }, c3.onerror = Ft(e4)) : (r3 = 0, i3 = !a3 && "openKeyCursor" in l2 ? l2.openKeyCursor(s3) : l2.openCursor(s3), o3 = [], i3.onsuccess = function(e5) {
                  var t4 = i3.result;
                  return t4 ? (o3.push(a3 ? t4.value : t4.primaryKey), ++r3 === u3 ? n3({ result: o3 }) : void t4.continue()) : n3({ result: o3 });
                }, i3.onerror = Ft(e4));
              });
            }), openCursor: function(e4) {
              var c3 = e4.trans, o3 = e4.values, a3 = e4.query, u3 = e4.reverse, l2 = e4.unique;
              return new Promise(function(t3, n3) {
                t3 = Ie(t3);
                var e5 = a3.index, r3 = a3.range, i3 = c3.objectStore(w2), i3 = e5.isPrimaryKey ? i3 : i3.index(e5.name), e5 = u3 ? l2 ? "prevunique" : "prev" : l2 ? "nextunique" : "next", s3 = !o3 && "openKeyCursor" in i3 ? i3.openKeyCursor(_2(r3), e5) : i3.openCursor(_2(r3), e5);
                s3.onerror = Ft(n3), s3.onsuccess = Ie(function(e6) {
                  var r4, i4, o4, a4, u4 = s3.result;
                  u4 ? (u4.___id = ++Ht, u4.done = false, r4 = u4.continue.bind(u4), i4 = (i4 = u4.continuePrimaryKey) && i4.bind(u4), o4 = u4.advance.bind(u4), a4 = function() {
                    throw new Error("Cursor not stopped");
                  }, u4.trans = c3, u4.stop = u4.continue = u4.continuePrimaryKey = u4.advance = function() {
                    throw new Error("Cursor not started");
                  }, u4.fail = Ie(n3), u4.next = function() {
                    var e7 = this, t4 = 1;
                    return this.start(function() {
                      return t4-- ? e7.continue() : e7.stop();
                    }).then(function() {
                      return e7;
                    });
                  }, u4.start = function(e7) {
                    function t4() {
                      if (s3.result) try {
                        e7();
                      } catch (e8) {
                        u4.fail(e8);
                      }
                      else u4.done = true, u4.start = function() {
                        throw new Error("Cursor behind last entry");
                      }, u4.stop();
                    }
                    var n4 = new Promise(function(t5, e8) {
                      t5 = Ie(t5), s3.onerror = Ft(e8), u4.fail = e8, u4.stop = function(e9) {
                        u4.stop = u4.continue = u4.continuePrimaryKey = u4.advance = a4, t5(e9);
                      };
                    });
                    return s3.onsuccess = Ie(function(e8) {
                      s3.onsuccess = t4, t4();
                    }), u4.continue = r4, u4.continuePrimaryKey = i4, u4.advance = o4, t4(), n4;
                  }, t3(u4)) : t3(null);
                }, n3);
              });
            }, count: function(e4) {
              var t3 = e4.query, i3 = e4.trans, o3 = t3.index, a3 = t3.range;
              return new Promise(function(t4, e5) {
                var n3 = i3.objectStore(w2), r3 = o3.isPrimaryKey ? n3 : n3.index(o3.name), n3 = _2(a3), r3 = n3 ? r3.count(n3) : r3.count();
                r3.onsuccess = Ie(function(e6) {
                  return t4(e6.target.result);
                }), r3.onerror = Ft(e5);
              });
            } };
          }
          var r2, o2, a2, u2 = (o2 = t2, a2 = Xt((r2 = e2).objectStoreNames), { schema: { name: r2.name, tables: a2.map(function(e3) {
            return o2.objectStore(e3);
          }).map(function(t3) {
            var e3 = t3.keyPath, n3 = t3.autoIncrement, r3 = x(e3), i3 = {}, n3 = { name: t3.name, primaryKey: { name: null, isPrimaryKey: true, outbound: null == e3, compound: r3, keyPath: e3, autoIncrement: n3, unique: true, extractKey: Gt(e3) }, indexes: Xt(t3.indexNames).map(function(e4) {
              return t3.index(e4);
            }).map(function(e4) {
              var t4 = e4.name, n4 = e4.unique, r4 = e4.multiEntry, e4 = e4.keyPath, r4 = { name: t4, compound: x(e4), keyPath: e4, unique: n4, multiEntry: r4, extractKey: Gt(e4) };
              return i3[Jt(e4)] = r4;
            }), getIndexByKeyPath: function(e4) {
              return i3[Jt(e4)];
            } };
            return i3[":id"] = n3.primaryKey, null != e3 && (i3[Jt(e3)] = n3.primaryKey), n3;
          }) }, hasGetAll: 0 < a2.length && "getAll" in o2.objectStore(a2[0]) && !("undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604) }), t2 = u2.schema, s2 = u2.hasGetAll, u2 = t2.tables.map(n2), c2 = {};
          return u2.forEach(function(e3) {
            return c2[e3.name] = e3;
          }), { stack: "dbcore", transaction: e2.transaction.bind(e2), table: function(e3) {
            if (!c2[e3]) throw new Error("Table '".concat(e3, "' not found"));
            return c2[e3];
          }, MIN_KEY: -1 / 0, MAX_KEY: Qt(i2), schema: t2 };
        }
        function en(e2, t2, n2, r2) {
          var i2 = n2.IDBKeyRange;
          return n2.indexedDB, { dbcore: (r2 = Zt(t2, i2, r2), e2.dbcore.reduce(function(e3, t3) {
            t3 = t3.create;
            return _(_({}, e3), t3(e3));
          }, r2)) };
        }
        function tn(n2, e2) {
          var t2 = e2.db, e2 = en(n2._middlewares, t2, n2._deps, e2);
          n2.core = e2.dbcore, n2.tables.forEach(function(e3) {
            var t3 = e3.name;
            n2.core.schema.tables.some(function(e4) {
              return e4.name === t3;
            }) && (e3.core = n2.core.table(t3), n2[t3] instanceof n2.Table && (n2[t3].core = e3.core));
          });
        }
        function nn(i2, e2, t2, o2) {
          t2.forEach(function(n2) {
            var r2 = o2[n2];
            e2.forEach(function(e3) {
              var t3 = (function e4(t4, n3) {
                return h(t4, n3) || (t4 = c(t4)) && e4(t4, n3);
              })(e3, n2);
              (!t3 || "value" in t3 && void 0 === t3.value) && (e3 === i2.Transaction.prototype || e3 instanceof i2.Transaction ? l(e3, n2, { get: function() {
                return this.table(n2);
              }, set: function(e4) {
                u(this, n2, { value: e4, writable: true, configurable: true, enumerable: true });
              } }) : e3[n2] = new i2.Table(n2, r2));
            });
          });
        }
        function rn(n2, e2) {
          e2.forEach(function(e3) {
            for (var t2 in e3) e3[t2] instanceof n2.Table && delete e3[t2];
          });
        }
        function on(e2, t2) {
          return e2._cfg.version - t2._cfg.version;
        }
        function an(n2, r2, i2, e2) {
          var o2 = n2._dbSchema;
          i2.objectStoreNames.contains("$meta") && !o2.$meta && (o2.$meta = $t("$meta", pn("")[0], []), n2._storeNames.push("$meta"));
          var a2 = n2._createTransaction("readwrite", n2._storeNames, o2);
          a2.create(i2), a2._completion.catch(e2);
          var u2 = a2._reject.bind(a2), s2 = me.transless || me;
          Ne(function() {
            return me.trans = a2, me.transless = s2, 0 !== r2 ? (tn(n2, i2), t2 = r2, ((e3 = a2).storeNames.includes("$meta") ? e3.table("$meta").get("version").then(function(e4) {
              return null != e4 ? e4 : t2;
            }) : _e.resolve(t2)).then(function(e4) {
              return c2 = e4, l2 = a2, f2 = i2, t3 = [], e4 = (s3 = n2)._versions, h2 = s3._dbSchema = hn(0, s3.idbdb, f2), 0 !== (e4 = e4.filter(function(e5) {
                return e5._cfg.version >= c2;
              })).length ? (e4.forEach(function(u3) {
                t3.push(function() {
                  var t4 = h2, e5 = u3._cfg.dbschema;
                  dn(s3, t4, f2), dn(s3, e5, f2), h2 = s3._dbSchema = e5;
                  var n3 = sn(t4, e5);
                  n3.add.forEach(function(e6) {
                    cn(f2, e6[0], e6[1].primKey, e6[1].indexes);
                  }), n3.change.forEach(function(e6) {
                    if (e6.recreate) throw new Y.Upgrade("Not yet support for changing primary key");
                    var t5 = f2.objectStore(e6.name);
                    e6.add.forEach(function(e7) {
                      return fn(t5, e7);
                    }), e6.change.forEach(function(e7) {
                      t5.deleteIndex(e7.name), fn(t5, e7);
                    }), e6.del.forEach(function(e7) {
                      return t5.deleteIndex(e7);
                    });
                  });
                  var r3 = u3._cfg.contentUpgrade;
                  if (r3 && u3._cfg.version > c2) {
                    tn(s3, f2), l2._memoizedTables = {};
                    var i3 = k(e5);
                    n3.del.forEach(function(e6) {
                      i3[e6] = t4[e6];
                    }), rn(s3, [s3.Transaction.prototype]), nn(s3, [s3.Transaction.prototype], O(i3), i3), l2.schema = i3;
                    var o3, a3 = B(r3);
                    a3 && Le();
                    n3 = _e.follow(function() {
                      var e6;
                      (o3 = r3(l2)) && a3 && (e6 = Ue.bind(null, null), o3.then(e6, e6));
                    });
                    return o3 && "function" == typeof o3.then ? _e.resolve(o3) : n3.then(function() {
                      return o3;
                    });
                  }
                }), t3.push(function(e5) {
                  var t4, n3, r3 = u3._cfg.dbschema;
                  t4 = r3, n3 = e5, [].slice.call(n3.db.objectStoreNames).forEach(function(e6) {
                    return null == t4[e6] && n3.db.deleteObjectStore(e6);
                  }), rn(s3, [s3.Transaction.prototype]), nn(s3, [s3.Transaction.prototype], s3._storeNames, s3._dbSchema), l2.schema = s3._dbSchema;
                }), t3.push(function(e5) {
                  s3.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(s3.idbdb.version / 10) === u3._cfg.version ? (s3.idbdb.deleteObjectStore("$meta"), delete s3._dbSchema.$meta, s3._storeNames = s3._storeNames.filter(function(e6) {
                    return "$meta" !== e6;
                  })) : e5.objectStore("$meta").put(u3._cfg.version, "version"));
                });
              }), (function e5() {
                return t3.length ? _e.resolve(t3.shift()(l2.idbtrans)).then(e5) : _e.resolve();
              })().then(function() {
                ln(h2, f2);
              })) : _e.resolve();
              var s3, c2, l2, f2, t3, h2;
            }).catch(u2)) : (O(o2).forEach(function(e4) {
              cn(i2, e4, o2[e4].primKey, o2[e4].indexes);
            }), tn(n2, i2), void _e.follow(function() {
              return n2.on.populate.fire(a2);
            }).catch(u2));
            var e3, t2;
          });
        }
        function un(e2, r2) {
          ln(e2._dbSchema, r2), r2.db.version % 10 != 0 || r2.objectStoreNames.contains("$meta") || r2.db.createObjectStore("$meta").add(Math.ceil(r2.db.version / 10 - 1), "version");
          var t2 = hn(0, e2.idbdb, r2);
          dn(e2, e2._dbSchema, r2);
          for (var n2 = 0, i2 = sn(t2, e2._dbSchema).change; n2 < i2.length; n2++) {
            var o2 = (function(t3) {
              if (t3.change.length || t3.recreate) return console.warn("Unable to patch indexes of table ".concat(t3.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
              var n3 = r2.objectStore(t3.name);
              t3.add.forEach(function(e3) {
                ie && console.debug("Dexie upgrade patch: Creating missing index ".concat(t3.name, ".").concat(e3.src)), fn(n3, e3);
              });
            })(i2[n2]);
            if ("object" == typeof o2) return o2.value;
          }
        }
        function sn(e2, t2) {
          var n2, r2 = { del: [], add: [], change: [] };
          for (n2 in e2) t2[n2] || r2.del.push(n2);
          for (n2 in t2) {
            var i2 = e2[n2], o2 = t2[n2];
            if (i2) {
              var a2 = { name: n2, def: o2, recreate: false, del: [], add: [], change: [] };
              if ("" + (i2.primKey.keyPath || "") != "" + (o2.primKey.keyPath || "") || i2.primKey.auto !== o2.primKey.auto) a2.recreate = true, r2.change.push(a2);
              else {
                var u2 = i2.idxByName, s2 = o2.idxByName, c2 = void 0;
                for (c2 in u2) s2[c2] || a2.del.push(c2);
                for (c2 in s2) {
                  var l2 = u2[c2], f2 = s2[c2];
                  l2 ? l2.src !== f2.src && a2.change.push(f2) : a2.add.push(f2);
                }
                (0 < a2.del.length || 0 < a2.add.length || 0 < a2.change.length) && r2.change.push(a2);
              }
            } else r2.add.push([n2, o2]);
          }
          return r2;
        }
        function cn(e2, t2, n2, r2) {
          var i2 = e2.db.createObjectStore(t2, n2.keyPath ? { keyPath: n2.keyPath, autoIncrement: n2.auto } : { autoIncrement: n2.auto });
          return r2.forEach(function(e3) {
            return fn(i2, e3);
          }), i2;
        }
        function ln(t2, n2) {
          O(t2).forEach(function(e2) {
            n2.db.objectStoreNames.contains(e2) || (ie && console.debug("Dexie: Creating missing table", e2), cn(n2, e2, t2[e2].primKey, t2[e2].indexes));
          });
        }
        function fn(e2, t2) {
          e2.createIndex(t2.name, t2.keyPath, { unique: t2.unique, multiEntry: t2.multi });
        }
        function hn(e2, t2, u2) {
          var s2 = {};
          return b(t2.objectStoreNames, 0).forEach(function(e3) {
            for (var t3 = u2.objectStore(e3), n2 = Wt(Yt(a2 = t3.keyPath), a2 || "", true, false, !!t3.autoIncrement, a2 && "string" != typeof a2, true), r2 = [], i2 = 0; i2 < t3.indexNames.length; ++i2) {
              var o2 = t3.index(t3.indexNames[i2]), a2 = o2.keyPath, o2 = Wt(o2.name, a2, !!o2.unique, !!o2.multiEntry, false, a2 && "string" != typeof a2, false);
              r2.push(o2);
            }
            s2[e3] = $t(e3, n2, r2);
          }), s2;
        }
        function dn(e2, t2, n2) {
          for (var r2 = n2.db.objectStoreNames, i2 = 0; i2 < r2.length; ++i2) {
            var o2 = r2[i2], a2 = n2.objectStore(o2);
            e2._hasGetAll = "getAll" in a2;
            for (var u2 = 0; u2 < a2.indexNames.length; ++u2) {
              var s2 = a2.indexNames[u2], c2 = a2.index(s2).keyPath, l2 = "string" == typeof c2 ? c2 : "[" + b(c2).join("+") + "]";
              !t2[o2] || (c2 = t2[o2].idxByName[l2]) && (c2.name = s2, delete t2[o2].idxByName[l2], t2[o2].idxByName[s2] = c2);
            }
          }
          "undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && f.WorkerGlobalScope && f instanceof f.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e2._hasGetAll = false);
        }
        function pn(e2) {
          return e2.split(",").map(function(e3, t2) {
            var n2 = e3.split(":"), r2 = null === (i2 = n2[1]) || void 0 === i2 ? void 0 : i2.trim(), i2 = (e3 = n2[0].trim()).replace(/([&*]|\+\+)/g, ""), n2 = /^\[/.test(i2) ? i2.match(/^\[(.*)\]$/)[1].split("+") : i2;
            return Wt(i2, n2 || null, /\&/.test(e3), /\*/.test(e3), /\+\+/.test(e3), x(n2), 0 === t2, r2);
          });
        }
        var yn = (vn.prototype._createTableSchema = $t, vn.prototype._parseIndexSyntax = pn, vn.prototype._parseStoresSpec = function(r2, i2) {
          var o2 = this;
          O(r2).forEach(function(e2) {
            if (null !== r2[e2]) {
              var t2 = o2._parseIndexSyntax(r2[e2]), n2 = t2.shift();
              if (!n2) throw new Y.Schema("Invalid schema for table " + e2 + ": " + r2[e2]);
              if (n2.unique = true, n2.multi) throw new Y.Schema("Primary key cannot be multiEntry*");
              t2.forEach(function(e3) {
                if (e3.auto) throw new Y.Schema("Only primary key can be marked as autoIncrement (++)");
                if (!e3.keyPath) throw new Y.Schema("Index must have a name and cannot be an empty string");
              });
              t2 = o2._createTableSchema(e2, n2, t2);
              i2[e2] = t2;
            }
          });
        }, vn.prototype.stores = function(e2) {
          var t2 = this.db;
          this._cfg.storesSource = this._cfg.storesSource ? a(this._cfg.storesSource, e2) : e2;
          var e2 = t2._versions, n2 = {}, r2 = {};
          return e2.forEach(function(e3) {
            a(n2, e3._cfg.storesSource), r2 = e3._cfg.dbschema = {}, e3._parseStoresSpec(n2, r2);
          }), t2._dbSchema = r2, rn(t2, [t2._allTables, t2, t2.Transaction.prototype]), nn(t2, [t2._allTables, t2, t2.Transaction.prototype, this._cfg.tables], O(r2), r2), t2._storeNames = O(r2), this;
        }, vn.prototype.upgrade = function(e2) {
          return this._cfg.contentUpgrade = re(this._cfg.contentUpgrade || G, e2), this;
        }, vn);
        function vn() {
        }
        function mn(e2, t2) {
          var n2 = e2._dbNamesDB;
          return n2 || (n2 = e2._dbNamesDB = new nr(tt, { addons: [], indexedDB: e2, IDBKeyRange: t2 })).version(1).stores({ dbnames: "name" }), n2.table("dbnames");
        }
        function bn(e2) {
          return e2 && "function" == typeof e2.databases;
        }
        function gn(e2) {
          return Ne(function() {
            return me.letThrough = true, e2();
          });
        }
        function wn(e2) {
          return !("from" in e2);
        }
        var _n = function(e2, t2) {
          if (!this) {
            var n2 = new _n();
            return e2 && "d" in e2 && a(n2, e2), n2;
          }
          a(this, arguments.length ? { d: 1, from: e2, to: 1 < arguments.length ? t2 : e2 } : { d: 0 });
        };
        function xn(e2, t2, n2) {
          var r2 = st(t2, n2);
          if (!isNaN(r2)) {
            if (0 < r2) throw RangeError();
            if (wn(e2)) return a(e2, { from: t2, to: n2, d: 1 });
            var i2 = e2.l, r2 = e2.r;
            if (st(n2, e2.from) < 0) return i2 ? xn(i2, t2, n2) : e2.l = { from: t2, to: n2, d: 1, l: null, r: null }, Kn(e2);
            if (0 < st(t2, e2.to)) return r2 ? xn(r2, t2, n2) : e2.r = { from: t2, to: n2, d: 1, l: null, r: null }, Kn(e2);
            st(t2, e2.from) < 0 && (e2.from = t2, e2.l = null, e2.d = r2 ? r2.d + 1 : 1), 0 < st(n2, e2.to) && (e2.to = n2, e2.r = null, e2.d = e2.l ? e2.l.d + 1 : 1);
            n2 = !e2.r;
            i2 && !e2.l && kn(e2, i2), r2 && n2 && kn(e2, r2);
          }
        }
        function kn(e2, t2) {
          wn(t2) || (function e3(t3, n2) {
            var r2 = n2.from, i2 = n2.to, o2 = n2.l, n2 = n2.r;
            xn(t3, r2, i2), o2 && e3(t3, o2), n2 && e3(t3, n2);
          })(e2, t2);
        }
        function On(e2, t2) {
          var n2 = Pn(t2), r2 = n2.next();
          if (r2.done) return false;
          for (var i2 = r2.value, o2 = Pn(e2), a2 = o2.next(i2.from), u2 = a2.value; !r2.done && !a2.done; ) {
            if (st(u2.from, i2.to) <= 0 && 0 <= st(u2.to, i2.from)) return true;
            st(i2.from, u2.from) < 0 ? i2 = (r2 = n2.next(u2.from)).value : u2 = (a2 = o2.next(i2.from)).value;
          }
          return false;
        }
        function Pn(e2) {
          var n2 = wn(e2) ? null : { s: 0, n: e2 };
          return { next: function(e3) {
            for (var t2 = 0 < arguments.length; n2; ) switch (n2.s) {
              case 0:
                if (n2.s = 1, t2) for (; n2.n.l && st(e3, n2.n.from) < 0; ) n2 = { up: n2, n: n2.n.l, s: 1 };
                else for (; n2.n.l; ) n2 = { up: n2, n: n2.n.l, s: 1 };
              case 1:
                if (n2.s = 2, !t2 || st(e3, n2.n.to) <= 0) return { value: n2.n, done: false };
              case 2:
                if (n2.n.r) {
                  n2.s = 3, n2 = { up: n2, n: n2.n.r, s: 0 };
                  continue;
                }
              case 3:
                n2 = n2.up;
            }
            return { done: true };
          } };
        }
        function Kn(e2) {
          var t2, n2, r2 = ((null === (t2 = e2.r) || void 0 === t2 ? void 0 : t2.d) || 0) - ((null === (n2 = e2.l) || void 0 === n2 ? void 0 : n2.d) || 0), i2 = 1 < r2 ? "r" : r2 < -1 ? "l" : "";
          i2 && (t2 = "r" == i2 ? "l" : "r", n2 = _({}, e2), r2 = e2[i2], e2.from = r2.from, e2.to = r2.to, e2[i2] = r2[i2], n2[i2] = r2[t2], (e2[t2] = n2).d = En(n2)), e2.d = En(e2);
        }
        function En(e2) {
          var t2 = e2.r, e2 = e2.l;
          return (t2 ? e2 ? Math.max(t2.d, e2.d) : t2.d : e2 ? e2.d : 0) + 1;
        }
        function Sn(t2, n2) {
          return O(n2).forEach(function(e2) {
            t2[e2] ? kn(t2[e2], n2[e2]) : t2[e2] = (function e3(t3) {
              var n3, r2, i2 = {};
              for (n3 in t3) m(t3, n3) && (r2 = t3[n3], i2[n3] = !r2 || "object" != typeof r2 || K.has(r2.constructor) ? r2 : e3(r2));
              return i2;
            })(n2[e2]);
          }), t2;
        }
        function jn(t2, n2) {
          return t2.all || n2.all || Object.keys(t2).some(function(e2) {
            return n2[e2] && On(n2[e2], t2[e2]);
          });
        }
        r(_n.prototype, ((F = { add: function(e2) {
          return kn(this, e2), this;
        }, addKey: function(e2) {
          return xn(this, e2, e2), this;
        }, addKeys: function(e2) {
          var t2 = this;
          return e2.forEach(function(e3) {
            return xn(t2, e3, e3);
          }), this;
        }, hasKey: function(e2) {
          var t2 = Pn(this).next(e2).value;
          return t2 && st(t2.from, e2) <= 0 && 0 <= st(t2.to, e2);
        } })[C] = function() {
          return Pn(this);
        }, F));
        var An = {}, Cn = {}, Tn = false;
        function In(e2) {
          Sn(Cn, e2), Tn || (Tn = true, setTimeout(function() {
            Tn = false, qn(Cn, !(Cn = {}));
          }, 0));
        }
        function qn(e2, t2) {
          void 0 === t2 && (t2 = false);
          var n2 = /* @__PURE__ */ new Set();
          if (e2.all) for (var r2 = 0, i2 = Object.values(An); r2 < i2.length; r2++) Dn(a2 = i2[r2], e2, n2, t2);
          else for (var o2 in e2) {
            var a2, u2 = /^idb\:\/\/(.*)\/(.*)\//.exec(o2);
            u2 && (o2 = u2[1], u2 = u2[2], (a2 = An["idb://".concat(o2, "/").concat(u2)]) && Dn(a2, e2, n2, t2));
          }
          n2.forEach(function(e3) {
            return e3();
          });
        }
        function Dn(e2, t2, n2, r2) {
          for (var i2 = [], o2 = 0, a2 = Object.entries(e2.queries.query); o2 < a2.length; o2++) {
            for (var u2 = a2[o2], s2 = u2[0], c2 = [], l2 = 0, f2 = u2[1]; l2 < f2.length; l2++) {
              var h2 = f2[l2];
              jn(t2, h2.obsSet) ? h2.subscribers.forEach(function(e3) {
                return n2.add(e3);
              }) : r2 && c2.push(h2);
            }
            r2 && i2.push([s2, c2]);
          }
          if (r2) for (var d2 = 0, p2 = i2; d2 < p2.length; d2++) {
            var y2 = p2[d2], s2 = y2[0], c2 = y2[1];
            e2.queries.query[s2] = c2;
          }
        }
        function Bn(f2) {
          var h2 = f2._state, r2 = f2._deps.indexedDB;
          if (h2.isBeingOpened || f2.idbdb) return h2.dbReadyPromise.then(function() {
            return h2.dbOpenError ? Xe(h2.dbOpenError) : f2;
          });
          h2.isBeingOpened = true, h2.dbOpenError = null, h2.openComplete = false;
          var t2 = h2.openCanceller, d2 = Math.round(10 * f2.verno), p2 = false;
          function e2() {
            if (h2.openCanceller !== t2) throw new Y.DatabaseClosed("db.open() was cancelled");
          }
          function y2() {
            return new _e(function(s2, n3) {
              if (e2(), !r2) throw new Y.MissingAPI();
              var c2 = f2.name, l2 = h2.autoSchema || !d2 ? r2.open(c2) : r2.open(c2, d2);
              if (!l2) throw new Y.MissingAPI();
              l2.onerror = Ft(n3), l2.onblocked = Ie(f2._fireOnBlocked), l2.onupgradeneeded = Ie(function(e3) {
                var t3;
                v2 = l2.transaction, h2.autoSchema && !f2._options.allowEmptyDB ? (l2.onerror = Mt, v2.abort(), l2.result.close(), (t3 = r2.deleteDatabase(c2)).onsuccess = t3.onerror = Ie(function() {
                  n3(new Y.NoSuchDatabase("Database ".concat(c2, " doesnt exist")));
                })) : (v2.onerror = Ft(n3), e3 = e3.oldVersion > Math.pow(2, 62) ? 0 : e3.oldVersion, m2 = e3 < 1, f2.idbdb = l2.result, p2 && un(f2, v2), an(f2, e3 / 10, v2, n3));
              }, n3), l2.onsuccess = Ie(function() {
                v2 = null;
                var e3, t3, n4, r3, i3, o2 = f2.idbdb = l2.result, a2 = b(o2.objectStoreNames);
                if (0 < a2.length) try {
                  var u2 = o2.transaction(1 === (r3 = a2).length ? r3[0] : r3, "readonly");
                  if (h2.autoSchema) t3 = o2, n4 = u2, (e3 = f2).verno = t3.version / 10, n4 = e3._dbSchema = hn(0, t3, n4), e3._storeNames = b(t3.objectStoreNames, 0), nn(e3, [e3._allTables], O(n4), n4);
                  else if (dn(f2, f2._dbSchema, u2), ((i3 = sn(hn(0, (i3 = f2).idbdb, u2), i3._dbSchema)).add.length || i3.change.some(function(e4) {
                    return e4.add.length || e4.change.length;
                  })) && !p2) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), o2.close(), d2 = o2.version + 1, p2 = true, s2(y2());
                  tn(f2, u2);
                } catch (e4) {
                }
                et.push(f2), o2.onversionchange = Ie(function(e4) {
                  h2.vcFired = true, f2.on("versionchange").fire(e4);
                }), o2.onclose = Ie(function() {
                  f2.close({ disableAutoOpen: false });
                }), m2 && (i3 = f2._deps, u2 = c2, o2 = i3.indexedDB, i3 = i3.IDBKeyRange, bn(o2) || u2 === tt || mn(o2, i3).put({ name: u2 }).catch(G)), s2();
              }, n3);
            }).catch(function(e3) {
              switch (null == e3 ? void 0 : e3.name) {
                case "UnknownError":
                  if (0 < h2.PR1398_maxLoop) return h2.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), y2();
                  break;
                case "VersionError":
                  if (0 < d2) return d2 = 0, y2();
              }
              return _e.reject(e3);
            });
          }
          var n2, i2 = h2.dbReadyResolve, v2 = null, m2 = false;
          return _e.race([t2, ("undefined" == typeof navigator ? _e.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(e3) {
            function t3() {
              return indexedDB.databases().finally(e3);
            }
            n2 = setInterval(t3, 100), t3();
          }).finally(function() {
            return clearInterval(n2);
          }) : Promise.resolve()).then(y2)]).then(function() {
            return e2(), h2.onReadyBeingFired = [], _e.resolve(gn(function() {
              return f2.on.ready.fire(f2.vip);
            })).then(function e3() {
              if (0 < h2.onReadyBeingFired.length) {
                var t3 = h2.onReadyBeingFired.reduce(re, G);
                return h2.onReadyBeingFired = [], _e.resolve(gn(function() {
                  return t3(f2.vip);
                })).then(e3);
              }
            });
          }).finally(function() {
            h2.openCanceller === t2 && (h2.onReadyBeingFired = null, h2.isBeingOpened = false);
          }).catch(function(e3) {
            h2.dbOpenError = e3;
            try {
              v2 && v2.abort();
            } catch (e4) {
            }
            return t2 === h2.openCanceller && f2._close(), Xe(e3);
          }).finally(function() {
            h2.openComplete = true, i2();
          }).then(function() {
            var n3;
            return m2 && (n3 = {}, f2.tables.forEach(function(t3) {
              t3.schema.indexes.forEach(function(e3) {
                e3.name && (n3["idb://".concat(f2.name, "/").concat(t3.name, "/").concat(e3.name)] = new _n(-1 / 0, [[[]]]));
              }), n3["idb://".concat(f2.name, "/").concat(t3.name, "/")] = n3["idb://".concat(f2.name, "/").concat(t3.name, "/:dels")] = new _n(-1 / 0, [[[]]]);
            }), Ut(Nt).fire(n3), qn(n3, true)), f2;
          });
        }
        function Rn(t2) {
          function e2(e3) {
            return t2.next(e3);
          }
          var r2 = n2(e2), i2 = n2(function(e3) {
            return t2.throw(e3);
          });
          function n2(n3) {
            return function(e3) {
              var t3 = n3(e3), e3 = t3.value;
              return t3.done ? e3 : e3 && "function" == typeof e3.then ? e3.then(r2, i2) : x(e3) ? Promise.all(e3).then(r2, i2) : r2(e3);
            };
          }
          return n2(e2)();
        }
        function Fn(e2, t2, n2) {
          for (var r2 = x(e2) ? e2.slice() : [e2], i2 = 0; i2 < n2; ++i2) r2.push(t2);
          return r2;
        }
        var Mn = { stack: "dbcore", name: "VirtualIndexMiddleware", level: 1, create: function(f2) {
          return _(_({}, f2), { table: function(e2) {
            var a2 = f2.table(e2), t2 = a2.schema, u2 = {}, s2 = [];
            function c2(e3, t3, n3) {
              var r3 = Jt(e3), i3 = u2[r3] = u2[r3] || [], o2 = null == e3 ? 0 : "string" == typeof e3 ? 1 : e3.length, a3 = 0 < t3, a3 = _(_({}, n3), { name: a3 ? "".concat(r3, "(virtual-from:").concat(n3.name, ")") : n3.name, lowLevelIndex: n3, isVirtual: a3, keyTail: t3, keyLength: o2, extractKey: Gt(e3), unique: !a3 && n3.unique });
              return i3.push(a3), a3.isPrimaryKey || s2.push(a3), 1 < o2 && c2(2 === o2 ? e3[0] : e3.slice(0, o2 - 1), t3 + 1, n3), i3.sort(function(e4, t4) {
                return e4.keyTail - t4.keyTail;
              }), a3;
            }
            e2 = c2(t2.primaryKey.keyPath, 0, t2.primaryKey);
            u2[":id"] = [e2];
            for (var n2 = 0, r2 = t2.indexes; n2 < r2.length; n2++) {
              var i2 = r2[n2];
              c2(i2.keyPath, 0, i2);
            }
            function l2(e3) {
              var t3, n3 = e3.query.index;
              return n3.isVirtual ? _(_({}, e3), { query: { index: n3.lowLevelIndex, range: (t3 = e3.query.range, n3 = n3.keyTail, { type: 1 === t3.type ? 2 : t3.type, lower: Fn(t3.lower, t3.lowerOpen ? f2.MAX_KEY : f2.MIN_KEY, n3), lowerOpen: true, upper: Fn(t3.upper, t3.upperOpen ? f2.MIN_KEY : f2.MAX_KEY, n3), upperOpen: true }) } }) : e3;
            }
            return _(_({}, a2), { schema: _(_({}, t2), { primaryKey: e2, indexes: s2, getIndexByKeyPath: function(e3) {
              return (e3 = u2[Jt(e3)]) && e3[0];
            } }), count: function(e3) {
              return a2.count(l2(e3));
            }, query: function(e3) {
              return a2.query(l2(e3));
            }, openCursor: function(t3) {
              var e3 = t3.query.index, r3 = e3.keyTail, n3 = e3.isVirtual, i3 = e3.keyLength;
              return n3 ? a2.openCursor(l2(t3)).then(function(e4) {
                return e4 && o2(e4);
              }) : a2.openCursor(t3);
              function o2(n4) {
                return Object.create(n4, { continue: { value: function(e4) {
                  null != e4 ? n4.continue(Fn(e4, t3.reverse ? f2.MAX_KEY : f2.MIN_KEY, r3)) : t3.unique ? n4.continue(n4.key.slice(0, i3).concat(t3.reverse ? f2.MIN_KEY : f2.MAX_KEY, r3)) : n4.continue();
                } }, continuePrimaryKey: { value: function(e4, t4) {
                  n4.continuePrimaryKey(Fn(e4, f2.MAX_KEY, r3), t4);
                } }, primaryKey: { get: function() {
                  return n4.primaryKey;
                } }, key: { get: function() {
                  var e4 = n4.key;
                  return 1 === i3 ? e4[0] : e4.slice(0, i3);
                } }, value: { get: function() {
                  return n4.value;
                } } });
              }
            } });
          } });
        } };
        function Nn(i2, o2, a2, u2) {
          return a2 = a2 || {}, u2 = u2 || "", O(i2).forEach(function(e2) {
            var t2, n2, r2;
            m(o2, e2) ? (t2 = i2[e2], n2 = o2[e2], "object" == typeof t2 && "object" == typeof n2 && t2 && n2 ? (r2 = A(t2)) !== A(n2) ? a2[u2 + e2] = o2[e2] : "Object" === r2 ? Nn(t2, n2, a2, u2 + e2 + ".") : t2 !== n2 && (a2[u2 + e2] = o2[e2]) : t2 !== n2 && (a2[u2 + e2] = o2[e2])) : a2[u2 + e2] = void 0;
          }), O(o2).forEach(function(e2) {
            m(i2, e2) || (a2[u2 + e2] = o2[e2]);
          }), a2;
        }
        function Ln(e2, t2) {
          return "delete" === t2.type ? t2.keys : t2.keys || t2.values.map(e2.extractKey);
        }
        var Un = { stack: "dbcore", name: "HooksMiddleware", level: 2, create: function(e2) {
          return _(_({}, e2), { table: function(r2) {
            var y2 = e2.table(r2), v2 = y2.schema.primaryKey;
            return _(_({}, y2), { mutate: function(e3) {
              var t2 = me.trans, n2 = t2.table(r2).hook, h2 = n2.deleting, d2 = n2.creating, p2 = n2.updating;
              switch (e3.type) {
                case "add":
                  if (d2.fire === G) break;
                  return t2._promise("readwrite", function() {
                    return a2(e3);
                  }, true);
                case "put":
                  if (d2.fire === G && p2.fire === G) break;
                  return t2._promise("readwrite", function() {
                    return a2(e3);
                  }, true);
                case "delete":
                  if (h2.fire === G) break;
                  return t2._promise("readwrite", function() {
                    return a2(e3);
                  }, true);
                case "deleteRange":
                  if (h2.fire === G) break;
                  return t2._promise("readwrite", function() {
                    return (function n3(r3, i2, o2) {
                      return y2.query({ trans: r3, values: false, query: { index: v2, range: i2 }, limit: o2 }).then(function(e4) {
                        var t3 = e4.result;
                        return a2({ type: "delete", keys: t3, trans: r3 }).then(function(e5) {
                          return 0 < e5.numFailures ? Promise.reject(e5.failures[0]) : t3.length < o2 ? { failures: [], numFailures: 0, lastResult: void 0 } : n3(r3, _(_({}, i2), { lower: t3[t3.length - 1], lowerOpen: true }), o2);
                        });
                      });
                    })(e3.trans, e3.range, 1e4);
                  }, true);
              }
              return y2.mutate(e3);
              function a2(c2) {
                var e4, t3, n3, l2 = me.trans, f2 = c2.keys || Ln(v2, c2);
                if (!f2) throw new Error("Keys missing");
                return "delete" !== (c2 = "add" === c2.type || "put" === c2.type ? _(_({}, c2), { keys: f2 }) : _({}, c2)).type && (c2.values = i([], c2.values)), c2.keys && (c2.keys = i([], c2.keys)), e4 = y2, n3 = f2, ("add" === (t3 = c2).type ? Promise.resolve([]) : e4.getMany({ trans: t3.trans, keys: n3, cache: "immutable" })).then(function(u2) {
                  var s2 = f2.map(function(e5, t4) {
                    var n4, r3, i2, o2 = u2[t4], a3 = { onerror: null, onsuccess: null };
                    return "delete" === c2.type ? h2.fire.call(a3, e5, o2, l2) : "add" === c2.type || void 0 === o2 ? (n4 = d2.fire.call(a3, e5, c2.values[t4], l2), null == e5 && null != n4 && (c2.keys[t4] = e5 = n4, v2.outbound || w(c2.values[t4], v2.keyPath, e5))) : (n4 = Nn(o2, c2.values[t4]), (r3 = p2.fire.call(a3, n4, e5, o2, l2)) && (i2 = c2.values[t4], Object.keys(r3).forEach(function(e6) {
                      m(i2, e6) ? i2[e6] = r3[e6] : w(i2, e6, r3[e6]);
                    }))), a3;
                  });
                  return y2.mutate(c2).then(function(e5) {
                    for (var t4 = e5.failures, n4 = e5.results, r3 = e5.numFailures, e5 = e5.lastResult, i2 = 0; i2 < f2.length; ++i2) {
                      var o2 = (n4 || f2)[i2], a3 = s2[i2];
                      null == o2 ? a3.onerror && a3.onerror(t4[i2]) : a3.onsuccess && a3.onsuccess("put" === c2.type && u2[i2] ? c2.values[i2] : o2);
                    }
                    return { failures: t4, results: n4, numFailures: r3, lastResult: e5 };
                  }).catch(function(t4) {
                    return s2.forEach(function(e5) {
                      return e5.onerror && e5.onerror(t4);
                    }), Promise.reject(t4);
                  });
                });
              }
            } });
          } });
        } };
        function Vn(e2, t2, n2) {
          try {
            if (!t2) return null;
            if (t2.keys.length < e2.length) return null;
            for (var r2 = [], i2 = 0, o2 = 0; i2 < t2.keys.length && o2 < e2.length; ++i2) 0 === st(t2.keys[i2], e2[o2]) && (r2.push(n2 ? S(t2.values[i2]) : t2.values[i2]), ++o2);
            return r2.length === e2.length ? r2 : null;
          } catch (e3) {
            return null;
          }
        }
        var zn = { stack: "dbcore", level: -1, create: function(t2) {
          return { table: function(e2) {
            var n2 = t2.table(e2);
            return _(_({}, n2), { getMany: function(t3) {
              if (!t3.cache) return n2.getMany(t3);
              var e3 = Vn(t3.keys, t3.trans._cache, "clone" === t3.cache);
              return e3 ? _e.resolve(e3) : n2.getMany(t3).then(function(e4) {
                return t3.trans._cache = { keys: t3.keys, values: "clone" === t3.cache ? S(e4) : e4 }, e4;
              });
            }, mutate: function(e3) {
              return "add" !== e3.type && (e3.trans._cache = null), n2.mutate(e3);
            } });
          } };
        } };
        function Wn(e2, t2) {
          return "readonly" === e2.trans.mode && !!e2.subscr && !e2.trans.explicit && "disabled" !== e2.trans.db._options.cache && !t2.schema.primaryKey.outbound;
        }
        function Yn(e2, t2) {
          switch (e2) {
            case "query":
              return t2.values && !t2.unique;
            case "get":
            case "getMany":
            case "count":
            case "openCursor":
              return false;
          }
        }
        var $n = { stack: "dbcore", level: 0, name: "Observability", create: function(b2) {
          var g2 = b2.schema.name, w2 = new _n(b2.MIN_KEY, b2.MAX_KEY);
          return _(_({}, b2), { transaction: function(e2, t2, n2) {
            if (me.subscr && "readonly" !== t2) throw new Y.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(me.querier));
            return b2.transaction(e2, t2, n2);
          }, table: function(d2) {
            var p2 = b2.table(d2), y2 = p2.schema, v2 = y2.primaryKey, e2 = y2.indexes, c2 = v2.extractKey, l2 = v2.outbound, m2 = v2.autoIncrement && e2.filter(function(e3) {
              return e3.compound && e3.keyPath.includes(v2.keyPath);
            }), t2 = _(_({}, p2), { mutate: function(a2) {
              function u2(e4) {
                return e4 = "idb://".concat(g2, "/").concat(d2, "/").concat(e4), n2[e4] || (n2[e4] = new _n());
              }
              var e3, o2, s2, t3 = a2.trans, n2 = a2.mutatedParts || (a2.mutatedParts = {}), r2 = u2(""), i2 = u2(":dels"), c3 = a2.type, l3 = "deleteRange" === a2.type ? [a2.range] : "delete" === a2.type ? [a2.keys] : a2.values.length < 50 ? [Ln(v2, a2).filter(function(e4) {
                return e4;
              }), a2.values] : [], f3 = l3[0], h2 = l3[1], l3 = a2.trans._cache;
              return x(f3) ? (r2.addKeys(f3), (l3 = "delete" === c3 || f3.length === h2.length ? Vn(f3, l3) : null) || i2.addKeys(f3), (l3 || h2) && (e3 = u2, o2 = l3, s2 = h2, y2.indexes.forEach(function(t4) {
                var n3 = e3(t4.name || "");
                function r3(e4) {
                  return null != e4 ? t4.extractKey(e4) : null;
                }
                function i3(e4) {
                  return t4.multiEntry && x(e4) ? e4.forEach(function(e5) {
                    return n3.addKey(e5);
                  }) : n3.addKey(e4);
                }
                (o2 || s2).forEach(function(e4, t5) {
                  var n4 = o2 && r3(o2[t5]), t5 = s2 && r3(s2[t5]);
                  0 !== st(n4, t5) && (null != n4 && i3(n4), null != t5 && i3(t5));
                });
              }))) : f3 ? (h2 = { from: null !== (h2 = f3.lower) && void 0 !== h2 ? h2 : b2.MIN_KEY, to: null !== (h2 = f3.upper) && void 0 !== h2 ? h2 : b2.MAX_KEY }, i2.add(h2), r2.add(h2)) : (r2.add(w2), i2.add(w2), y2.indexes.forEach(function(e4) {
                return u2(e4.name).add(w2);
              })), p2.mutate(a2).then(function(o3) {
                return !f3 || "add" !== a2.type && "put" !== a2.type || (r2.addKeys(o3.results), m2 && m2.forEach(function(t4) {
                  for (var e4 = a2.values.map(function(e5) {
                    return t4.extractKey(e5);
                  }), n3 = t4.keyPath.findIndex(function(e5) {
                    return e5 === v2.keyPath;
                  }), r3 = 0, i3 = o3.results.length; r3 < i3; ++r3) e4[r3][n3] = o3.results[r3];
                  u2(t4.name).addKeys(e4);
                })), t3.mutatedParts = Sn(t3.mutatedParts || {}, n2), o3;
              });
            } }), e2 = function(e3) {
              var t3 = e3.query, e3 = t3.index, t3 = t3.range;
              return [e3, new _n(null !== (e3 = t3.lower) && void 0 !== e3 ? e3 : b2.MIN_KEY, null !== (t3 = t3.upper) && void 0 !== t3 ? t3 : b2.MAX_KEY)];
            }, f2 = { get: function(e3) {
              return [v2, new _n(e3.key)];
            }, getMany: function(e3) {
              return [v2, new _n().addKeys(e3.keys)];
            }, count: e2, query: e2, openCursor: e2 };
            return O(f2).forEach(function(s2) {
              t2[s2] = function(i2) {
                var e3 = me.subscr, t3 = !!e3, n2 = Wn(me, p2) && Yn(s2, i2) ? i2.obsSet = {} : e3;
                if (t3) {
                  var r2 = function(e4) {
                    e4 = "idb://".concat(g2, "/").concat(d2, "/").concat(e4);
                    return n2[e4] || (n2[e4] = new _n());
                  }, o2 = r2(""), a2 = r2(":dels"), e3 = f2[s2](i2), t3 = e3[0], e3 = e3[1];
                  if (("query" === s2 && t3.isPrimaryKey && !i2.values ? a2 : r2(t3.name || "")).add(e3), !t3.isPrimaryKey) {
                    if ("count" !== s2) {
                      var u2 = "query" === s2 && l2 && i2.values && p2.query(_(_({}, i2), { values: false }));
                      return p2[s2].apply(this, arguments).then(function(t4) {
                        if ("query" === s2) {
                          if (l2 && i2.values) return u2.then(function(e5) {
                            e5 = e5.result;
                            return o2.addKeys(e5), t4;
                          });
                          var e4 = i2.values ? t4.result.map(c2) : t4.result;
                          (i2.values ? o2 : a2).addKeys(e4);
                        } else if ("openCursor" === s2) {
                          var n3 = t4, r3 = i2.values;
                          return n3 && Object.create(n3, { key: { get: function() {
                            return a2.addKey(n3.primaryKey), n3.key;
                          } }, primaryKey: { get: function() {
                            var e5 = n3.primaryKey;
                            return a2.addKey(e5), e5;
                          } }, value: { get: function() {
                            return r3 && o2.addKey(n3.primaryKey), n3.value;
                          } } });
                        }
                        return t4;
                      });
                    }
                    a2.add(w2);
                  }
                }
                return p2[s2].apply(this, arguments);
              };
            }), t2;
          } });
        } };
        function Qn(e2, t2, n2) {
          if (0 === n2.numFailures) return t2;
          if ("deleteRange" === t2.type) return null;
          var r2 = t2.keys ? t2.keys.length : "values" in t2 && t2.values ? t2.values.length : 1;
          if (n2.numFailures === r2) return null;
          t2 = _({}, t2);
          return x(t2.keys) && (t2.keys = t2.keys.filter(function(e3, t3) {
            return !(t3 in n2.failures);
          })), "values" in t2 && x(t2.values) && (t2.values = t2.values.filter(function(e3, t3) {
            return !(t3 in n2.failures);
          })), t2;
        }
        function Gn(e2, t2) {
          return n2 = e2, (void 0 === (r2 = t2).lower || (r2.lowerOpen ? 0 < st(n2, r2.lower) : 0 <= st(n2, r2.lower))) && (e2 = e2, void 0 === (t2 = t2).upper || (t2.upperOpen ? st(e2, t2.upper) < 0 : st(e2, t2.upper) <= 0));
          var n2, r2;
        }
        function Xn(e2, d2, t2, n2, r2, i2) {
          if (!t2 || 0 === t2.length) return e2;
          var o2 = d2.query.index, p2 = o2.multiEntry, y2 = d2.query.range, v2 = n2.schema.primaryKey.extractKey, m2 = o2.extractKey, a2 = (o2.lowLevelIndex || o2).extractKey, t2 = t2.reduce(function(e3, t3) {
            var n3 = e3, r3 = [];
            if ("add" === t3.type || "put" === t3.type) for (var i3 = new _n(), o3 = t3.values.length - 1; 0 <= o3; --o3) {
              var a3, u2 = t3.values[o3], s2 = v2(u2);
              i3.hasKey(s2) || (a3 = m2(u2), (p2 && x(a3) ? a3.some(function(e4) {
                return Gn(e4, y2);
              }) : Gn(a3, y2)) && (i3.addKey(s2), r3.push(u2)));
            }
            switch (t3.type) {
              case "add":
                var c2 = new _n().addKeys(d2.values ? e3.map(function(e4) {
                  return v2(e4);
                }) : e3), n3 = e3.concat(d2.values ? r3.filter(function(e4) {
                  e4 = v2(e4);
                  return !c2.hasKey(e4) && (c2.addKey(e4), true);
                }) : r3.map(function(e4) {
                  return v2(e4);
                }).filter(function(e4) {
                  return !c2.hasKey(e4) && (c2.addKey(e4), true);
                }));
                break;
              case "put":
                var l2 = new _n().addKeys(t3.values.map(function(e4) {
                  return v2(e4);
                }));
                n3 = e3.filter(function(e4) {
                  return !l2.hasKey(d2.values ? v2(e4) : e4);
                }).concat(d2.values ? r3 : r3.map(function(e4) {
                  return v2(e4);
                }));
                break;
              case "delete":
                var f2 = new _n().addKeys(t3.keys);
                n3 = e3.filter(function(e4) {
                  return !f2.hasKey(d2.values ? v2(e4) : e4);
                });
                break;
              case "deleteRange":
                var h2 = t3.range;
                n3 = e3.filter(function(e4) {
                  return !Gn(v2(e4), h2);
                });
            }
            return n3;
          }, e2);
          return t2 === e2 ? e2 : (t2.sort(function(e3, t3) {
            return st(a2(e3), a2(t3)) || st(v2(e3), v2(t3));
          }), d2.limit && d2.limit < 1 / 0 && (t2.length > d2.limit ? t2.length = d2.limit : e2.length === d2.limit && t2.length < d2.limit && (r2.dirty = true)), i2 ? Object.freeze(t2) : t2);
        }
        function Hn(e2, t2) {
          return 0 === st(e2.lower, t2.lower) && 0 === st(e2.upper, t2.upper) && !!e2.lowerOpen == !!t2.lowerOpen && !!e2.upperOpen == !!t2.upperOpen;
        }
        function Jn(e2, t2) {
          return (function(e3, t3, n2, r2) {
            if (void 0 === e3) return void 0 !== t3 ? -1 : 0;
            if (void 0 === t3) return 1;
            if (0 === (t3 = st(e3, t3))) {
              if (n2 && r2) return 0;
              if (n2) return 1;
              if (r2) return -1;
            }
            return t3;
          })(e2.lower, t2.lower, e2.lowerOpen, t2.lowerOpen) <= 0 && 0 <= (function(e3, t3, n2, r2) {
            if (void 0 === e3) return void 0 !== t3 ? 1 : 0;
            if (void 0 === t3) return -1;
            if (0 === (t3 = st(e3, t3))) {
              if (n2 && r2) return 0;
              if (n2) return -1;
              if (r2) return 1;
            }
            return t3;
          })(e2.upper, t2.upper, e2.upperOpen, t2.upperOpen);
        }
        function Zn(n2, r2, i2, e2) {
          n2.subscribers.add(i2), e2.addEventListener("abort", function() {
            var e3, t2;
            n2.subscribers.delete(i2), 0 === n2.subscribers.size && (e3 = n2, t2 = r2, setTimeout(function() {
              0 === e3.subscribers.size && I(t2, e3);
            }, 3e3));
          });
        }
        var er = { stack: "dbcore", level: 0, name: "Cache", create: function(k2) {
          var O2 = k2.schema.name;
          return _(_({}, k2), { transaction: function(g2, w2, e2) {
            var _2, t2, x2 = k2.transaction(g2, w2, e2);
            return "readwrite" === w2 && (t2 = (_2 = new AbortController()).signal, e2 = function(b2) {
              return function() {
                if (_2.abort(), "readwrite" === w2) {
                  for (var t3 = /* @__PURE__ */ new Set(), e3 = 0, n2 = g2; e3 < n2.length; e3++) {
                    var r2 = n2[e3], i2 = An["idb://".concat(O2, "/").concat(r2)];
                    if (i2) {
                      var o2 = k2.table(r2), a2 = i2.optimisticOps.filter(function(e4) {
                        return e4.trans === x2;
                      });
                      if (x2._explicit && b2 && x2.mutatedParts) for (var u2 = 0, s2 = Object.values(i2.queries.query); u2 < s2.length; u2++) for (var c2 = 0, l2 = (d2 = s2[u2]).slice(); c2 < l2.length; c2++) jn((p2 = l2[c2]).obsSet, x2.mutatedParts) && (I(d2, p2), p2.subscribers.forEach(function(e4) {
                        return t3.add(e4);
                      }));
                      else if (0 < a2.length) {
                        i2.optimisticOps = i2.optimisticOps.filter(function(e4) {
                          return e4.trans !== x2;
                        });
                        for (var f2 = 0, h2 = Object.values(i2.queries.query); f2 < h2.length; f2++) for (var d2, p2, y2, v2 = 0, m2 = (d2 = h2[f2]).slice(); v2 < m2.length; v2++) null != (p2 = m2[v2]).res && x2.mutatedParts && (b2 && !p2.dirty ? (y2 = Object.isFrozen(p2.res), y2 = Xn(p2.res, p2.req, a2, o2, p2, y2), p2.dirty ? (I(d2, p2), p2.subscribers.forEach(function(e4) {
                          return t3.add(e4);
                        })) : y2 !== p2.res && (p2.res = y2, p2.promise = _e.resolve({ result: y2 }))) : (p2.dirty && I(d2, p2), p2.subscribers.forEach(function(e4) {
                          return t3.add(e4);
                        })));
                      }
                    }
                  }
                  t3.forEach(function(e4) {
                    return e4();
                  });
                }
              };
            }, x2.addEventListener("abort", e2(false), { signal: t2 }), x2.addEventListener("error", e2(false), { signal: t2 }), x2.addEventListener("complete", e2(true), { signal: t2 })), x2;
          }, table: function(c2) {
            var l2 = k2.table(c2), i2 = l2.schema.primaryKey;
            return _(_({}, l2), { mutate: function(t2) {
              var e2 = me.trans;
              if (i2.outbound || "disabled" === e2.db._options.cache || e2.explicit || "readwrite" !== e2.idbtrans.mode) return l2.mutate(t2);
              var n2 = An["idb://".concat(O2, "/").concat(c2)];
              if (!n2) return l2.mutate(t2);
              e2 = l2.mutate(t2);
              return "add" !== t2.type && "put" !== t2.type || !(50 <= t2.values.length || Ln(i2, t2).some(function(e3) {
                return null == e3;
              })) ? (n2.optimisticOps.push(t2), t2.mutatedParts && In(t2.mutatedParts), e2.then(function(e3) {
                0 < e3.numFailures && (I(n2.optimisticOps, t2), (e3 = Qn(0, t2, e3)) && n2.optimisticOps.push(e3), t2.mutatedParts && In(t2.mutatedParts));
              }), e2.catch(function() {
                I(n2.optimisticOps, t2), t2.mutatedParts && In(t2.mutatedParts);
              })) : e2.then(function(r2) {
                var e3 = Qn(0, _(_({}, t2), { values: t2.values.map(function(e4, t3) {
                  var n3;
                  if (r2.failures[t3]) return e4;
                  e4 = null !== (n3 = i2.keyPath) && void 0 !== n3 && n3.includes(".") ? S(e4) : _({}, e4);
                  return w(e4, i2.keyPath, r2.results[t3]), e4;
                }) }), r2);
                n2.optimisticOps.push(e3), queueMicrotask(function() {
                  return t2.mutatedParts && In(t2.mutatedParts);
                });
              }), e2;
            }, query: function(t2) {
              if (!Wn(me, l2) || !Yn("query", t2)) return l2.query(t2);
              var i3 = "immutable" === (null === (o2 = me.trans) || void 0 === o2 ? void 0 : o2.db._options.cache), e2 = me, n2 = e2.requery, r2 = e2.signal, o2 = (function(e3, t3, n3, r3) {
                var i4 = An["idb://".concat(e3, "/").concat(t3)];
                if (!i4) return [];
                if (!(t3 = i4.queries[n3])) return [null, false, i4, null];
                var o3 = t3[(r3.query ? r3.query.index.name : null) || ""];
                if (!o3) return [null, false, i4, null];
                switch (n3) {
                  case "query":
                    var a3 = o3.find(function(e4) {
                      return e4.req.limit === r3.limit && e4.req.values === r3.values && Hn(e4.req.query.range, r3.query.range);
                    });
                    return a3 ? [a3, true, i4, o3] : [o3.find(function(e4) {
                      return ("limit" in e4.req ? e4.req.limit : 1 / 0) >= r3.limit && (!r3.values || e4.req.values) && Jn(e4.req.query.range, r3.query.range);
                    }), false, i4, o3];
                  case "count":
                    a3 = o3.find(function(e4) {
                      return Hn(e4.req.query.range, r3.query.range);
                    });
                    return [a3, !!a3, i4, o3];
                }
              })(O2, c2, "query", t2), a2 = o2[0], e2 = o2[1], u2 = o2[2], s2 = o2[3];
              return a2 && e2 ? a2.obsSet = t2.obsSet : (e2 = l2.query(t2).then(function(e3) {
                var t3 = e3.result;
                if (a2 && (a2.res = t3), i3) {
                  for (var n3 = 0, r3 = t3.length; n3 < r3; ++n3) Object.freeze(t3[n3]);
                  Object.freeze(t3);
                } else e3.result = S(t3);
                return e3;
              }).catch(function(e3) {
                return s2 && a2 && I(s2, a2), Promise.reject(e3);
              }), a2 = { obsSet: t2.obsSet, promise: e2, subscribers: /* @__PURE__ */ new Set(), type: "query", req: t2, dirty: false }, s2 ? s2.push(a2) : (s2 = [a2], (u2 = u2 || (An["idb://".concat(O2, "/").concat(c2)] = { queries: { query: {}, count: {} }, objs: /* @__PURE__ */ new Map(), optimisticOps: [], unsignaledParts: {} })).queries.query[t2.query.index.name || ""] = s2)), Zn(a2, s2, n2, r2), a2.promise.then(function(e3) {
                return { result: Xn(e3.result, t2, null == u2 ? void 0 : u2.optimisticOps, l2, a2, i3) };
              });
            } });
          } });
        } };
        function tr(e2, r2) {
          return new Proxy(e2, { get: function(e3, t2, n2) {
            return "db" === t2 ? r2 : Reflect.get(e3, t2, n2);
          } });
        }
        var nr = (rr.prototype.version = function(t2) {
          if (isNaN(t2) || t2 < 0.1) throw new Y.Type("Given version is not a positive number");
          if (t2 = Math.round(10 * t2) / 10, this.idbdb || this._state.isBeingOpened) throw new Y.Schema("Cannot add version when database is open");
          this.verno = Math.max(this.verno, t2);
          var e2 = this._versions, n2 = e2.filter(function(e3) {
            return e3._cfg.version === t2;
          })[0];
          return n2 || (n2 = new this.Version(t2), e2.push(n2), e2.sort(on), n2.stores({}), this._state.autoSchema = false, n2);
        }, rr.prototype._whenReady = function(e2) {
          var n2 = this;
          return this.idbdb && (this._state.openComplete || me.letThrough || this._vip) ? e2() : new _e(function(e3, t2) {
            if (n2._state.openComplete) return t2(new Y.DatabaseClosed(n2._state.dbOpenError));
            if (!n2._state.isBeingOpened) {
              if (!n2._state.autoOpen) return void t2(new Y.DatabaseClosed());
              n2.open().catch(G);
            }
            n2._state.dbReadyPromise.then(e3, t2);
          }).then(e2);
        }, rr.prototype.use = function(e2) {
          var t2 = e2.stack, n2 = e2.create, r2 = e2.level, i2 = e2.name;
          i2 && this.unuse({ stack: t2, name: i2 });
          e2 = this._middlewares[t2] || (this._middlewares[t2] = []);
          return e2.push({ stack: t2, create: n2, level: null == r2 ? 10 : r2, name: i2 }), e2.sort(function(e3, t3) {
            return e3.level - t3.level;
          }), this;
        }, rr.prototype.unuse = function(e2) {
          var t2 = e2.stack, n2 = e2.name, r2 = e2.create;
          return t2 && this._middlewares[t2] && (this._middlewares[t2] = this._middlewares[t2].filter(function(e3) {
            return r2 ? e3.create !== r2 : !!n2 && e3.name !== n2;
          })), this;
        }, rr.prototype.open = function() {
          var e2 = this;
          return $e(ve, function() {
            return Bn(e2);
          });
        }, rr.prototype._close = function() {
          this.on.close.fire(new CustomEvent("close"));
          var n2 = this._state, e2 = et.indexOf(this);
          if (0 <= e2 && et.splice(e2, 1), this.idbdb) {
            try {
              this.idbdb.close();
            } catch (e3) {
            }
            this.idbdb = null;
          }
          n2.isBeingOpened || (n2.dbReadyPromise = new _e(function(e3) {
            n2.dbReadyResolve = e3;
          }), n2.openCanceller = new _e(function(e3, t2) {
            n2.cancelOpen = t2;
          }));
        }, rr.prototype.close = function(e2) {
          var t2 = (void 0 === e2 ? { disableAutoOpen: true } : e2).disableAutoOpen, e2 = this._state;
          t2 ? (e2.isBeingOpened && e2.cancelOpen(new Y.DatabaseClosed()), this._close(), e2.autoOpen = false, e2.dbOpenError = new Y.DatabaseClosed()) : (this._close(), e2.autoOpen = this._options.autoOpen || e2.isBeingOpened, e2.openComplete = false, e2.dbOpenError = null);
        }, rr.prototype.delete = function(n2) {
          var i2 = this;
          void 0 === n2 && (n2 = { disableAutoOpen: true });
          var o2 = 0 < arguments.length && "object" != typeof arguments[0], a2 = this._state;
          return new _e(function(r2, t2) {
            function e2() {
              i2.close(n2);
              var e3 = i2._deps.indexedDB.deleteDatabase(i2.name);
              e3.onsuccess = Ie(function() {
                var e4, t3, n3;
                e4 = i2._deps, t3 = i2.name, n3 = e4.indexedDB, e4 = e4.IDBKeyRange, bn(n3) || t3 === tt || mn(n3, e4).delete(t3).catch(G), r2();
              }), e3.onerror = Ft(t2), e3.onblocked = i2._fireOnBlocked;
            }
            if (o2) throw new Y.InvalidArgument("Invalid closeOptions argument to db.delete()");
            a2.isBeingOpened ? a2.dbReadyPromise.then(e2) : e2();
          });
        }, rr.prototype.backendDB = function() {
          return this.idbdb;
        }, rr.prototype.isOpen = function() {
          return null !== this.idbdb;
        }, rr.prototype.hasBeenClosed = function() {
          var e2 = this._state.dbOpenError;
          return e2 && "DatabaseClosed" === e2.name;
        }, rr.prototype.hasFailed = function() {
          return null !== this._state.dbOpenError;
        }, rr.prototype.dynamicallyOpened = function() {
          return this._state.autoSchema;
        }, Object.defineProperty(rr.prototype, "tables", { get: function() {
          var t2 = this;
          return O(this._allTables).map(function(e2) {
            return t2._allTables[e2];
          });
        }, enumerable: false, configurable: true }), rr.prototype.transaction = function() {
          var e2 = function(e3, t2, n2) {
            var r2 = arguments.length;
            if (r2 < 2) throw new Y.InvalidArgument("Too few arguments");
            for (var i2 = new Array(r2 - 1); --r2; ) i2[r2 - 1] = arguments[r2];
            return n2 = i2.pop(), [e3, P(i2), n2];
          }.apply(this, arguments);
          return this._transaction.apply(this, e2);
        }, rr.prototype._transaction = function(e2, t2, n2) {
          var r2 = this, i2 = me.trans;
          i2 && i2.db === this && -1 === e2.indexOf("!") || (i2 = null);
          var o2, a2, u2 = -1 !== e2.indexOf("?");
          e2 = e2.replace("!", "").replace("?", "");
          try {
            if (a2 = t2.map(function(e3) {
              e3 = e3 instanceof r2.Table ? e3.name : e3;
              if ("string" != typeof e3) throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
              return e3;
            }), "r" == e2 || e2 === nt) o2 = nt;
            else {
              if ("rw" != e2 && e2 != rt) throw new Y.InvalidArgument("Invalid transaction mode: " + e2);
              o2 = rt;
            }
            if (i2) {
              if (i2.mode === nt && o2 === rt) {
                if (!u2) throw new Y.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
                i2 = null;
              }
              i2 && a2.forEach(function(e3) {
                if (i2 && -1 === i2.storeNames.indexOf(e3)) {
                  if (!u2) throw new Y.SubTransaction("Table " + e3 + " not included in parent transaction.");
                  i2 = null;
                }
              }), u2 && i2 && !i2.active && (i2 = null);
            }
          } catch (n3) {
            return i2 ? i2._promise(null, function(e3, t3) {
              t3(n3);
            }) : Xe(n3);
          }
          var s2 = function i3(o3, a3, u3, s3, c2) {
            return _e.resolve().then(function() {
              var e3 = me.transless || me, t3 = o3._createTransaction(a3, u3, o3._dbSchema, s3);
              if (t3.explicit = true, e3 = { trans: t3, transless: e3 }, s3) t3.idbtrans = s3.idbtrans;
              else try {
                t3.create(), t3.idbtrans._explicit = true, o3._state.PR1398_maxLoop = 3;
              } catch (e4) {
                return e4.name === z.InvalidState && o3.isOpen() && 0 < --o3._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), o3.close({ disableAutoOpen: false }), o3.open().then(function() {
                  return i3(o3, a3, u3, null, c2);
                })) : Xe(e4);
              }
              var n3, r3 = B(c2);
              return r3 && Le(), e3 = _e.follow(function() {
                var e4;
                (n3 = c2.call(t3, t3)) && (r3 ? (e4 = Ue.bind(null, null), n3.then(e4, e4)) : "function" == typeof n3.next && "function" == typeof n3.throw && (n3 = Rn(n3)));
              }, e3), (n3 && "function" == typeof n3.then ? _e.resolve(n3).then(function(e4) {
                return t3.active ? e4 : Xe(new Y.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
              }) : e3.then(function() {
                return n3;
              })).then(function(e4) {
                return s3 && t3._resolve(), t3._completion.then(function() {
                  return e4;
                });
              }).catch(function(e4) {
                return t3._reject(e4), Xe(e4);
              });
            });
          }.bind(null, this, o2, a2, i2, n2);
          return i2 ? i2._promise(o2, s2, "lock") : me.trans ? $e(me.transless, function() {
            return r2._whenReady(s2);
          }) : this._whenReady(s2);
        }, rr.prototype.table = function(e2) {
          if (!m(this._allTables, e2)) throw new Y.InvalidTable("Table ".concat(e2, " does not exist"));
          return this._allTables[e2];
        }, rr);
        function rr(e2, t2) {
          var o2 = this;
          this._middlewares = {}, this.verno = 0;
          var n2 = rr.dependencies;
          this._options = t2 = _({ addons: rr.addons, autoOpen: true, indexedDB: n2.indexedDB, IDBKeyRange: n2.IDBKeyRange, cache: "cloned" }, t2), this._deps = { indexedDB: t2.indexedDB, IDBKeyRange: t2.IDBKeyRange };
          n2 = t2.addons;
          this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this;
          var a2, r2, u2, i2, s2, c2 = { dbOpenError: null, isBeingOpened: false, onReadyBeingFired: null, openComplete: false, dbReadyResolve: G, dbReadyPromise: null, cancelOpen: G, openCanceller: null, autoSchema: true, PR1398_maxLoop: 3, autoOpen: t2.autoOpen };
          c2.dbReadyPromise = new _e(function(e3) {
            c2.dbReadyResolve = e3;
          }), c2.openCanceller = new _e(function(e3, t3) {
            c2.cancelOpen = t3;
          }), this._state = c2, this.name = e2, this.on = mt(this, "populate", "blocked", "versionchange", "close", { ready: [re, G] }), this.once = function(n3, r3) {
            var i3 = function() {
              for (var e3 = [], t3 = 0; t3 < arguments.length; t3++) e3[t3] = arguments[t3];
              o2.on(n3).unsubscribe(i3), r3.apply(o2, e3);
            };
            return o2.on(n3, i3);
          }, this.on.ready.subscribe = p(this.on.ready.subscribe, function(i3) {
            return function(n3, r3) {
              rr.vip(function() {
                var t3, e3 = o2._state;
                e3.openComplete ? (e3.dbOpenError || _e.resolve().then(n3), r3 && i3(n3)) : e3.onReadyBeingFired ? (e3.onReadyBeingFired.push(n3), r3 && i3(n3)) : (i3(n3), t3 = o2, r3 || i3(function e4() {
                  t3.on.ready.unsubscribe(n3), t3.on.ready.unsubscribe(e4);
                }));
              });
            };
          }), this.Collection = (a2 = this, bt(Kt.prototype, function(e3, t3) {
            this.db = a2;
            var n3 = ot, r3 = null;
            if (t3) try {
              n3 = t3();
            } catch (e4) {
              r3 = e4;
            }
            var i3 = e3._ctx, t3 = i3.table, e3 = t3.hook.reading.fire;
            this._ctx = { table: t3, index: i3.index, isPrimKey: !i3.index || t3.schema.primKey.keyPath && i3.index === t3.schema.primKey.name, range: n3, keysOnly: false, dir: "next", unique: "", algorithm: null, filter: null, replayFilter: null, justLimit: true, isMatch: null, offset: 0, limit: 1 / 0, error: r3, or: i3.or, valueMapper: e3 !== X ? e3 : null };
          })), this.Table = (r2 = this, bt(yt.prototype, function(e3, t3, n3) {
            this.db = r2, this._tx = n3, this.name = e3, this.schema = t3, this.hook = r2._allTables[e3] ? r2._allTables[e3].hook : mt(null, { creating: [Z, G], reading: [H, X], updating: [te, G], deleting: [ee, G] });
          })), this.Transaction = (u2 = this, bt(Vt.prototype, function(e3, t3, n3, r3, i3) {
            var o3 = this;
            "readonly" !== e3 && t3.forEach(function(e4) {
              e4 = null === (e4 = n3[e4]) || void 0 === e4 ? void 0 : e4.yProps;
              e4 && (t3 = t3.concat(e4.map(function(e5) {
                return e5.updatesTable;
              })));
            }), this.db = u2, this.mode = e3, this.storeNames = t3, this.schema = n3, this.chromeTransactionDurability = r3, this.idbtrans = null, this.on = mt(this, "complete", "error", "abort"), this.parent = i3 || null, this.active = true, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new _e(function(e4, t4) {
              o3._resolve = e4, o3._reject = t4;
            }), this._completion.then(function() {
              o3.active = false, o3.on.complete.fire();
            }, function(e4) {
              var t4 = o3.active;
              return o3.active = false, o3.on.error.fire(e4), o3.parent ? o3.parent._reject(e4) : t4 && o3.idbtrans && o3.idbtrans.abort(), Xe(e4);
            });
          })), this.Version = (i2 = this, bt(yn.prototype, function(e3) {
            this.db = i2, this._cfg = { version: e3, storesSource: null, dbschema: {}, tables: {}, contentUpgrade: null };
          })), this.WhereClause = (s2 = this, bt(Bt.prototype, function(e3, t3, n3) {
            if (this.db = s2, this._ctx = { table: e3, index: ":id" === t3 ? null : t3, or: n3 }, this._cmp = this._ascending = st, this._descending = function(e4, t4) {
              return st(t4, e4);
            }, this._max = function(e4, t4) {
              return 0 < st(e4, t4) ? e4 : t4;
            }, this._min = function(e4, t4) {
              return st(e4, t4) < 0 ? e4 : t4;
            }, this._IDBKeyRange = s2._deps.IDBKeyRange, !this._IDBKeyRange) throw new Y.MissingAPI();
          })), this.on("versionchange", function(e3) {
            0 < e3.newVersion ? console.warn("Another connection wants to upgrade database '".concat(o2.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(o2.name, "'. Closing db now to resume the delete request.")), o2.close({ disableAutoOpen: false });
          }), this.on("blocked", function(e3) {
            !e3.newVersion || e3.newVersion < e3.oldVersion ? console.warn("Dexie.delete('".concat(o2.name, "') was blocked")) : console.warn("Upgrade '".concat(o2.name, "' blocked by other connection holding version ").concat(e3.oldVersion / 10));
          }), this._maxKey = Qt(t2.IDBKeyRange), this._createTransaction = function(e3, t3, n3, r3) {
            return new o2.Transaction(e3, t3, n3, o2._options.chromeTransactionDurability, r3);
          }, this._fireOnBlocked = function(t3) {
            o2.on("blocked").fire(t3), et.filter(function(e3) {
              return e3.name === o2.name && e3 !== o2 && !e3._state.vcFired;
            }).map(function(e3) {
              return e3.on("versionchange").fire(t3);
            });
          }, this.use(zn), this.use(er), this.use($n), this.use(Mn), this.use(Un);
          var l2 = new Proxy(this, { get: function(e3, t3, n3) {
            if ("_vip" === t3) return true;
            if ("table" === t3) return function(e4) {
              return tr(o2.table(e4), l2);
            };
            var r3 = Reflect.get(e3, t3, n3);
            return r3 instanceof yt ? tr(r3, l2) : "tables" === t3 ? r3.map(function(e4) {
              return tr(e4, l2);
            }) : "_createTransaction" === t3 ? function() {
              return tr(r3.apply(this, arguments), l2);
            } : r3;
          } });
          this.vip = l2, n2.forEach(function(e3) {
            return e3(o2);
          });
        }
        var ir, F = "undefined" != typeof Symbol && "observable" in Symbol ? Symbol.observable : "@@observable", or = (ar.prototype.subscribe = function(e2, t2, n2) {
          return this._subscribe(e2 && "function" != typeof e2 ? e2 : { next: e2, error: t2, complete: n2 });
        }, ar.prototype[F] = function() {
          return this;
        }, ar);
        function ar(e2) {
          this._subscribe = e2;
        }
        try {
          ir = { indexedDB: f.indexedDB || f.mozIndexedDB || f.webkitIndexedDB || f.msIndexedDB, IDBKeyRange: f.IDBKeyRange || f.webkitIDBKeyRange };
        } catch (e2) {
          ir = { indexedDB: null, IDBKeyRange: null };
        }
        function ur(h2) {
          var d2, p2 = false, e2 = new or(function(r2) {
            var i2 = B(h2);
            var o2, a2 = false, u2 = {}, s2 = {}, e3 = { get closed() {
              return a2;
            }, unsubscribe: function() {
              a2 || (a2 = true, o2 && o2.abort(), c2 && Ut.storagemutated.unsubscribe(f2));
            } };
            r2.start && r2.start(e3);
            var c2 = false, l2 = function() {
              return Ge(t2);
            };
            var f2 = function(e4) {
              Sn(u2, e4), jn(s2, u2) && l2();
            }, t2 = function() {
              var t3, n2, e4;
              !a2 && ir.indexedDB && (u2 = {}, t3 = {}, o2 && o2.abort(), o2 = new AbortController(), e4 = (function(e5) {
                var t4 = je();
                try {
                  i2 && Le();
                  var n3 = Ne(h2, e5);
                  return n3 = i2 ? n3.finally(Ue) : n3;
                } finally {
                  t4 && Ae();
                }
              })(n2 = { subscr: t3, signal: o2.signal, requery: l2, querier: h2, trans: null }), Promise.resolve(e4).then(function(e5) {
                p2 = true, d2 = e5, a2 || n2.signal.aborted || (u2 = {}, (function(e6) {
                  for (var t4 in e6) if (m(e6, t4)) return;
                  return 1;
                })(s2 = t3) || c2 || (Ut(Nt, f2), c2 = true), Ge(function() {
                  return !a2 && r2.next && r2.next(e5);
                }));
              }, function(e5) {
                p2 = false, ["DatabaseClosedError", "AbortError"].includes(null == e5 ? void 0 : e5.name) || a2 || Ge(function() {
                  a2 || r2.error && r2.error(e5);
                });
              }));
            };
            return setTimeout(l2, 0), e3;
          });
          return e2.hasValue = function() {
            return p2;
          }, e2.getValue = function() {
            return d2;
          }, e2;
        }
        var sr = nr;
        function cr(e2) {
          var t2 = fr;
          try {
            fr = true, Ut.storagemutated.fire(e2), qn(e2, true);
          } finally {
            fr = t2;
          }
        }
        r(sr, _(_({}, Q), { delete: function(e2) {
          return new sr(e2, { addons: [] }).delete();
        }, exists: function(e2) {
          return new sr(e2, { addons: [] }).open().then(function(e3) {
            return e3.close(), true;
          }).catch("NoSuchDatabaseError", function() {
            return false;
          });
        }, getDatabaseNames: function(e2) {
          try {
            return t2 = sr.dependencies, n2 = t2.indexedDB, t2 = t2.IDBKeyRange, (bn(n2) ? Promise.resolve(n2.databases()).then(function(e3) {
              return e3.map(function(e4) {
                return e4.name;
              }).filter(function(e4) {
                return e4 !== tt;
              });
            }) : mn(n2, t2).toCollection().primaryKeys()).then(e2);
          } catch (e3) {
            return Xe(new Y.MissingAPI());
          }
          var t2, n2;
        }, defineClass: function() {
          return function(e2) {
            a(this, e2);
          };
        }, ignoreTransaction: function(e2) {
          return me.trans ? $e(me.transless, e2) : e2();
        }, vip: gn, async: function(t2) {
          return function() {
            try {
              var e2 = Rn(t2.apply(this, arguments));
              return e2 && "function" == typeof e2.then ? e2 : _e.resolve(e2);
            } catch (e3) {
              return Xe(e3);
            }
          };
        }, spawn: function(e2, t2, n2) {
          try {
            var r2 = Rn(e2.apply(n2, t2 || []));
            return r2 && "function" == typeof r2.then ? r2 : _e.resolve(r2);
          } catch (e3) {
            return Xe(e3);
          }
        }, currentTransaction: { get: function() {
          return me.trans || null;
        } }, waitFor: function(e2, t2) {
          t2 = _e.resolve("function" == typeof e2 ? sr.ignoreTransaction(e2) : e2).timeout(t2 || 6e4);
          return me.trans ? me.trans.waitFor(t2) : t2;
        }, Promise: _e, debug: { get: function() {
          return ie;
        }, set: function(e2) {
          oe(e2);
        } }, derive: o, extend: a, props: r, override: p, Events: mt, on: Ut, liveQuery: ur, extendObservabilitySet: Sn, getByKeyPath: g, setByKeyPath: w, delByKeyPath: function(t2, e2) {
          "string" == typeof e2 ? w(t2, e2, void 0) : "length" in e2 && [].map.call(e2, function(e3) {
            w(t2, e3, void 0);
          });
        }, shallowClone: k, deepClone: S, getObjectDiff: Nn, cmp: st, asap: v, minKey: -1 / 0, addons: [], connections: et, errnames: z, dependencies: ir, cache: An, semVer: "4.2.1", version: "4.2.1".split(".").map(function(e2) {
          return parseInt(e2);
        }).reduce(function(e2, t2, n2) {
          return e2 + t2 / Math.pow(10, 2 * n2);
        }) })), sr.maxKey = Qt(sr.dependencies.IDBKeyRange), "undefined" != typeof dispatchEvent && "undefined" != typeof addEventListener && (Ut(Nt, function(e2) {
          fr || (e2 = new CustomEvent(Lt, { detail: e2 }), fr = true, dispatchEvent(e2), fr = false);
        }), addEventListener(Lt, function(e2) {
          e2 = e2.detail;
          fr || cr(e2);
        }));
        var lr, fr = false, hr = function() {
        };
        return "undefined" != typeof BroadcastChannel && ((hr = function() {
          (lr = new BroadcastChannel(Lt)).onmessage = function(e2) {
            return e2.data && cr(e2.data);
          };
        })(), "function" == typeof lr.unref && lr.unref(), Ut(Nt, function(e2) {
          fr || lr.postMessage(e2);
        })), "undefined" != typeof addEventListener && (addEventListener("pagehide", function(e2) {
          if (!nr.disableBfCache && e2.persisted) {
            ie && console.debug("Dexie: handling persisted pagehide"), null != lr && lr.close();
            for (var t2 = 0, n2 = et; t2 < n2.length; t2++) n2[t2].close({ disableAutoOpen: false });
          }
        }), addEventListener("pageshow", function(e2) {
          !nr.disableBfCache && e2.persisted && (ie && console.debug("Dexie: handling persisted pageshow"), hr(), cr({ all: new _n(-1 / 0, [[]]) }));
        })), _e.rejectionMapper = function(e2, t2) {
          return !e2 || e2 instanceof N || e2 instanceof TypeError || e2 instanceof SyntaxError || !e2.name || !$[e2.name] ? e2 : (t2 = new $[e2.name](t2 || e2.message, e2), "stack" in e2 && l(t2, "stack", { get: function() {
            return this.inner.stack;
          } }), t2);
        }, oe(ie), _(nr, Object.freeze({ __proto__: null, Dexie: nr, liveQuery: ur, Entity: ut, cmp: st, PropModification: ht, replacePrefix: function(e2, t2) {
          return new ht({ replacePrefix: [e2, t2] });
        }, add: function(e2) {
          return new ht({ add: e2 });
        }, remove: function(e2) {
          return new ht({ remove: e2 });
        }, default: nr, RangeSet: _n, mergeRanges: kn, rangesOverlap: On }), { default: nr }), nr;
      });
    })(dexie_min$1);
    return dexie_min$1.exports;
  }
  var dexie_minExports = requireDexie_min();
  const _Dexie = /* @__PURE__ */ getDefaultExportFromCjs(dexie_minExports);
  const DexieSymbol = Symbol.for("Dexie");
  const Dexie = globalThis[DexieSymbol] || (globalThis[DexieSymbol] = _Dexie);
  if (_Dexie.semVer !== Dexie.semVer) {
    throw new Error(`Two different versions of Dexie loaded in the same app: ${_Dexie.semVer} and ${Dexie.semVer}`);
  }
  const {
    liveQuery,
    mergeRanges,
    rangesOverlap,
    RangeSet,
    cmp,
    Entity,
    PropModification,
    replacePrefix,
    add,
    remove,
    DexieYProvider
  } = Dexie;
  class NetworkDatabase extends Dexie {
    constructor() {
      super("UprootNetworkDB");
      // Tables
      __publicField(this, "nodes");
      __publicField(this, "edges");
      __publicField(this, "activities");
      __publicField(this, "companies");
      this.version(1).stores({
        // Nodes: Indexed by id (primary), degree, profile fields, matchScore
        // Allows queries like: "find all 2nd degree connections at Google"
        nodes: "id, degree, profile.name, profile.company, matchScore, status",
        // Edges: Composite primary key [from+to] prevents duplicates
        // Indexed by from/to for pathfinding (get all edges from a node)
        edges: "[from+to], from, to, weight, relationshipType",
        // Activities: For engagement_bridge strategy
        // Critical index: targetId (find who engages with target person)
        activities: "id, actorId, targetId, type, timestamp, scrapedAt",
        // Companies: For company_bridge strategy
        // Indexed by companyId (primary), name, and scrape time
        companies: "companyId, companyName, scrapedAt"
      });
    }
  }
  const networkDB = new NetworkDatabase();
  background;
  const QUEUE_KEY = "uproot_scraper_queue";
  const STATS_KEY = "uproot_scraper_stats";
  const PROGRESS_THROTTLE_MS = 5e3;
  class ScrapingOrchestrator {
    constructor() {
      // Queues (3 separate arrays for priority)
      __publicField(this, "highPriorityQueue", []);
      __publicField(this, "mediumPriorityQueue", []);
      __publicField(this, "lowPriorityQueue", []);
      // State
      __publicField(this, "currentTask", null);
      __publicField(this, "isProcessing", false);
      __publicField(this, "isPaused", false);
      // Statistics
      __publicField(this, "totalCompleted", 0);
      __publicField(this, "totalFailed", 0);
      // Progress throttling (taskId -> last message timestamp)
      __publicField(this, "lastProgressMessage", /* @__PURE__ */ new Map());
      this.loadQueue().then(() => {
        console.log("[Orchestrator] Loaded queue from storage");
        if (!this.isPaused && this.hasPendingTasks()) {
          this.processQueue();
        }
      });
    }
    // ==========================================================================
    // PUBLIC API
    // ==========================================================================
    /**
     * Enqueue a new scraping task
     *
     * @param task - Task configuration (without id, createdAt, status, retries)
     * @returns Task ID for tracking
     *
     * @example
     * ```typescript
     * const taskId = await orchestrator.enqueueTask({
     *   type: 'profile',
     *   priority: ScrapingPriority.HIGH,
     *   params: { profileUrl: 'https://linkedin.com/in/john-doe' }
     * });
     * ```
     */
    async enqueueTask(task) {
      const fullTask = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "pending",
        retries: 0
      };
      this.addToQueue(fullTask);
      await this.saveQueue();
      console.log(`[Orchestrator] Enqueued task ${fullTask.id} (${fullTask.type}, priority: ${fullTask.priority})`);
      if (!this.isProcessing && !this.isPaused) {
        this.processQueue();
      }
      return fullTask.id;
    }
    /**
     * Pause all scraping operations
     * Current task will finish current batch and pause
     */
    async pauseAll() {
      console.log("[Orchestrator] Pausing all scraping...");
      this.isPaused = true;
      if (this.currentTask?.type === "connection") {
        await this.sendToContentScript("PAUSE_CONNECTION_SCRAPE", {});
      }
      await this.saveQueue();
    }
    /**
     * Resume all scraping operations
     * Continues from where it was paused
     */
    async resumeAll() {
      console.log("[Orchestrator] Resuming all scraping...");
      this.isPaused = false;
      if (this.currentTask?.type === "connection") {
        await this.sendToContentScript("RESUME_CONNECTION_SCRAPE", {});
      }
      if (!this.isProcessing && this.hasPendingTasks()) {
        this.processQueue();
      }
      await this.saveQueue();
    }
    /**
     * Cancel a specific task
     *
     * @param taskId - Task ID to cancel
     * @returns True if task was cancelled, false if not found
     */
    async cancelTask(taskId) {
      console.log(`[Orchestrator] Cancelling task ${taskId}...`);
      if (this.currentTask?.id === taskId) {
        this.currentTask.status = "cancelled";
        this.isPaused = true;
        await this.saveQueue();
        return true;
      }
      const removed = this.removeFromQueue(this.highPriorityQueue, taskId) || this.removeFromQueue(this.mediumPriorityQueue, taskId) || this.removeFromQueue(this.lowPriorityQueue, taskId);
      if (removed) {
        await this.saveQueue();
        console.log(`[Orchestrator] Task ${taskId} cancelled`);
        return true;
      }
      console.warn(`[Orchestrator] Task ${taskId} not found`);
      return false;
    }
    /**
     * Get current queue status
     *
     * @returns Queue status with task counts and current task
     */
    async getQueueStatus() {
      return {
        highPriority: this.highPriorityQueue.length,
        mediumPriority: this.mediumPriorityQueue.length,
        lowPriority: this.lowPriorityQueue.length,
        currentTask: this.currentTask,
        isPaused: this.isPaused,
        totalCompleted: this.totalCompleted,
        totalFailed: this.totalFailed
      };
    }
    /**
     * Clear all completed and failed tasks from queues
     */
    async clearCompletedTasks() {
      console.log("[Orchestrator] Clearing completed/failed tasks...");
      this.highPriorityQueue = this.highPriorityQueue.filter(
        (t) => t.status !== "completed" && t.status !== "failed"
      );
      this.mediumPriorityQueue = this.mediumPriorityQueue.filter(
        (t) => t.status !== "completed" && t.status !== "failed"
      );
      this.lowPriorityQueue = this.lowPriorityQueue.filter(
        (t) => t.status !== "completed" && t.status !== "failed"
      );
      await this.saveQueue();
    }
    // ==========================================================================
    // QUEUE MANAGEMENT
    // ==========================================================================
    /**
     * Add task to correct queue based on priority
     */
    addToQueue(task) {
      switch (task.priority) {
        case 0:
          this.highPriorityQueue.push(task);
          break;
        case 1:
          this.mediumPriorityQueue.push(task);
          break;
        case 2:
          this.lowPriorityQueue.push(task);
          break;
        default:
          console.warn(`[Orchestrator] Unknown priority: ${task.priority}, defaulting to LOW`);
          this.lowPriorityQueue.push(task);
      }
    }
    /**
     * Get next task to process (HIGH > MEDIUM > LOW, FIFO within priority)
     */
    getNextTask() {
      const highTask = this.highPriorityQueue.find((t) => t.status === "pending");
      if (highTask) return highTask;
      const mediumTask = this.mediumPriorityQueue.find((t) => t.status === "pending");
      if (mediumTask) return mediumTask;
      const lowTask = this.lowPriorityQueue.find((t) => t.status === "pending");
      if (lowTask) return lowTask;
      return null;
    }
    /**
     * Check if there are any pending tasks in any queue
     */
    hasPendingTasks() {
      return this.highPriorityQueue.some((t) => t.status === "pending") || this.mediumPriorityQueue.some((t) => t.status === "pending") || this.lowPriorityQueue.some((t) => t.status === "pending");
    }
    /**
     * Remove task from queue by ID
     */
    removeFromQueue(queue, taskId) {
      const index = queue.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
        return true;
      }
      return false;
    }
    // ==========================================================================
    // TASK PROCESSING
    // ==========================================================================
    /**
     * Main queue processing loop
     * Runs continuously until queue is empty or paused
     */
    async processQueue() {
      if (this.isProcessing || this.isPaused) {
        console.log("[Orchestrator] Already processing or paused, skipping");
        return;
      }
      this.isProcessing = true;
      console.log("[Orchestrator] Starting queue processing...");
      try {
        while (true) {
          if (this.isPaused) {
            console.log("[Orchestrator] Processing paused");
            break;
          }
          const task = this.getNextTask();
          if (!task) {
            console.log("[Orchestrator] Queue empty, stopping processing");
            break;
          }
          this.currentTask = task;
          task.status = "running";
          await this.saveQueue();
          console.log(`[Orchestrator] Executing task ${task.id} (${task.type})`);
          try {
            await this.executeTask(task);
            task.status = "completed";
            this.totalCompleted++;
            console.log(`[Orchestrator] Task ${task.id} completed successfully`);
            this.notifyCompletion(task);
          } catch (error) {
            const errorMessage = error.message;
            const isPageNotAvailable = errorMessage.includes("LinkedIn connections page not open");
            if (isPageNotAvailable) {
              console.log(`[Orchestrator] Task ${task.id} waiting: ${errorMessage}`);
            } else {
              console.error(`[Orchestrator] Task ${task.id} failed:`, error);
            }
            const maxRetries = isPageNotAvailable ? 20 : 3;
            if (task.retries < maxRetries) {
              task.retries++;
              task.status = "pending";
              task.error = errorMessage;
              const backoffMs = isPageNotAvailable ? 3e4 : Math.pow(2, task.retries) * 1e3;
              if (isPageNotAvailable) {
                console.log(`[Orchestrator] Task ${task.id} will retry in ${backoffMs / 1e3}s when page is available (attempt ${task.retries + 1}/${maxRetries + 1})`);
              } else {
                console.log(`[Orchestrator] Retrying task ${task.id} in ${backoffMs}ms (attempt ${task.retries + 1}/${maxRetries + 1})`);
              }
              await this.sleep(backoffMs);
            } else {
              task.status = "failed";
              task.error = errorMessage;
              this.totalFailed++;
              console.error(`[Orchestrator] Task ${task.id} failed after ${maxRetries} retries`);
              this.notifyFailure(task, errorMessage);
            }
          }
          await this.saveQueue();
          this.currentTask = null;
        }
      } finally {
        this.isProcessing = false;
        console.log("[Orchestrator] Queue processing stopped");
      }
    }
    /**
     * Execute a specific scraper task
     */
    async executeTask(task) {
      switch (task.type) {
        case "connection":
          await this.executeConnectionScrape(task);
          break;
        case "profile":
          await this.executeProfileScrape(task);
          break;
        case "activity":
          await this.executeActivityScrape(task);
          break;
        case "company":
          await this.executeCompanyScrape(task);
          break;
        case "batch_profile":
          await this.executeBatchProfileScrape(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    }
    /**
     * Execute connection list scrape
     * Delegates to Content Script since it requires DOM access
     */
    async executeConnectionScrape(task) {
      const resume = task.params.resume ?? true;
      console.log(`[Orchestrator] Delegating connection scrape to Content Script (taskId: ${task.id})`);
      const tabs = await chrome.tabs.query({
        url: "https://www.linkedin.com/mynetwork/invite-connect/connections/*"
      });
      if (tabs.length === 0) {
        throw new Error("LinkedIn connections page not open - will retry when page is available");
      }
      const tab = tabs[0];
      if (!tab.id) {
        throw new Error("Invalid tab ID for LinkedIn connections page");
      }
      console.log(`[Orchestrator] Sending EXECUTE_CONNECTION_SCRAPE to tab ${tab.id}`);
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: "EXECUTE_CONNECTION_SCRAPE",
            payload: {
              taskId: task.id,
              params: { resume }
            }
          },
          (response) => {
            if (chrome.runtime.lastError) {
              const error = `Content Script communication failed: ${chrome.runtime.lastError.message}`;
              console.error(`[Orchestrator] ${error}`);
              reject(new Error(error));
              return;
            }
            if (!response?.success) {
              const error = response?.error || "Unknown error from Content Script";
              console.error(`[Orchestrator] Content Script returned error: ${error}`);
              reject(new Error(error));
              return;
            }
            console.log(`[Orchestrator] Connection scrape completed: ${response.data?.connectionsScraped || 0} connections`);
            resolve();
          }
        );
      });
    }
    /**
     * Execute profile scrape
     */
    async executeProfileScrape(task) {
      const { profileUrl: _profileUrl, includeActivity } = task.params;
      const profileData = await scrapeProfileData({ includeActivity });
      if (profileData) {
        const node = {
          id: profileData.publicId || profileData.id || "",
          profile: profileData,
          // Type assertion
          status: "not_contacted",
          degree: 0,
          // Will be updated by pathfinding
          matchScore: 0
        };
        await networkDB.nodes.put(node);
        console.log(`[Orchestrator] Profile saved: ${node.id}`);
      }
    }
    /**
     * Execute activity scrape
     */
    async executeActivityScrape(task) {
      const { profileUrl } = task.params;
      const activities = await scrapeProfileActivitySafe(profileUrl);
      if (activities.length > 0) {
        await networkDB.activities.bulkPut(activities);
        console.log(`[Orchestrator] Saved ${activities.length} activities`);
      }
    }
    /**
     * Execute company scrape
     */
    async executeCompanyScrape(task) {
      const { companyUrl } = task.params;
      const companyMap = await scrapeCompanyMapSafe(companyUrl);
      if (companyMap) {
        await networkDB.companies.put(companyMap);
        console.log(`[Orchestrator] Saved company map: ${companyMap.companyName} (${companyMap.employees.length} employees)`);
      }
    }
    /**
     * Execute batch profile scrape (multiple profiles)
     */
    async executeBatchProfileScrape(task) {
      const { profileUrls } = task.params;
      const total = profileUrls.length;
      for (let i = 0; i < total; i++) {
        const _profileUrl = profileUrls[i];
        try {
          const profileData = await scrapeProfileData();
          if (profileData) {
            const node = {
              id: profileData.publicId || profileData.id || "",
              profile: profileData,
              status: "not_contacted",
              degree: 0,
              matchScore: 0
            };
            await networkDB.nodes.put(node);
          }
          this.notifyProgress(task, {
            current: i + 1,
            total,
            status: `Scraping profiles... (${i + 1}/${total})`,
            lastUpdate: (/* @__PURE__ */ new Date()).toISOString()
          });
        } catch (error) {
          console.error(`[Orchestrator] Failed to scrape profile ${_profileUrl}:`, error);
        }
      }
    }
    // ==========================================================================
    // NOTIFICATIONS
    // ==========================================================================
    /**
     * Send progress notification to UI (throttled)
     */
    notifyProgress(task, progress) {
      task.progress = progress;
      const now = Date.now();
      const lastMessage = this.lastProgressMessage.get(task.id) || 0;
      if (now - lastMessage < PROGRESS_THROTTLE_MS) {
        return;
      }
      this.lastProgressMessage.set(task.id, now);
      chrome.runtime.sendMessage({
        type: "SCRAPER_PROGRESS",
        payload: {
          ...progress,
          taskId: task.id,
          taskType: task.type
        }
      }).catch(() => {
      });
    }
    /**
     * Notify task completion
     */
    notifyCompletion(task) {
      chrome.runtime.sendMessage({
        type: "SCRAPER_COMPLETED",
        payload: {
          taskId: task.id,
          result: null
          // Could include result data
        }
      }).catch(() => {
      });
    }
    /**
     * Notify task failure
     */
    notifyFailure(task, error) {
      chrome.runtime.sendMessage({
        type: "SCRAPER_FAILED",
        payload: {
          taskId: task.id,
          error
        }
      }).catch(() => {
      });
    }
    // ==========================================================================
    // PERSISTENCE
    // ==========================================================================
    /**
     * Save queue to chrome.storage.local
     */
    async saveQueue() {
      try {
        await chrome.storage.local.set({
          [QUEUE_KEY]: {
            high: this.highPriorityQueue,
            medium: this.mediumPriorityQueue,
            low: this.lowPriorityQueue,
            currentTask: this.currentTask,
            isPaused: this.isPaused
          },
          [STATS_KEY]: {
            totalCompleted: this.totalCompleted,
            totalFailed: this.totalFailed
          }
        });
      } catch (error) {
        console.error("[Orchestrator] Failed to save queue:", error);
      }
    }
    /**
     * Load queue from chrome.storage.local
     */
    async loadQueue() {
      try {
        const result2 = await chrome.storage.local.get([QUEUE_KEY, STATS_KEY]);
        if (result2[QUEUE_KEY]) {
          const queue = result2[QUEUE_KEY];
          this.highPriorityQueue = queue.high || [];
          this.mediumPriorityQueue = queue.medium || [];
          this.lowPriorityQueue = queue.low || [];
          this.currentTask = queue.currentTask || null;
          this.isPaused = queue.isPaused || false;
        }
        if (result2[STATS_KEY]) {
          const stats = result2[STATS_KEY];
          this.totalCompleted = stats.totalCompleted || 0;
          this.totalFailed = stats.totalFailed || 0;
        }
        console.log("[Orchestrator] Queue loaded from storage");
      } catch (error) {
        console.error("[Orchestrator] Failed to load queue:", error);
      }
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Send message to Content Script on LinkedIn connections page
     */
    async sendToContentScript(messageType, payload) {
      try {
        const tabs = await chrome.tabs.query({
          url: "https://www.linkedin.com/mynetwork/invite-connect/connections/*"
        });
        if (tabs.length === 0) {
          console.warn(`[Orchestrator] No LinkedIn connections page found for ${messageType}`);
          return null;
        }
        const tab = tabs[0];
        if (!tab.id) {
          console.warn(`[Orchestrator] Invalid tab ID for ${messageType}`);
          return null;
        }
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(
            tab.id,
            { type: messageType, payload },
            (response) => {
              if (chrome.runtime.lastError) {
                console.warn(`[Orchestrator] Failed to send ${messageType}: ${chrome.runtime.lastError.message}`);
                resolve(null);
                return;
              }
              resolve(response);
            }
          );
        });
      } catch (error) {
        console.error(`[Orchestrator] Error sending ${messageType}:`, error);
        return null;
      }
    }
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
  const scrapingOrchestrator = new ScrapingOrchestrator();
  background;
  function handleOrchestratorMessage(message, _sender, sendResponse) {
    (async () => {
      try {
        switch (message.type) {
          case "ENQUEUE_SCRAPE": {
            const taskId = await scrapingOrchestrator.enqueueTask(message.payload);
            sendResponse({ success: true, taskId });
            break;
          }
          case "PAUSE_ALL_SCRAPING":
            await scrapingOrchestrator.pauseAll();
            sendResponse({ success: true });
            break;
          case "RESUME_ALL_SCRAPING":
            await scrapingOrchestrator.resumeAll();
            sendResponse({ success: true });
            break;
          case "CANCEL_TASK": {
            const cancelled = await scrapingOrchestrator.cancelTask(message.payload.taskId);
            sendResponse({ success: cancelled });
            break;
          }
          case "GET_QUEUE_STATUS": {
            const status = await scrapingOrchestrator.getQueueStatus();
            sendResponse({ success: true, data: status });
            break;
          }
          case "CLEAR_COMPLETED_TASKS":
            await scrapingOrchestrator.clearCompletedTasks();
            sendResponse({ success: true });
            break;
          default:
            sendResponse({ success: false, error: "Unknown orchestrator message type" });
        }
      } catch (error) {
        console.error("[Orchestrator] Message handler error:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
  function isOrchestratorMessage(message) {
    const orchestratorTypes = [
      "ENQUEUE_SCRAPE",
      "PAUSE_ALL_SCRAPING",
      "RESUME_ALL_SCRAPING",
      "CANCEL_TASK",
      "GET_QUEUE_STATUS",
      "CLEAR_COMPLETED_TASKS",
      "EXECUTE_CONNECTION_SCRAPE"
    ];
    return orchestratorTypes.includes(message.type);
  }
  background;
  var ScrapingPriority = /* @__PURE__ */ ((ScrapingPriority2) => {
    ScrapingPriority2[ScrapingPriority2["HIGH"] = 0] = "HIGH";
    ScrapingPriority2[ScrapingPriority2["MEDIUM"] = 1] = "MEDIUM";
    ScrapingPriority2[ScrapingPriority2["LOW"] = 2] = "LOW";
    return ScrapingPriority2;
  })(ScrapingPriority || {});
  background;
  const IDLE_DETECTION_INTERVAL = 60;
  const STALE_DATA_THRESHOLD_DAYS = 7;
  async function getStaleProfiles(thresholdDays = STALE_DATA_THRESHOLD_DAYS) {
    try {
      const allNodes = await networkDB.nodes.toArray();
      const now = /* @__PURE__ */ new Date();
      const staleProfiles = [];
      for (const node of allNodes) {
        if (!node.profile.scrapedAt) {
          staleProfiles.push(node.id);
          continue;
        }
        const scrapedAt = new Date(node.profile.scrapedAt);
        const daysSinceScraped = (now.getTime() - scrapedAt.getTime()) / (1e3 * 60 * 60 * 24);
        if (daysSinceScraped >= thresholdDays) {
          staleProfiles.push(node.id);
        }
      }
      log.info(LogCategory.BACKGROUND, "Found stale profiles", {
        total: allNodes.length,
        stale: staleProfiles.length,
        thresholdDays
      });
      return staleProfiles;
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Failed to get stale profiles", error);
      return [];
    }
  }
  function initializeScheduler() {
    log.info(LogCategory.BACKGROUND, "Initializing scraping scheduler");
    setupIdleDetection();
    checkAndScheduleSync();
    log.info(LogCategory.BACKGROUND, "Scraping scheduler initialized");
  }
  function setupIdleDetection() {
    if (!chrome.idle) {
      log.warn(LogCategory.BACKGROUND, "chrome.idle API not available - idle detection disabled");
      return;
    }
    chrome.idle.setDetectionInterval(IDLE_DETECTION_INTERVAL);
    chrome.idle.onStateChanged.addListener(async (state) => {
      log.debug(LogCategory.BACKGROUND, "Idle state changed", { state });
      if (state === "idle") {
        await handleIdleState();
      } else if (state === "active") {
        log.info(LogCategory.BACKGROUND, "User active, deprioritizing background scraping");
      }
    });
    log.info(LogCategory.BACKGROUND, "Idle detection set up", {
      interval: IDLE_DETECTION_INTERVAL
    });
  }
  async function handleIdleState() {
    log.info(LogCategory.BACKGROUND, "User idle, checking for background scraping opportunities");
    try {
      if (!navigator.onLine) {
        log.warn(LogCategory.BACKGROUND, "User offline, skipping background scraping");
        return;
      }
      const queueStatus = await scrapingOrchestrator.getQueueStatus();
      if (queueStatus.lowPriority > 0) {
        log.info(LogCategory.BACKGROUND, "Low priority tasks already queued", {
          count: queueStatus.lowPriority
        });
        return;
      }
      const staleProfiles = await getStaleProfiles();
      if (staleProfiles.length > 0) {
        log.info(LogCategory.BACKGROUND, "Enqueuing stale profile updates", {
          count: Math.min(staleProfiles.length, 10)
          // Limit to 10 at a time
        });
        await scrapingOrchestrator.enqueueTask({
          type: "batch_profile",
          priority: ScrapingPriority.LOW,
          params: {
            profileUrls: staleProfiles.slice(0, 10).map((id) => `https://linkedin.com/in/${id}`)
          }
        });
      }
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Error handling idle state", error);
    }
  }
  async function checkAndScheduleSync() {
    try {
      const result2 = await chrome.storage.local.get("last_connection_sync");
      const lastSync = result2.last_connection_sync ? new Date(result2.last_connection_sync) : null;
      const now = /* @__PURE__ */ new Date();
      const hoursSinceLastSync = lastSync ? (now.getTime() - lastSync.getTime()) / (1e3 * 60 * 60) : Infinity;
      log.info(LogCategory.BACKGROUND, "Checking sync schedule", {
        lastSync: lastSync?.toISOString(),
        hoursSinceLastSync: hoursSinceLastSync.toFixed(1)
      });
      if (hoursSinceLastSync >= 24) {
        log.info(LogCategory.BACKGROUND, "Triggering overdue connection sync");
        await triggerConnectionSync();
      }
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Error checking sync schedule", error);
    }
  }
  async function triggerConnectionSync() {
    log.info(LogCategory.BACKGROUND, "Triggering connection sync");
    try {
      if (!navigator.onLine) {
        log.warn(LogCategory.BACKGROUND, "User offline, skipping connection sync");
        return;
      }
      const taskId = await scrapingOrchestrator.enqueueTask({
        type: "connection",
        priority: ScrapingPriority.LOW,
        params: { resume: true }
      });
      await chrome.storage.local.set({
        last_connection_sync: (/* @__PURE__ */ new Date()).toISOString()
      });
      log.info(LogCategory.BACKGROUND, "Connection sync enqueued", { taskId });
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Failed to trigger connection sync", error);
    }
  }
  function setupOnlineStatusMonitoring() {
    const globalContext = typeof window !== "undefined" ? window : self;
    globalContext.addEventListener("offline", async () => {
      log.warn(LogCategory.BACKGROUND, "User went offline, pausing scraping");
      await scrapingOrchestrator.pauseAll();
    });
    globalContext.addEventListener("online", async () => {
      log.info(LogCategory.BACKGROUND, "User came online, resuming scraping");
      await scrapingOrchestrator.resumeAll();
    });
    log.info(LogCategory.BACKGROUND, "Online/offline monitoring set up");
  }
  background;
  const DEADLINE_THRESHOLDS = {
    SAVED_NOT_APPLIED_DAYS: 7,
    // Alert if job saved for 7+ days without applying
    NO_FOLLOW_UP_DAYS: 7,
    // Alert if application 7+ days old with no follow-up
    HIGH_URGENCY_DAYS: 14
    // High urgency if 14+ days (for saved jobs or no follow-up)
  };
  async function alertAlreadyExists(alertType, jobId, applicationId) {
    const feedItems = await getFeedItems();
    return feedItems.some(
      (item) => item.type === "deadline_alert" && item.alertType === alertType && (jobId ? item.savedJobId === jobId : item.applicationId === applicationId)
    );
  }
  async function generateSavedJobAlerts(savedJobs) {
    const now = Date.now();
    const alerts = [];
    log.debug(LogCategory.SERVICE, "Generating saved job alerts", { count: savedJobs.length });
    for (const savedJob of savedJobs) {
      if (savedJob.applicationStatus !== "saved") {
        continue;
      }
      const savedDate = new Date(savedJob.savedAt).getTime();
      const daysSinceSaved = Math.floor((now - savedDate) / (1e3 * 60 * 60 * 24));
      if (daysSinceSaved < DEADLINE_THRESHOLDS.SAVED_NOT_APPLIED_DAYS) {
        continue;
      }
      if (await alertAlreadyExists("saved_not_applied", savedJob.id)) {
        log.debug(LogCategory.SERVICE, "Alert already exists, skipping", {
          jobId: savedJob.id,
          alertType: "saved_not_applied"
        });
        continue;
      }
      const urgency = daysSinceSaved >= DEADLINE_THRESHOLDS.HIGH_URGENCY_DAYS ? "high" : "medium";
      const alert = {
        id: `deadline_alert_${savedJob.id}_${Date.now()}`,
        type: "deadline_alert",
        timestamp: now,
        read: false,
        // Job details
        jobTitle: savedJob.job.title,
        company: savedJob.job.company,
        jobUrl: savedJob.job.url,
        // Alert details
        alertType: "saved_not_applied",
        urgency,
        daysSinceAction: daysSinceSaved,
        lastActionDate: savedDate,
        lastActionType: "saved",
        savedJobId: savedJob.id,
        // Metadata
        title: urgency === "high" ? `⚠️ Urgent: Apply to ${savedJob.job.company}` : `Reminder: ${savedJob.job.company} Job`,
        description: `You saved "${savedJob.job.title}" ${daysSinceSaved} days ago. ${urgency === "high" ? "Don't miss this opportunity!" : "Consider applying soon!"}`,
        actionUrl: savedJob.job.url,
        actionLabel: "Apply Now"
      };
      alerts.push(alert);
      log.info(LogCategory.SERVICE, "Created saved_not_applied alert", {
        jobTitle: savedJob.job.title,
        company: savedJob.job.company,
        daysSinceSaved,
        urgency
      });
    }
    return alerts;
  }
  async function generateApplicationAlerts(applications) {
    const now = Date.now();
    const alerts = [];
    log.debug(LogCategory.SERVICE, "Generating application alerts", { count: applications.length });
    for (const app of applications) {
      const earlyStageStatuses = ["applied", "screening", "phone-screen"];
      if (!earlyStageStatuses.includes(app.status)) {
        continue;
      }
      const daysSinceUpdate = Math.floor((now - app.updatedAt) / (1e3 * 60 * 60 * 24));
      if (daysSinceUpdate < DEADLINE_THRESHOLDS.NO_FOLLOW_UP_DAYS) {
        continue;
      }
      if (await alertAlreadyExists("no_follow_up", void 0, app.id)) {
        log.debug(LogCategory.SERVICE, "Alert already exists, skipping", {
          applicationId: app.id,
          alertType: "no_follow_up"
        });
        continue;
      }
      const urgency = daysSinceUpdate >= DEADLINE_THRESHOLDS.HIGH_URGENCY_DAYS ? "high" : "medium";
      const lastActionType = ["applied", "screening", "interview"].includes(app.status) ? app.status : "applied";
      const alert = {
        id: `deadline_alert_${app.id}_${Date.now()}`,
        type: "deadline_alert",
        timestamp: now,
        read: false,
        // Job details
        jobTitle: app.jobTitle,
        company: app.company,
        jobUrl: app.jobUrl,
        // Alert details
        alertType: "no_follow_up",
        urgency,
        daysSinceAction: daysSinceUpdate,
        lastActionDate: app.updatedAt,
        lastActionType,
        applicationId: app.id,
        // Metadata
        title: urgency === "high" ? `⚠️ Follow up with ${app.company}` : `Consider following up: ${app.company}`,
        description: `It's been ${daysSinceUpdate} days since your ${app.status} status for "${app.jobTitle}". ${urgency === "high" ? "A follow-up could help!" : "Consider sending a follow-up."}`,
        actionUrl: app.jobUrl || void 0,
        actionLabel: "Follow Up"
      };
      alerts.push(alert);
      log.info(LogCategory.SERVICE, "Created no_follow_up alert", {
        jobTitle: app.jobTitle,
        company: app.company,
        daysSinceUpdate,
        urgency,
        status: app.status
      });
    }
    return alerts;
  }
  async function generateDeadlineAlertsForUser(savedJobs, applications) {
    return log.trackAsync(LogCategory.SERVICE, "generateDeadlineAlertsForUser", async () => {
      log.info(LogCategory.SERVICE, "Starting deadline alert generation", {
        savedJobsCount: savedJobs.length,
        applicationsCount: applications.length
      });
      const savedJobAlerts = await generateSavedJobAlerts(savedJobs);
      const applicationAlerts = await generateApplicationAlerts(applications);
      const allAlerts = [...savedJobAlerts, ...applicationAlerts];
      log.info(LogCategory.SERVICE, "Deadline alert generation complete", {
        totalAlerts: allAlerts.length,
        savedJobAlerts: savedJobAlerts.length,
        applicationAlerts: applicationAlerts.length
      });
      return allAlerts;
    });
  }
  background;
  const definition = defineBackground(() => {
    log.info(LogCategory.BACKGROUND, "Background script initialized");
    initializeScheduler();
    setupOnlineStatusMonitoring();
    chrome.runtime.onInstalled.addListener(async (details) => {
      log.info(LogCategory.BACKGROUND, "Extension installed", {
        reason: details.reason,
        version: chrome.runtime.getManifest().version
      });
      if (details.reason === "install") {
        log.info(LogCategory.BACKGROUND, "First installation - initializing defaults");
        await initializeDefaultSettings();
        chrome.alarms.create("token-refresh", {
          periodInMinutes: 30
          // Check every 30 minutes
        });
        log.info(LogCategory.BACKGROUND, "Created token-refresh alarm", { periodInMinutes: 30 });
        chrome.alarms.create("activity-monitor", {
          periodInMinutes: 15
          // Check every 15 minutes
        });
        log.info(LogCategory.BACKGROUND, "Created activity-monitor alarm", { periodInMinutes: 15 });
        chrome.alarms.create("connection-watcher", {
          periodInMinutes: 30
          // Check every 30 minutes
        });
        log.info(LogCategory.BACKGROUND, "Created connection-watcher alarm", { periodInMinutes: 30 });
        chrome.alarms.create("deadline-alerts", {
          periodInMinutes: 360,
          // Check every 6 hours
          delayInMinutes: 1
          // Run 1 minute after install
        });
        log.info(LogCategory.BACKGROUND, "Created deadline-alerts alarm", { periodInMinutes: 360 });
        chrome.alarms.create("feed-cleanup", {
          periodInMinutes: 1440,
          // 24 hours = 1440 minutes
          delayInMinutes: 60
          // First run 1 hour after install
        });
        log.info(LogCategory.BACKGROUND, "Created feed-cleanup alarm", { periodInMinutes: 1440 });
        const next3AM = getNext3AM();
        chrome.alarms.create("connection-sync", {
          when: next3AM,
          periodInMinutes: 24 * 60
          // Daily
        });
        log.info(LogCategory.BACKGROUND, "Created connection-sync alarm", { nextRun: new Date(next3AM).toISOString() });
      }
      if (details.reason === "update") {
        log.info(LogCategory.BACKGROUND, "Extension updated", {
          previousVersion: details.previousVersion,
          currentVersion: chrome.runtime.getManifest().version
        });
      }
    });
    chrome.runtime.onStartup.addListener(() => {
      log.info(LogCategory.BACKGROUND, "Extension started");
    });
    chrome.runtime.onSuspend.addListener(() => {
      log.info(LogCategory.BACKGROUND, "Extension suspending");
    });
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      log.info(LogCategory.BACKGROUND, "Alarm triggered", {
        name: alarm.name,
        scheduledTime: new Date(alarm.scheduledTime).toISOString()
      });
      try {
        switch (alarm.name) {
          case "token-refresh":
            await handleTokenRefresh();
            break;
          case "activity-monitor":
            await handleActivityMonitoring();
            break;
          case "connection-watcher":
            await handleConnectionWatcher();
            break;
          case "deadline-alerts":
            await handleDeadlineAlerts();
            break;
          case "feed-cleanup":
            await handleFeedCleanup();
            break;
          case "connection-sync":
            await handleConnectionSync();
            break;
          default:
            log.warn(LogCategory.BACKGROUND, "Unknown alarm triggered", { name: alarm.name });
        }
      } catch (error) {
        log.error(LogCategory.BACKGROUND, "Alarm handler error", error, { alarmName: alarm.name });
      }
    });
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      log.debug(LogCategory.BACKGROUND, "Message received", {
        type: message.type,
        from: sender.tab?.id || "popup",
        hasData: !!message.data
      });
      if (isOrchestratorMessage(message)) {
        log.debug(LogCategory.BACKGROUND, "Handling orchestrator message", { type: message.type });
        return handleOrchestratorMessage(message, sender, sendResponse);
      }
      (async () => {
        try {
          switch (message.type) {
            case "GET_AUTH_STATUS":
              log.debug(LogCategory.BACKGROUND, "Handling GET_AUTH_STATUS request");
              sendResponse({ authenticated: false, session: null });
              break;
            case "SIGN_OUT":
              log.info(LogCategory.BACKGROUND, "User signing out");
              sendResponse({ success: true });
              break;
            case "GENERATE_AI_CONTENT": {
              log.info(LogCategory.BACKGROUND, "AI content generation requested", { payloadType: message.payload?.type });
              const result2 = await handleAIGeneration(message.payload);
              sendResponse({ success: true, data: result2 });
              break;
            }
            case "COMPUTE_ROUTE": {
              log.info(LogCategory.BACKGROUND, "Route computation requested", { targetId: message.payload?.targetId });
              const route = await handleRouteComputation(message.payload);
              sendResponse({ success: true, data: route });
              break;
            }
            case "SEND_NOTIFICATION":
              log.info(LogCategory.BACKGROUND, "Notification send requested", { title: message.payload?.title });
              await handleNotification(message.payload);
              sendResponse({ success: true });
              break;
            case "ANALYZE_CURRENT_JOB": {
              log.info(LogCategory.BACKGROUND, "Job analysis requested - forwarding to content script");
              const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (!activeTab.id) {
                log.warn(LogCategory.BACKGROUND, "No active tab found for job analysis");
                sendResponse({ success: false, error: "No active tab found" });
                break;
              }
              log.debug(LogCategory.BACKGROUND, "Forwarding message to content script", { tabId: activeTab.id });
              try {
                const contentScriptResponse = await Promise.race([
                  new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(activeTab.id, { type: "ANALYZE_CURRENT_JOB" }, (response) => {
                      if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                      } else {
                        resolve(response);
                      }
                    });
                  }),
                  new Promise(
                    (_, reject) => setTimeout(() => reject(new Error("Content script timeout after 28 seconds")), 28e3)
                  )
                ]);
                log.info(LogCategory.BACKGROUND, "Content script responded successfully", { tabId: activeTab.id });
                sendResponse(contentScriptResponse);
              } catch (error) {
                log.error(LogCategory.BACKGROUND, "Content script communication failed", error, { tabId: activeTab.id });
                sendResponse({ success: false, error: error.message });
              }
              break;
            }
            default:
              log.warn(LogCategory.BACKGROUND, "Unknown message type received", { type: message.type });
              sendResponse({ error: "Unknown message type" });
          }
          log.info(LogCategory.BACKGROUND, "Message handled successfully", { type: message.type });
        } catch (error) {
          log.error(LogCategory.BACKGROUND, "Message handling failed", error, { type: message.type });
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    });
    chrome.storage.onChanged.addListener((changes, areaName) => {
      log.debug(LogCategory.BACKGROUND, "Storage changed", {
        area: areaName,
        keys: Object.keys(changes),
        changeCount: Object.keys(changes).length
      });
      for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (["app_settings", "auth_token", "user_profile"].includes(key)) {
          log.debug(LogCategory.BACKGROUND, `Storage key updated: ${key}`, {
            area: areaName,
            hasOldValue: oldValue !== void 0,
            hasNewValue: newValue !== void 0
          });
        }
      }
    });
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab.url?.includes("linkedin.com")) {
        log.debug(LogCategory.BACKGROUND, "LinkedIn tab loaded", {
          tabId,
          url: tab.url,
          title: tab.title
        });
      }
    });
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        log.debug(LogCategory.BACKGROUND, "Tab activated", {
          tabId: activeInfo.tabId,
          url: tab.url,
          isLinkedIn: tab.url?.includes("linkedin.com") || false
        });
      } catch (error) {
        log.error(LogCategory.BACKGROUND, "Failed to get tab info on activation", error, { tabId: activeInfo.tabId });
      }
    });
    chrome.action.onClicked.addListener(async (tab) => {
      log.info(LogCategory.BACKGROUND, "Extension icon clicked", {
        tabId: tab.id,
        url: tab.url,
        title: tab.title
      });
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
          log.debug(LogCategory.BACKGROUND, "Toggle panel message sent to content script", { tabId: tab.id });
        } catch (error) {
          log.error(LogCategory.BACKGROUND, "Failed to send toggle panel message", error, { tabId: tab.id });
        }
      } else {
        log.warn(LogCategory.BACKGROUND, "No tab ID available for extension icon click");
      }
    });
    chrome.commands.onCommand.addListener(async (command) => {
      log.info(LogCategory.BACKGROUND, "Keyboard command triggered", { command });
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab.id || !activeTab.url) {
        log.warn(LogCategory.BACKGROUND, "No active tab or URL for keyboard command", { command });
        return;
      }
      const isLinkedIn = activeTab.url.includes("linkedin.com");
      try {
        switch (command) {
          case "toggle-panel":
            log.info(LogCategory.BACKGROUND, "Executing toggle-panel command (Alt+1)", { tabId: activeTab.id, isLinkedIn });
            await chrome.tabs.sendMessage(activeTab.id, { type: "TOGGLE_PANEL" });
            break;
          case "save-question":
            if (isLinkedIn) {
              log.debug(LogCategory.BACKGROUND, "Ignoring save-question command on LinkedIn - this shortcut is for 3rd party job sites only", { url: activeTab.url });
              return;
            }
            log.info(LogCategory.BACKGROUND, "Executing save-question command (Alt+2) on job application site", { tabId: activeTab.id, url: activeTab.url });
            await chrome.tabs.sendMessage(activeTab.id, { type: "SAVE_HIGHLIGHTED_QUESTION" });
            break;
          case "paste-to-generate":
            if (isLinkedIn) {
              log.debug(LogCategory.BACKGROUND, "Ignoring paste-to-generate command on LinkedIn - this shortcut is for 3rd party job sites only", { url: activeTab.url });
              return;
            }
            log.info(LogCategory.BACKGROUND, "Executing paste-to-generate command (Alt+3) on job application site", { tabId: activeTab.id, url: activeTab.url });
            await chrome.tabs.sendMessage(activeTab.id, { type: "PASTE_TO_GENERATE" });
            break;
          default:
            log.warn(LogCategory.BACKGROUND, "Unknown keyboard command", { command });
        }
      } catch (error) {
        log.error(LogCategory.BACKGROUND, "Keyboard command execution failed", error, {
          command,
          tabId: activeTab.id
        });
      }
    });
  });
  async function initializeDefaultSettings() {
    log.info(LogCategory.BACKGROUND, "Initializing default settings");
    const defaultSettings = {
      theme: {
        mode: "system",
        accentColor: "#0A66C2",
        blurIntensity: 10,
        curvePreset: "moderate"
      },
      notifications: {
        email: { enabled: false, types: [], frequency: "daily" },
        sms: { enabled: false, types: [] },
        push: { enabled: true, types: ["job_alert", "connection_accepted"] }
      },
      privacy: {
        cloudSyncEnabled: false,
        autoSendEnabled: false,
        analyticsEnabled: false,
        clearDataOnLogout: false
      },
      panelPosition: { x: 100, y: 100 },
      panelSize: { width: 420, height: 680 }
    };
    try {
      await chrome.storage.local.set({ app_settings: defaultSettings });
      log.info(LogCategory.BACKGROUND, "Default settings initialized successfully");
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Failed to initialize default settings", error);
      throw error;
    }
  }
  async function handleTokenRefresh() {
    log.debug(LogCategory.BACKGROUND, "Starting token refresh check");
    try {
      log.debug(LogCategory.BACKGROUND, "Token refresh check completed (not yet implemented)");
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Token refresh check failed", error);
      throw error;
    }
  }
  async function handleActivityMonitoring() {
    log.debug(LogCategory.BACKGROUND, "Starting activity monitoring check");
    try {
      const [companies, people, onboardingState] = await Promise.all([
        getCompanyWatchlist(),
        getWatchlist(),
        getOnboardingState()
      ]);
      const preferences = onboardingState.preferences;
      log.debug(LogCategory.BACKGROUND, `Monitoring ${companies.length} companies and ${people.length} people`);
      const companiesWithAlerts = companies.filter((c) => c.jobAlertEnabled);
      for (const company of companiesWithAlerts) {
        try {
          log.debug(LogCategory.BACKGROUND, `Checking jobs for ${company.name}`);
          if (preferences) {
            await checkCompanyJobs(company, preferences);
          }
          const dayInMs = 24 * 60 * 60 * 1e3;
          if (!company.lastChecked || Date.now() - company.lastChecked > dayInMs) {
            log.debug(LogCategory.BACKGROUND, `Checking updates for ${company.name}`);
            await checkCompanyUpdates(company);
          }
        } catch (error) {
          log.error(LogCategory.BACKGROUND, `Failed to check company ${company.name}`, error);
        }
      }
      for (const person of people) {
        try {
          log.debug(LogCategory.BACKGROUND, `Checking profile for ${person.name}`);
          await checkPersonProfile(person);
        } catch (error) {
          log.error(LogCategory.BACKGROUND, `Failed to check person ${person.name}`, error);
        }
      }
      log.debug(LogCategory.BACKGROUND, "Activity monitoring check completed successfully");
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Activity monitoring check failed", error);
      throw error;
    }
  }
  async function handleConnectionWatcher() {
    log.debug(LogCategory.BACKGROUND, "Starting connection acceptance check");
    try {
      const currentConnections = [];
      console.log("[Uproot] TODO: Scrape LinkedIn to get current connections");
      const connectionPaths = await getConnectionPaths();
      const acceptances = await detectConnectionAcceptances(currentConnections, connectionPaths);
      log.info(LogCategory.BACKGROUND, "Connection acceptance check completed", {
        acceptancesFound: acceptances.length
      });
      for (const acceptance of acceptances) {
        const path = connectionPaths.find((p) => p.id === acceptance.pathId);
        if (path && acceptance.stepIndex < path.path.length) {
          const step = path.path[acceptance.stepIndex];
          await logConnectionAcceptance(
            acceptance.pathId,
            acceptance.stepIndex,
            acceptance.personName,
            step.profileUrl
          );
          log.info(LogCategory.BACKGROUND, "Connection acceptance logged", {
            personName: acceptance.personName
          });
        }
      }
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Connection acceptance check failed", error);
      throw error;
    }
  }
  async function handleDeadlineAlerts() {
    log.debug(LogCategory.BACKGROUND, "Starting deadline alerts generation");
    try {
      const savedJobsResult = await chrome.storage.local.get(STORAGE_KEYS.SAVED_JOBS);
      const savedJobs = savedJobsResult[STORAGE_KEYS.SAVED_JOBS] || [];
      const applications = await getApplications();
      log.debug(LogCategory.BACKGROUND, "Fetched data for deadline alerts", {
        savedJobsCount: savedJobs.length,
        applicationsCount: applications.length
      });
      const alerts = await generateDeadlineAlertsForUser(savedJobs, applications);
      if (alerts.length > 0) {
        log.info(LogCategory.BACKGROUND, "Generated deadline alerts", {
          count: alerts.length,
          types: alerts.map((a) => a.alertType)
        });
        for (const alert of alerts) {
          await addFeedItem(alert);
        }
        log.info(LogCategory.BACKGROUND, "Deadline alerts added to feed", { count: alerts.length });
      } else {
        log.debug(LogCategory.BACKGROUND, "No deadline alerts generated");
      }
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Deadline alerts generation failed", error);
    }
  }
  async function handleFeedCleanup() {
    log.debug(LogCategory.BACKGROUND, "Starting feed cleanup...");
    try {
      const statsBefore = await getStorageStats();
      log.debug(LogCategory.BACKGROUND, "Storage stats before cleanup", statsBefore);
      const removedCount = await cleanupOldFeedItems(30);
      const statsAfter = await getStorageStats();
      if (removedCount > 0) {
        log.info(LogCategory.BACKGROUND, "Feed cleanup complete", {
          removedCount,
          maxAgeDays: 30,
          before: statsBefore,
          after: statsAfter
        });
      } else {
        log.debug(LogCategory.BACKGROUND, "Feed cleanup complete - no old items found", {
          stats: statsAfter
        });
      }
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Feed cleanup failed", error);
    }
  }
  async function handleAIGeneration(payload) {
    log.info(LogCategory.BACKGROUND, "Handling AI generation request", { type: payload?.type });
    try {
      const result2 = { generated: "Sample AI content" };
      log.info(LogCategory.BACKGROUND, "AI generation completed successfully", { type: payload?.type });
      return result2;
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "AI generation failed", error, { type: payload?.type });
      throw error;
    }
  }
  async function handleRouteComputation(payload) {
    log.info(LogCategory.BACKGROUND, "Handling route computation request", { targetId: payload?.targetId });
    try {
      const result2 = { route: [] };
      log.info(LogCategory.BACKGROUND, "Route computation completed successfully", { targetId: payload?.targetId, routeLength: 0 });
      return result2;
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Route computation failed", error, { targetId: payload?.targetId });
      throw error;
    }
  }
  async function handleNotification(payload) {
    const { title, message, iconUrl } = payload;
    log.info(LogCategory.BACKGROUND, "Handling notification request", {
      title,
      type: payload.notificationType || "system",
      hasIcon: !!iconUrl
    });
    try {
      const notificationId = await chrome.notifications.create({
        type: "basic",
        iconUrl: iconUrl || "/icon-128.png",
        title,
        message,
        priority: 2
      });
      log.debug(LogCategory.BACKGROUND, "Chrome notification created", { notificationId, title });
      const result2 = await chrome.storage.local.get("notifications");
      const notifications = result2.notifications || [];
      const newNotification = {
        id: crypto.randomUUID(),
        type: payload.notificationType || "system",
        title,
        message,
        read: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      notifications.unshift(newNotification);
      const trimmedNotifications = notifications.slice(0, 100);
      await chrome.storage.local.set({ notifications: trimmedNotifications });
      log.info(LogCategory.BACKGROUND, "Notification saved to history", {
        notificationId: newNotification.id,
        totalNotifications: trimmedNotifications.length
      });
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Notification handling failed", error, { title });
      throw error;
    }
  }
  async function handleConnectionSync() {
    log.info(LogCategory.BACKGROUND, "Handling daily connection sync");
    try {
      await scrapingOrchestrator.enqueueTask({
        type: "connection",
        priority: ScrapingPriority.LOW,
        params: { resume: true }
        // Resume from last run if interrupted
      });
      log.info(LogCategory.BACKGROUND, "Connection sync task enqueued");
    } catch (error) {
      log.error(LogCategory.BACKGROUND, "Connection sync failed", error);
    }
  }
  function getNext3AM() {
    const now = /* @__PURE__ */ new Date();
    const next3AM = /* @__PURE__ */ new Date();
    next3AM.setHours(3, 0, 0, 0);
    if (now.getTime() > next3AM.getTime()) {
      next3AM.setDate(next3AM.getDate() + 1);
    }
    return next3AM.getTime();
  }
  background;
  function initPlugins() {
  }
  var browserPolyfill$1 = { exports: {} };
  var browserPolyfill = browserPolyfill$1.exports;
  var hasRequiredBrowserPolyfill;
  function requireBrowserPolyfill() {
    if (hasRequiredBrowserPolyfill) return browserPolyfill$1.exports;
    hasRequiredBrowserPolyfill = 1;
    (function(module, exports$1) {
      (function(global2, factory) {
        {
          factory(module);
        }
      })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : browserPolyfill, function(module2) {
        if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
          throw new Error("This script should only be loaded in a browser extension.");
        }
        if (!(globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)) {
          const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
          const wrapAPIs = (extensionAPIs) => {
            const apiMetadata = {
              "alarms": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "clearAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "bookmarks": {
                "create": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getChildren": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getRecent": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getSubTree": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTree": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "move": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeTree": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "browserAction": {
                "disable": {
                  "minArgs": 0,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "enable": {
                  "minArgs": 0,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "getBadgeBackgroundColor": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getBadgeText": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getPopup": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTitle": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "openPopup": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "setBadgeBackgroundColor": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setBadgeText": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setIcon": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "setPopup": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setTitle": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "browsingData": {
                "remove": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "removeCache": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeCookies": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeDownloads": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeFormData": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeHistory": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeLocalStorage": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removePasswords": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removePluginData": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "settings": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "commands": {
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "contextMenus": {
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "cookies": {
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAllCookieStores": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "devtools": {
                "inspectedWindow": {
                  "eval": {
                    "minArgs": 1,
                    "maxArgs": 2,
                    "singleCallbackArg": false
                  }
                },
                "panels": {
                  "create": {
                    "minArgs": 3,
                    "maxArgs": 3,
                    "singleCallbackArg": true
                  },
                  "elements": {
                    "createSidebarPane": {
                      "minArgs": 1,
                      "maxArgs": 1
                    }
                  }
                }
              },
              "downloads": {
                "cancel": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "download": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "erase": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getFileIcon": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "open": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "pause": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeFile": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "resume": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "show": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "extension": {
                "isAllowedFileSchemeAccess": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "isAllowedIncognitoAccess": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "history": {
                "addUrl": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "deleteAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "deleteRange": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "deleteUrl": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getVisits": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "i18n": {
                "detectLanguage": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAcceptLanguages": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "identity": {
                "launchWebAuthFlow": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "idle": {
                "queryState": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "management": {
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getSelf": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "setEnabled": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "uninstallSelf": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "notifications": {
                "clear": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "create": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getPermissionLevel": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "pageAction": {
                "getPopup": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTitle": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "hide": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setIcon": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "setPopup": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setTitle": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "show": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "permissions": {
                "contains": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "request": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "runtime": {
                "getBackgroundPage": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getPlatformInfo": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "openOptionsPage": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "requestUpdateCheck": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "sendMessage": {
                  "minArgs": 1,
                  "maxArgs": 3
                },
                "sendNativeMessage": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "setUninstallURL": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "sessions": {
                "getDevices": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getRecentlyClosed": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "restore": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "storage": {
                "local": {
                  "clear": {
                    "minArgs": 0,
                    "maxArgs": 0
                  },
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "remove": {
                    "minArgs": 1,
                    "maxArgs": 1
                  },
                  "set": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                },
                "managed": {
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  }
                },
                "sync": {
                  "clear": {
                    "minArgs": 0,
                    "maxArgs": 0
                  },
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "remove": {
                    "minArgs": 1,
                    "maxArgs": 1
                  },
                  "set": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                }
              },
              "tabs": {
                "captureVisibleTab": {
                  "minArgs": 0,
                  "maxArgs": 2
                },
                "create": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "detectLanguage": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "discard": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "duplicate": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "executeScript": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getCurrent": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getZoom": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getZoomSettings": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "goBack": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "goForward": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "highlight": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "insertCSS": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "move": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "query": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "reload": {
                  "minArgs": 0,
                  "maxArgs": 2
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeCSS": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "sendMessage": {
                  "minArgs": 2,
                  "maxArgs": 3
                },
                "setZoom": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "setZoomSettings": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "update": {
                  "minArgs": 1,
                  "maxArgs": 2
                }
              },
              "topSites": {
                "get": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "webNavigation": {
                "getAllFrames": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getFrame": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "webRequest": {
                "handlerBehaviorChanged": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "windows": {
                "create": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getCurrent": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getLastFocused": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              }
            };
            if (Object.keys(apiMetadata).length === 0) {
              throw new Error("api-metadata.json has not been included in browser-polyfill");
            }
            class DefaultWeakMap extends WeakMap {
              constructor(createItem, items = void 0) {
                super(items);
                this.createItem = createItem;
              }
              get(key) {
                if (!this.has(key)) {
                  this.set(key, this.createItem(key));
                }
                return super.get(key);
              }
            }
            const isThenable = (value) => {
              return value && typeof value === "object" && typeof value.then === "function";
            };
            const makeCallback = (promise, metadata) => {
              return (...callbackArgs) => {
                if (extensionAPIs.runtime.lastError) {
                  promise.reject(new Error(extensionAPIs.runtime.lastError.message));
                } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
                  promise.resolve(callbackArgs[0]);
                } else {
                  promise.resolve(callbackArgs);
                }
              };
            };
            const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";
            const wrapAsyncFunction = (name, metadata) => {
              return function asyncFunctionWrapper(target, ...args) {
                if (args.length < metadata.minArgs) {
                  throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
                }
                if (args.length > metadata.maxArgs) {
                  throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
                }
                return new Promise((resolve, reject) => {
                  if (metadata.fallbackToNoCallback) {
                    try {
                      target[name](...args, makeCallback({
                        resolve,
                        reject
                      }, metadata));
                    } catch (cbError) {
                      console.warn(`${name} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, cbError);
                      target[name](...args);
                      metadata.fallbackToNoCallback = false;
                      metadata.noCallback = true;
                      resolve();
                    }
                  } else if (metadata.noCallback) {
                    target[name](...args);
                    resolve();
                  } else {
                    target[name](...args, makeCallback({
                      resolve,
                      reject
                    }, metadata));
                  }
                });
              };
            };
            const wrapMethod = (target, method, wrapper) => {
              return new Proxy(method, {
                apply(targetMethod, thisObj, args) {
                  return wrapper.call(thisObj, target, ...args);
                }
              });
            };
            let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
            const wrapObject = (target, wrappers = {}, metadata = {}) => {
              let cache = /* @__PURE__ */ Object.create(null);
              let handlers = {
                has(proxyTarget2, prop) {
                  return prop in target || prop in cache;
                },
                get(proxyTarget2, prop, receiver) {
                  if (prop in cache) {
                    return cache[prop];
                  }
                  if (!(prop in target)) {
                    return void 0;
                  }
                  let value = target[prop];
                  if (typeof value === "function") {
                    if (typeof wrappers[prop] === "function") {
                      value = wrapMethod(target, target[prop], wrappers[prop]);
                    } else if (hasOwnProperty(metadata, prop)) {
                      let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                      value = wrapMethod(target, target[prop], wrapper);
                    } else {
                      value = value.bind(target);
                    }
                  } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
                    value = wrapObject(value, wrappers[prop], metadata[prop]);
                  } else if (hasOwnProperty(metadata, "*")) {
                    value = wrapObject(value, wrappers[prop], metadata["*"]);
                  } else {
                    Object.defineProperty(cache, prop, {
                      configurable: true,
                      enumerable: true,
                      get() {
                        return target[prop];
                      },
                      set(value2) {
                        target[prop] = value2;
                      }
                    });
                    return value;
                  }
                  cache[prop] = value;
                  return value;
                },
                set(proxyTarget2, prop, value, receiver) {
                  if (prop in cache) {
                    cache[prop] = value;
                  } else {
                    target[prop] = value;
                  }
                  return true;
                },
                defineProperty(proxyTarget2, prop, desc) {
                  return Reflect.defineProperty(cache, prop, desc);
                },
                deleteProperty(proxyTarget2, prop) {
                  return Reflect.deleteProperty(cache, prop);
                }
              };
              let proxyTarget = Object.create(target);
              return new Proxy(proxyTarget, handlers);
            };
            const wrapEvent = (wrapperMap) => ({
              addListener(target, listener, ...args) {
                target.addListener(wrapperMap.get(listener), ...args);
              },
              hasListener(target, listener) {
                return target.hasListener(wrapperMap.get(listener));
              },
              removeListener(target, listener) {
                target.removeListener(wrapperMap.get(listener));
              }
            });
            const onRequestFinishedWrappers = new DefaultWeakMap((listener) => {
              if (typeof listener !== "function") {
                return listener;
              }
              return function onRequestFinished(req) {
                const wrappedReq = wrapObject(req, {}, {
                  getContent: {
                    minArgs: 0,
                    maxArgs: 0
                  }
                });
                listener(wrappedReq);
              };
            });
            const onMessageWrappers = new DefaultWeakMap((listener) => {
              if (typeof listener !== "function") {
                return listener;
              }
              return function onMessage(message, sender, sendResponse) {
                let didCallSendResponse = false;
                let wrappedSendResponse;
                let sendResponsePromise = new Promise((resolve) => {
                  wrappedSendResponse = function(response) {
                    didCallSendResponse = true;
                    resolve(response);
                  };
                });
                let result2;
                try {
                  result2 = listener(message, sender, wrappedSendResponse);
                } catch (err) {
                  result2 = Promise.reject(err);
                }
                const isResultThenable = result2 !== true && isThenable(result2);
                if (result2 !== true && !isResultThenable && !didCallSendResponse) {
                  return false;
                }
                const sendPromisedResult = (promise) => {
                  promise.then((msg) => {
                    sendResponse(msg);
                  }, (error) => {
                    let message2;
                    if (error && (error instanceof Error || typeof error.message === "string")) {
                      message2 = error.message;
                    } else {
                      message2 = "An unexpected error occurred";
                    }
                    sendResponse({
                      __mozWebExtensionPolyfillReject__: true,
                      message: message2
                    });
                  }).catch((err) => {
                    console.error("Failed to send onMessage rejected reply", err);
                  });
                };
                if (isResultThenable) {
                  sendPromisedResult(result2);
                } else {
                  sendPromisedResult(sendResponsePromise);
                }
                return true;
              };
            });
            const wrappedSendMessageCallback = ({
              reject,
              resolve
            }, reply) => {
              if (extensionAPIs.runtime.lastError) {
                if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
                  resolve();
                } else {
                  reject(new Error(extensionAPIs.runtime.lastError.message));
                }
              } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
                reject(new Error(reply.message));
              } else {
                resolve(reply);
              }
            };
            const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
              if (args.length < metadata.minArgs) {
                throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
              }
              if (args.length > metadata.maxArgs) {
                throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
              }
              return new Promise((resolve, reject) => {
                const wrappedCb = wrappedSendMessageCallback.bind(null, {
                  resolve,
                  reject
                });
                args.push(wrappedCb);
                apiNamespaceObj.sendMessage(...args);
              });
            };
            const staticWrappers = {
              devtools: {
                network: {
                  onRequestFinished: wrapEvent(onRequestFinishedWrappers)
                }
              },
              runtime: {
                onMessage: wrapEvent(onMessageWrappers),
                onMessageExternal: wrapEvent(onMessageWrappers),
                sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                  minArgs: 1,
                  maxArgs: 3
                })
              },
              tabs: {
                sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                  minArgs: 2,
                  maxArgs: 3
                })
              }
            };
            const settingMetadata = {
              clear: {
                minArgs: 1,
                maxArgs: 1
              },
              get: {
                minArgs: 1,
                maxArgs: 1
              },
              set: {
                minArgs: 1,
                maxArgs: 1
              }
            };
            apiMetadata.privacy = {
              network: {
                "*": settingMetadata
              },
              services: {
                "*": settingMetadata
              },
              websites: {
                "*": settingMetadata
              }
            };
            return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
          };
          module2.exports = wrapAPIs(chrome);
        } else {
          module2.exports = globalThis.browser;
        }
      });
    })(browserPolyfill$1);
    return browserPolyfill$1.exports;
  }
  requireBrowserPolyfill();
  function print(method, ...args) {
    return;
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
})();
background;
//# sourceMappingURL=background.js.map
