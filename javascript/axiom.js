//#region Console Styling (cs)
let csStyleEnabled = true;

/**
 * Style object proxy for console text by type
 * @type {Record<string, string>}
 */
const csStyles = new Proxy({}, {
  get(target, prop) {
    if (prop === "warn") return "color: orange;";
    if (prop === "error") return "color: red;";
    let hash = 0;
    const str = String(prop);
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    return `color: hsl(${hue}, 75%, 55%);`;
  }
});

/**
 * Style object proxy for console prefixes
 * @type {Record<string, string>}
 */
const pfxStyles = new Proxy({}, {
  get(target, prop) {
    if (prop === "warn") return "color: orange; font-weight: bold;";
    if (prop === "error") return "color: red; font-weight: bold;";
    let hash = 0;
    const str = String(prop);
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    return `color: hsl(${hue}, 70%, 55%); font-weight: bold;`;
  }
});

/**
 * Console logger with optional prefix and color styles.
 * @param {"log"|"warn"|"error"|"info"|"debug"|"group"|"groupCollapsed"|"groupEnd"|"table"|"trace"} [type="log"] - Console method
 * @param {string} [message=""] - Message to log
 * @param {string} [prefix=""] - Optional prefix
 */
function cs(type = "log", message = "", prefix = "") {
  const methods = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd,
    table: console.table,
    trace: console.trace
  };
  const method = methods[type];
  if (!method) return console.warn(`Unknown console method: ${type}`);
  if (type === "groupEnd") return method();

  message = String(message);
  const prefixText = prefix ? `[${String(prefix).toUpperCase()}] ` : "";
  const prefixStyle = prefixText ? pfxStyles[prefix] : "";

  let msgStyle;
  if (type === "warn") msgStyle = "color: orange;";
  else if (type === "error") msgStyle = "color: red;";
  else {
    let hash = 0;
    for (let i = 0; i < message.length; i++) hash = (hash * 31 + message.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    msgStyle = `color: hsl(${hue}, 75%, 55%);`;
  }

  const hexRegex = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
  const parts = [];
  let lastIndex = 0, match;
  while ((match = hexRegex.exec(message)) !== null) {
    if (match.index > lastIndex) parts.push({ text: message.slice(lastIndex, match.index), style: msgStyle });
    parts.push({ text: match[0], style: `color: white; background-color: ${match[0]}; font-weight: bold; padding: 0 2px;` });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.length) parts.push({ text: message.slice(lastIndex), style: msgStyle });

  const fmtParts = [];
  const stylesArr = [];
  if (prefixText) { fmtParts.push(`%c${prefixText}`); stylesArr.push(prefixStyle); }
  for (const p of parts) { fmtParts.push(`%c${p.text}`); stylesArr.push(p.style); }

  if (csStyleEnabled) method(fmtParts.join(""), ...stylesArr);
  else method(`[${String(prefix).toUpperCase()}] ${message}`);
}

/** Disable styled logging */
cs.clear = () => csStyleEnabled = false;
/** Enable styled logging */
cs.apply = () => csStyleEnabled = true;
//#endregion

function el(type = "span", attrs = {}) {
  const element = document.createElement(type);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'style') Object.assign(element.style, value);
    else element.setAttribute(key, value);
  }
  return element;
}
function $(selector = '') {
    if (selector.startsWith('#')) return document.getElementById(selector.slice(1));
    if (selector.startsWith('.')) return document.querySelector(selector);
    if (document.getElementById(selector)) {
        return document.getElementById(selector);
    } else {
        return document.querySelector('.' + selector);
    }
}
function PTT(forKind = Object, methodName, method, { getter = false } = {}) {
  if (!forKind || !methodName || typeof method !== "function") return;
  const proto = forKind.prototype;
  if (methodName in proto) return;

  if (getter) Object.defineProperty(proto, methodName, { get() { return method.call(this); }, configurable: true, enumerable: false });
  else proto[methodName] = method;
}
PTT(Object, "PTT", function(methodName, method, options) { PTT(this, methodName, method, options); });

const ctxmenu = (() => {
	let currentMenu = null;
	// Global close handler
	const closeMenu = e => {
		if (currentMenu && !currentMenu.contains(e.target)) {
			currentMenu.remove();
			currentMenu = null;
		}
	};
	document.addEventListener('click', closeMenu);
	document.addEventListener('contextmenu', e => {
		if (currentMenu && !currentMenu.contains(e.target)) {
			// Only close if the click is **not the event that opened the menu**
			if (!e._ctxmenuOpening) {
				closeMenu(e);
			}
		}
	});

	const buildItems = (container, items, parentDisabled = false) => {
		items.forEach(item => {
			if (item === "separator") {
				const hr = document.createElement('hr');
				Object.assign(hr.style, { border:'none', borderTop:'1px solid #555', margin:'4px 0' });
				container.appendChild(hr);
				return;
			}

			const isDisabled = parentDisabled || item.disabled === true;
			const div = document.createElement('div');
			Object.assign(div.style, {
				padding: '6px 12px',
				cursor: isDisabled ? 'default' : 'pointer',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: '8px',
				whiteSpace: 'nowrap',
				color: isDisabled ? '#888' : '#ddd',
				transition: 'background 0.1s ease',
				position: 'relative',
			});

			const labelEl = document.createElement('span');
			labelEl.textContent = item.label || "Unnamed";
			labelEl.style.pointerEvents = 'none';
			div.appendChild(labelEl);

			if (item.control) {
				const controlEl = document.createElement('span');
				controlEl.textContent = item.control;
				Object.assign(controlEl.style, { fontSize:'12px', pointerEvents:'none', color:isDisabled?'#888':'#ddd' });
				div.appendChild(controlEl);
			}

			let submenuEl;
			if (item.submenu && Array.isArray(item.submenu) && item.submenu.length) {
				const arrowEl = document.createElement('span');
				arrowEl.textContent = '▸';
				Object.assign(arrowEl.style, { fontSize:'12px', pointerEvents:'none', color:isDisabled?'#888':'#ddd' });
				div.appendChild(arrowEl);

				submenuEl = document.createElement('div');
				submenuEl.classList.add('custom-submenu');
				Object.assign(submenuEl.style, {
					position:'absolute', top:'0', left:'100%',
					display:'none', background:'#242424', border:'3px solid #242424',
					borderRadius:'4px', minWidth:'120px', boxShadow:'2px 2px 6px rgba(0,0,0,0.2)',
					opacity:0, transform:'translateY(-4px)', transition:'opacity 0.15s, transform 0.15s',
					pointerEvents: 'auto',
				});
				buildItems(submenuEl, item.submenu, isDisabled);
				div.appendChild(submenuEl);
			}

			if (!isDisabled) {
				div.addEventListener('mouseenter', () => {
					div.style.background = '#303030';
					if (submenuEl) {
						submenuEl.style.display = 'block';
						requestAnimationFrame(() => {
							submenuEl.style.opacity = 1;
							submenuEl.style.transform = 'translateY(0)';
							const rect = submenuEl.getBoundingClientRect();
							const vw = document.documentElement.clientWidth;
							const vh = document.documentElement.clientHeight;
							if (rect.right > vw) submenuEl.style.left = `-${rect.width}px`;
							if (rect.bottom > vh) submenuEl.style.top = `${vh - rect.bottom - 4}px`;
						});
					}
				});
				div.addEventListener('mouseleave', () => {
					div.style.background = '';
					if (submenuEl) {
						submenuEl.style.opacity = 0;
						submenuEl.style.transform = 'translateY(-4px)';
						setTimeout(() => submenuEl.style.display = 'none', 150);
					}
				});
			}

			div.addEventListener('click', e => {
				e.stopPropagation();
				if (isDisabled) return;
				if (typeof item.action === 'function') item.action();
				if (currentMenu) { currentMenu.remove(); currentMenu = null; }
			});

			container.appendChild(div);
		});
	};

	return (el, options = []) => {
		if (!(el instanceof Element)) throw new TypeError("ctxmenu expects a DOM Element");

		el.addEventListener('contextmenu', e => {
			e.preventDefault();
			e._ctxmenuOpening = true;
			if (currentMenu) currentMenu.remove();

			const menu = document.createElement('div');
			currentMenu = menu;
			menu.classList.add('custom-context-menu');
			Object.assign(menu.style, {
				position:'absolute', background:'#242424', border:'3px solid #242424',
				borderRadius:'4px', minWidth:'120px', boxShadow:'2px 2px 6px rgba(0,0,0,0.2)',
				fontSize:'14px', fontFamily:'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				color:'#ddd', zIndex:1000, opacity:0, transform:'translateY(-4px)',
				transition:'opacity 0.15s, transform 0.15s'
			});

			buildItems(menu, options);
			document.body.appendChild(menu);

			// Position menu safely
			const offset = 4;
			const rect = menu.getBoundingClientRect();
			let left = e.clientX + offset;
			let top = e.clientY + offset;
			const vw = document.documentElement.clientWidth;
			const vh = document.documentElement.clientHeight;
			if (left + rect.width > vw) left = vw - rect.width - offset;
			if (top + rect.height > vh) top = vh - rect.height - offset;
			menu.style.left = `${left}px`;
			menu.style.top = `${top}px`;
		
			requestAnimationFrame(() => {
				menu.style.opacity = 1;
				menu.style.transform = 'translateY(0)';
			});
		});
	};
})();
Element.PTT("ctxmenu",function(options){ ctxmenu(this, options); });

Function.PTT("debounce", function(delay = 300) {
  let timeoutId;
  const func = this; // reference the original function
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
});

function range(from = 0, to = 10) {
    return Array.from({ length: to - from }, (_, i) => i + from);
}

Math.clamp = function(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
Array.PTT("unique", function() {
    return [...new Set(this)];
});