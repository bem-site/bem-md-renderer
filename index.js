var marked = require('marked'),
    extend = require('util')._extend,
    usedAnchors = {},
    renderer;

/**
 * Render html from markdown with custom bem-site renderer
 * @param {String} markdown(required) - source md
 * @param {Options} options - custom options to marked module
 * @param {Function} cb(required) - callback function
 */
function render(markdown, options, cb) {
    if (!markdown || !typeof markdown === 'string') throw new Error('First argument must be a markdown string');

    if (typeof options === 'function') {
        cb = options;
        options = {};
    }

    // render html from markdown
    return marked(markdown, extend({
        gfm: true,
        pedantic: false,
        sanitize: false, // in many cases md uses html to insert iframe or img on bem.info
        renderer: getRenderer()
    }, options), cb);
}

/**
 * Create instance of new Marked renderer
 * Contain custom renderer for:
 * 1. Heading, GitHub style with anchors and links inside
 * 2. Table for fix trouble with page scroll, when table is so wide
 * @returns {*|Renderer}
 */
function createRenderer() {
    var Renderer = marked.Renderer,
        baseRenderer = Renderer.prototype;

    renderer = new Renderer();

    /**
     * Fix marked issue with cyrillic symbols replacing.
     *
     * @param {String} text test of header
     * @param {Number} level index of header
     * @param {String} raw
     * @param {Object} options options
     * @returns {String} result header string
     */
    renderer.heading = function (text, level, raw, options) {
        var anchor;

        options = options || {};
        options.headerPrefix = options.headerPrefix || '';

        anchor = options.headerPrefix + getAnchor(raw);
        anchor = modifyDuplicate(anchor);

        return '<h' + level + ' id="' + anchor + '"><a href="#' + anchor + '" class="anchor"></a>' +
            text + '</h' + level + '>\n';
    };

    /**
     * Replace video`s share service links to iframe video block
     * Examples markdown:
     * [Youtube 1](https://youtu.be/1GWoMnYldYc)
     * [Youtube 2](https://www.youtube.com/watch?v=4jrUgqMlvP0)
     * [Yandex](https://video.yandex.ru/iframe/ya-events/clg24o8tu3.7046/)
     * [Vimeo 1](https://vimeo.com/53219242/)
     * [Vimeo 2](https://player.vimeo.com/video/30838628)
     *
     * p.s. By default gets base renderer link
     * @param {String} href
     * @param {String} title
     * @param {String} text
     */
    renderer.link = function (href, title, text) {
        var result = baseRenderer.link.apply(this, arguments),
            services = {
                youtube: ['youtu.be', 'youtube.com'],
                yandex: [
                    'video.yandex.ru',
                    'static.video.yandex.ru'
                ],
                vimeo: ['vimeo.com', 'player.vimeo.com']
            };

        Object.keys(services).forEach(function (service) {
            var isSupportedService = services[service].some(function (link) {
                return href.indexOf(link) > -1;
            });

            // href contains link to support video service
            if (isSupportedService) {
                result = getIframe(href, service);
                return false;
            }
        });

        return result;
    };

    // Fix(hidden) post scroll, when it contains wide table
    renderer.table = function (header, body) {
        return '<div class="table-container">' +
            '<table>\n' +
            '<thead>\n' +
            header +
            '</thead>\n' +
            '<tbody>\n' +
            body +
            '</tbody>\n' +
            '</table>\n' +
            '</div>';
    };

    // Add container for inline html tables
    renderer.html = function (source) {
        var newHtml = source.replace(/<table>/, '<div class="table-container"><table>');
        return newHtml.replace(/<\/table>/, '</table></div>');
    };

    return renderer;
}

/**
 * Get service iframe video by passed name
 * Required href:
 * - youtube: https://youtu.be/1GWoMnYldYc or https://www.youtube.com/watch?v=1GWoMnYldYc
 * - yandex: https://video.yandex.ru/iframe/ya-events/clg24o8tu3.7046/
 * - vimeo: https://vimeo.com/30838628 or https://player.vimeo.com/video/30838628
 * @param {String} href - full video href, examples see above
 * @param {String} serviceName - name of the service [youtube, yandex, vimeo]
 * @returns {String} - iframe video block
 */
function getIframe(href, serviceName) {
    var serviceToUrl = {
            youtube: 'www.youtube.com/embed/',
            yandex: 'video.yandex.ru/iframe/ya-events/',
            vimeo: 'player.vimeo.com/video/'
        },
        arr = href.split('/'),
        key = arr.pop(),
        src;

    /**
     * Get the second last href arr item for key,
     * if href contains slash at the end and our key empty
     * For example: https://vimeo.com/53219242/
     */
    if (!key.length) {
        key = arr[arr.length - 1];
    }

    /**
     * Key contains extra words
     * For example:
     * Original href = http://www.youtube.com/watch?v=1GWoMnYldYc
     * key = watch?v=1GWoMnYldYc - we need remove watch?v=
     */
    if (serviceName === 'youtube' && key.indexOf('watch?v=') > -1) {
        key = key.match(/(\d\w).+$/gi)[0];
    }

    src = serviceToUrl[serviceName] + key;

    return '<iframe src="//' + src + '" width="560" height="315" frameborder="0" allowfullscreen></iframe>';
}

/**
 * Return an instance of custom marked renderer
 * Reset usedAnchors variable,
 * which needed to check duplicate headers in the markdown
 * @returns {*}
 */
function getRenderer() {
    usedAnchors = {};

    return renderer || (renderer = createRenderer());
}

/**
 * Returns an anchor for a given header
 * @param {String} headerText -> 'BEM templates' -> 'BEM-templates'
 * @returns {String}
 */
function getAnchor(headerText) {
    var anchor = headerText.replace(/( )/g, '-'),
        allowedChars = new RegExp('[A-Za-zА-Яа-яЁё0-9_\\- ]', 'g');

    anchor = anchor.match(allowedChars) || [];

    var _anchor = '';
    for (var i = 0; i < anchor.length; i++) {
        _anchor += anchor[i].match(/[A-Z]/) ? anchor[i].toLowerCase() : anchor[i];
    }

    return _anchor;
}

/**
 * Modify duplicate headers on the page by GitHub rules
 * For example: we found two identical header: examples and examples
 * In this case, to make the anchors on these different headers,
 * we need add to second header anchor him count, e.g. examples-1
 * @param {String} anchor source anchor
 * @returns {String} modify anchor
 */
function modifyDuplicate(anchor) {
    if (usedAnchors.hasOwnProperty(anchor)) {
        anchor += '-' + usedAnchors[anchor]++;
    } else {
        usedAnchors[anchor] = 1;
    }

    return anchor;
}

exports.getRenderer = getRenderer;
exports.getAnchor = getAnchor;
exports.render = render;
