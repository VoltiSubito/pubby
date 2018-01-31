/*
 *  Pubst - Basic JavaScript Pub/Sub Event Emitter
 *
 *  Copyright 2017 Jason Schindler
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */


(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.pubst = factory();
}
}(typeof self !== 'undefined' ? self : this, function () {

  const config = {
    showWarnings: true
  };

  function warn(...messages) {
    if (config.showWarnings) {
      // eslint-disable-next-line no-console
      console.warn('WARNING:', ...messages);
    }
  }

  function configure(userConfig) {
    for (const key in config) {
      if (userConfig.hasOwnProperty(key)) {
        config[key] = userConfig[key];
      }
    }
  }

  const store = {};
  const subscribers = {};

  function isNotSet(item) {
    return item === null || typeof item === 'undefined';
  }

  function isSet(item) {
    return !isNotSet(item);
  }

  function valueOrDefault(value, def) {
    if(isNotSet(value) && typeof def !== 'undefined'){
      return def;
    }

    return value;
  }

  function allSubsFor(topic) {
    return Array.isArray(subscribers[topic]) ? subscribers[topic] : [];
  }

  function scheduleCall(callback, payload, topic) {
    setTimeout(callback, 0, payload, topic);
  }

  function publish(topic, payload) {
    if (store[topic] !== payload) {
      store[topic] = payload;
      const subs = allSubsFor(topic);

      if (subs.length === 0) {
        warn(`There are no subscribers that match '${topic}'!`);
      } else {
        subs.forEach(sub => {
          scheduleCall(sub, store[topic], topic);
        });
      }
    }
  }

  function subscribe(topic, callback, def) {
    const mySub = (payload, topic) => {
      callback(valueOrDefault(payload, def), topic);
    };

    subscribers[topic] = allSubsFor(topic).concat(mySub);

    const current = currentVal(topic, def);
    if (isSet(current)) {
      scheduleCall(mySub, current, topic);
    }

    return () => {
      subscribers[topic] = allSubsFor(topic).filter(aSub => aSub !== mySub);
    };
  }

  function currentVal(topic, def) {
    return valueOrDefault(store[topic], def);
  }

  function clear(topic) {
    if (store.hasOwnProperty(topic)) {
      publish(topic, null);
    }
  }

  function clearAll() {
    Object.keys(store).forEach(clear);
  }

  return {
    clear,
    clearAll,
    configure,
    currentVal,
    publish,
    subscribe
  };
}));
