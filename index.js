var marked = require('marked'),
    _ = require('lodash'),
    usedAnchors = {},
    renderer;

/**
 * Render html from markdown with custom bem-site renderer
 * @param {String} markdown(required) - source md
 * @param {Options} options - custom options to marked module
 * @param {Function} cb(required) - callback function
 */
function render(markdown, options, cb) {
    var args = Array.prototype.slice.call(arguments);

    // check markdown string
    if (!markdown) throw new Error('Markdown string should be passed in arguments');
    if (!_.isString(markdown)) throw new Error('Markdown must be a string');

    // check arguments length
    if (args.length === 3) {
        if (!_.isObject(options)) throw new Error('Options must be an object');
        if (!_.isFunction(cb)) throw new Error('Callback must be a function');
    } else {
        if (!_.isFunction(arguments[1])) {
            throw new Error('If the options is not passed, the second argument must be a callback function');
        }

        // set requires variables
        options = {};
        cb = args[1];
    }

    // render html from markdown
    marked(markdown, _.extend({
        gfm: true,
        pedantic: false,
        sanitize: false,
        renderer: getRenderer()
    }, options), function (err, result) {
        if (err) return cb(err);

        return cb(null, result);
    });
}

/**
 * Create instance of new Marked renderer
 * Contain custom renderer for:
 * 1. Heading, GitHub style with anchors and links inside
 * 2. Table for fix trouble with page scroll, when table is so wide
 * @returns {*|Renderer}
 */
function createRenderer() {
    renderer = new marked.Renderer();

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
        console.log('usedAnchors', usedAnchors);

        anchor = modifyDuplicate(anchor);

        return '<h' + level + ' id="' + anchor + '"><a href="#' + anchor + '" class="anchor"></a>' +
            text + '</h' + level + '>\n';
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
 * Return an instance of custom marked renderer
 * Reset usedAnchors variable,
 * which need to check duplicate headers in the markdown
 * @returns {*}
 */
function getRenderer() {
    if (!renderer) renderer = createRenderer();

    usedAnchors = {};
    return renderer;
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
