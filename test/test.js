var marked = require('marked'),
    should = require('should');

    renderer = require('../index.js'),
    defaultOptions = {
        renderer: renderer.getRenderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: false,
        smartLists: true,
        smartypants: false
    },
    md = '# Setting a modifier on a block and reacting to it';

/**
 * Get new regexp to matching value of pass key
 * @param {String} key - e.g. html attr like id, class and anothers
 * @returns {RegExp}
 */
function getRegexp (key) {
    var reg = 'key=["\']((?:.(?!["\']?\s+(?:\S+)=|[>"\']))+.)'.replace('key', key);
    return new RegExp(reg);
}

/**
 * Get html attr value from input string
 * input: <h1 id="setting-a-modifier-on-a-block-and-reacting-to-it"></h1>
 * @param {String} html
 * @param {RegExp} regexp
 * @returns {String} setting-a-modifier-on-a-block-and-reacting-to-it
 */
function getAttrValue(html, regexp) {
    var result = regexp.exec(html);
    return (result && result.length > 1) ? regexp.exec(html)[1] : '';
}

marked.setOptions(defaultOptions);

describe('bem-md-renderer', function () {
    it('should be correct rendered github-like title id for anchor', function (done) {
        marked(md, function (err, html) {
            if (err) done(err);

            getAttrValue(html, getRegexp('id')).should.equal('setting-a-modifier-on-a-block-and-reacting-to-it');
            done();
        });
    });

    it('should be the same – title id and href anchor in link', function (done) {
        marked(md, function (err, html) {
            if (err) done(err);

            var anchor = getAttrValue(html, getRegexp('href'));

            anchor = anchor ? anchor.replace('#', '') : '';
            getAttrValue(html, getRegexp('id')).should.equal(anchor);
            done();
        });
    });
});
