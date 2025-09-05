// Browser compatibility utilities for Vehicle Manager

export const BrowserSupport = {
  // Detect browser type
  getBrowser: () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    if (userAgent.includes('Trident')) return 'ie';
    
    return 'unknown';
  },

  // Check for specific features
  supports: {
    fetch: () => typeof fetch !== 'undefined',
    grid: () => CSS.supports('display', 'grid'),
    flexbox: () => CSS.supports('display', 'flex'),
    customProperties: () => CSS.supports('--custom', 'property'),
    ariaLabels: () => 'ariaLabel' in document.createElement('div'),
    localStorage: () => {
      try {
        return typeof localStorage !== 'undefined';
      } catch {
        return false;
      }
    },
    formValidation: () => {
      const input = document.createElement('input');
      return typeof input.checkValidity === 'function';
    }
  },

  // Polyfill for older browsers
  polyfills: {
    // Fetch polyfill for IE
    fetchPolyfill: () => {
      if (!BrowserSupport.supports.fetch()) {
        console.warn('Vehicle Manager: Fetch not supported, using XMLHttpRequest fallback');
        window.fetch = (url, options = {}) => {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(options.method || 'GET', url, true);
            
            if (options.headers) {
              Object.keys(options.headers).forEach(key => {
                xhr.setRequestHeader(key, options.headers[key]);
              });
            }
            
            if (options.credentials === 'include') {
              xhr.withCredentials = true;
            }
            
            xhr.onreadystatechange = () => {
              if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve({
                    ok: true,
                    status: xhr.status,
                    json: () => Promise.resolve(JSON.parse(xhr.responseText)),
                    text: () => Promise.resolve(xhr.responseText)
                  });
                } else {
                  resolve({
                    ok: false,
                    status: xhr.status,
                    json: () => Promise.resolve(JSON.parse(xhr.responseText || '{}')),
                    text: () => Promise.resolve(xhr.responseText)
                  });
                }
              }
            };
            
            xhr.onerror = () => reject(new Error('Network error'));
            
            if (options.body) {
              xhr.send(options.body);
            } else {
              xhr.send();
            }
          });
        };
      }
    },

    // Object.assign polyfill for IE
    objectAssignPolyfill: () => {
      if (!Object.assign) {
        Object.assign = function(target) {
          if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
          }
          
          const to = Object(target);
          
          for (let index = 1; index < arguments.length; index++) {
            const nextSource = arguments[index];
            
            if (nextSource != null) {
              for (const nextKey in nextSource) {
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                  to[nextKey] = nextSource[nextKey];
                }
              }
            }
          }
          
          return to;
        };
      }
    },

    // Array.find polyfill for IE
    arrayFindPolyfill: () => {
      if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
          if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
          }
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }
          
          const list = Object(this);
          const length = parseInt(list.length) || 0;
          const thisArg = arguments[1];
          
          for (let i = 0; i < length; i++) {
            if (predicate.call(thisArg, list[i], i, list)) {
              return list[i];
            }
          }
          
          return undefined;
        };
      }
    }
  },

  // Initialize all polyfills
  init: () => {
    BrowserSupport.polyfills.fetchPolyfill();
    BrowserSupport.polyfills.objectAssignPolyfill();
    BrowserSupport.polyfills.arrayFindPolyfill();
    
    // Add browser-specific classes to body for CSS targeting
    const browser = BrowserSupport.getBrowser();
    document.body.classList.add(`browser-${browser}`);
    
    // Add feature detection classes
    if (!BrowserSupport.supports.grid()) {
      document.body.classList.add('no-grid');
    }
    if (!BrowserSupport.supports.flexbox()) {
      document.body.classList.add('no-flexbox');
    }
    if (!BrowserSupport.supports.customProperties()) {
      document.body.classList.add('no-css-variables');
    }
  },

  // Performance monitoring for different browsers
  performance: {
    mark: (name) => {
      if (window.performance && window.performance.mark) {
        window.performance.mark(name);
      }
    },
    
    measure: (name, startMark, endMark) => {
      if (window.performance && window.performance.measure) {
        window.performance.measure(name, startMark, endMark);
      }
    },
    
    getEntries: (type) => {
      if (window.performance && window.performance.getEntriesByType) {
        return window.performance.getEntriesByType(type);
      }
      return [];
    }
  }
};

// Auto-initialize on import
BrowserSupport.init();