/* eslint-env browser */
(function () {
	// Space optimisations
	var doc = document;
	var find = doc.querySelector.bind(doc);
	var create = doc.createElement.bind(doc);

	// Run callback when DOM is ready
	function domReady(cb) {
		// Run now if DOM has already loaded as we're loading async
		if (['interactive', 'complete'].indexOf(doc.readyState) >= 0) {
			cb();

		// Otherwise wait for DOM
		} else {
			doc.addEventListener('DOMContentLoaded', cb);
		}
	}

	// Feature detection
	var supports = {
		test: function (features) {
			var self = this;
			if (!features || features.length < 1) {
				return false;
			}
			return features.every(function (feature) {
				return self.tests[feature];
			});
		},
		tests: {
			localStorage: (function () {
				try {
					localStorage.setItem('test', 'test');
					localStorage.removeItem('test');
					return true;
				} catch (err) {
					return false;
				}
			})(),
			inlineSVG: (function () {
				var div = create('div');
				div.innerHTML = '<svg/>';
				return (
					typeof SVGRect !== 'undefined' &&
					div.firstChild &&
					div.firstChild.namespaceURI
				) === 'http://www.w3.org/2000/svg';
			})(),
			querySelector: typeof doc.querySelector === 'function',
			classList: (function () {
				var div = create('div');
				div.innerHTML = '<svg/>';
				return 'classList' in div.firstChild;
			})(),
			serviceWorker: 'serviceWorker' in navigator
		}
	};

	// Favourite nodes
	var favouriteNodes = {

		// Key used in localStorage
		storageKey: 'heartedNodes',

		// Url to heart SVG
		heartPath: '/assets/heart.svg',

		// Class added to heart SVG element when active
		activeClass: 'hearted',

		// Gets current node hash
		getCurrentNode: function () {
			var node = /^\/node\/([a-zA-Z0-9]+)/.exec(window.location.pathname);
			return node ? node[1] : node;
		},

		// Gets current node title
		getCurrentNodeTitle: function () {
			return find('h2.node-title .name').innerText;
		},

		// Gets hearted nodes
		getHeartedNodes: function () {
			return JSON.parse(localStorage.getItem(favouriteNodes.storageKey)) || {};
		},

		// Saves hearted nodes
		saveHeartedNodes: function (heartedNodes) {
			return localStorage.setItem(favouriteNodes.storageKey, JSON.stringify(heartedNodes));
		},

		// Checks if node is hearted
		isHearted: function (node) {
			return typeof favouriteNodes.getHeartedNodes()[node] !== 'undefined';
		},

		// Heart node
		heart: function (node) {
			var heartedNodes = favouriteNodes.getHeartedNodes();
			heartedNodes[node] = favouriteNodes.getCurrentNodeTitle();
			favouriteNodes.saveHeartedNodes(heartedNodes);
			favouriteNodes.updateHeartedNodesList();
			return heartedNodes;
		},

		// Unheart node
		unHeart: function (node) {
			var heartedNodes = favouriteNodes.getHeartedNodes();
			delete heartedNodes[node];
			favouriteNodes.saveHeartedNodes(heartedNodes);
			favouriteNodes.updateHeartedNodesList();
			return heartedNodes;
		},

		// Get list of hearted nodes
		updateHeartedNodesList: function () {
			var menu = find('.menu');
			if (!menu) {
				return false;
			}
			var menuHTML = '';
			var heartedNodes = favouriteNodes.getHeartedNodes();
			var nodeHashes = Object.keys(heartedNodes);
			if (nodeHashes.length > 0) {
				menuHTML += '<ul>';
				nodeHashes.forEach(function (node) {
					menuHTML += '<li><a href="/node/' + node + '">' + heartedNodes[node] + '</a></li>';
				});
				menuHTML += '</ul>';
			} else {
				menuHTML += '<div class="empty">Click the heart next to a node\'s title on it\'s own page to save it here for easy access :)</div>';
			}
			menu.innerHTML = menuHTML;
			return menu.innerHTML;
		},

		// Load SVG, run callback when loaded
		loadSVG: function (cb) {
			// Get heart SVG
			var xhr = new XMLHttpRequest();
			xhr.open('GET', favouriteNodes.heartPath);
			xhr.addEventListener('load', function () {
				cb(xhr.responseText);
			});
			xhr.send();
		},

		// Initiate node favouriting
		init: function () {
			// Start loading heart SVG before DOM
			favouriteNodes.loadSVG(function (svg) {
				// Create heart SVG elem
				var div = create('div');
				div.innerHTML = svg;
				var heartEl = div.firstChild;

				// Show heart as active if we've already hearted this node
				var node = favouriteNodes.getCurrentNode();
				if (favouriteNodes.isHearted(node)) {
					heartEl.classList.add(favouriteNodes.activeClass);
				}

				// Add click handler
				heartEl.addEventListener('click', function () {
					// Heart/unheart node
					var node = favouriteNodes.getCurrentNode();
					if (favouriteNodes.isHearted(node)) {
						heartEl.classList.remove(favouriteNodes.activeClass);
						favouriteNodes.unHeart(node);
					} else {
						heartEl.classList.add(favouriteNodes.activeClass);
						favouriteNodes.heart(node);
					}
				});

				// Then inject into DOM when it's ready
				domReady(function () {
					var headerHeight = find('.title').offsetHeight;
					var headerBoxShadow = 3;

					// Heart
					var titleEl = find('h2.node-title');
					if (titleEl) {
						titleEl.insertBefore(heartEl, titleEl.firstChild);
					}

					// Menu button
					var menuButton = create('div');
					menuButton.classList.add('menu-button');
					menuButton.style.height = headerHeight + 'px';
					menuButton.innerHTML = svg;
					menuButton.addEventListener('click', function () {
						favouriteNodes.updateHeartedNodesList();
						find('.menu').classList.toggle('active');
					});
					find('header .wrapper').appendChild(menuButton);

					// Menu
					var menu = create('div');
					menu.classList.add('menu');
					menu.style.top = (headerHeight + headerBoxShadow) + 'px';
					menu.style.height = 'calc(100% - ' + (headerHeight + headerBoxShadow) + 'px)';
					document.body.appendChild(menu);
					favouriteNodes.updateHeartedNodesList();
				});
			});

			// If current node is hearted
			var node = favouriteNodes.getCurrentNode();
			if (favouriteNodes.isHearted(node)) {
				// Heart it again so we get the new name if it's updated
				favouriteNodes.heart(node);
			}
		}
	};

	// Service worker
	if (supports.test(['serviceWorker', 'querySelector', 'classList'])) {
		// Register service worker
		navigator.serviceWorker.register('/sw.js');

		// Show cache message on stale pages
		domReady(function () {
			if (window.cacheDate) {
				var offlineMessage = create('div');
				offlineMessage.classList.add('cache-message');
				offlineMessage.innerText = '*There seems to be an issue connecting to the server. This data is cached from ' + window.cacheDate;
				var main = find('main');
				if (main) {
					doc.body.classList.add('no-connection');
					main.insertBefore(offlineMessage, main.firstChild);
				}
			}
		});
	}

	// Init favourite nodes
	if (supports.test(['localStorage', 'inlineSVG', 'querySelector', 'classList'])) {
		favouriteNodes.init();
	}

	// Add ios class to body on iOS devices
	if (supports.test(['classList'])) {
		domReady(function () {
			if (
				/iPad|iPhone|iPod/.test(navigator.userAgent) &&
				!window.MSStream
			) {
				doc.body.classList.add('ios');
			}
		});
	}
})();
