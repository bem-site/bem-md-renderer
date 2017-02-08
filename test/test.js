var fs = require('fs'),
    path = require('path'),
    should = require('should'),

    renderer = require('../index.js'),
    filePathName = path.join(__dirname, 'test'),

    CONTENT = {
        HEADING: {
            source: '# Setting a modifier on a block and reacting to it',
            result: '<h2 id="setting-a-modifier-on-a-block-and-reacting-to-it">' +
                    '<a href="#setting-a-modifier-on-a-block-and-reacting-to-it" class="anchor">' +
                    '</a>Setting a modifier on a block and reacting to it</h2>',
            idx: 'setting-a-modifier-on-a-block-and-reacting-to-it'
        },
        HEADING_WITH_ID: {
            source: '# Test {#custom}',
            result: '<h2 id="custom"><a href="#custom" class="anchor"></a>Test</h2>',
            idx: 'custom'
        },
        LINK: {
            source: '[Link](http://link.com/index "Custom title")',
            result: '<a href="http://link.com/index" title="Custom title">Link</a>'
        },
        VIDEO: {
            source: '[Video](https://youtu.be/1GWoMnYldYc)',
            result: '<iframe src="//www.youtube.com/embed/1GWoMnYldYc" width="560" height="315" frameborder="0"' +
                    ' allowfullscreen></iframe>'
        },
        DOC: {
            source: fs.readFileSync(filePathName + '.md').toString(),
            result: fs.readFileSync(filePathName + '.html').toString()
        },
        REGEXP: {
            // <h1 id="heading-143">heading-143</h1> -> replace `key` to `id` and get value of id attr
            attr: 'key=["\']((?:.(?!["\']?\s+(?:\S+)=|[>"\']))+.)',
            // <p><a href="link.com">Link</a></p>/n... -> replace `key` to `a` and get <a href="link.com">Link</a>
            tag: '<key.+<\/key>'
        }
    };

describe('bem-md-renderer', function () {
    it('should render md with custom renderer', function(done) {
        var DOC = CONTENT.DOC;

        renderer.render(DOC.source, function (err, html) {
            if (err) done(err);

            html.should.equal(DOC.result);
            done();
        });
    });

    describe('#anchors', function () {
        var HEADING = CONTENT.HEADING,
            SOURCE = HEADING.source;

        it('should be correct rendered github-like title id for anchor', function (done) {
            renderer.render(SOURCE, function (err, html) {
                if (err) done(err);

                getAttrValue(html, getRegexp('attr', 'id')).should.equal(HEADING.idx);
                done();
            });
        });

        it('should be the same – title id and href anchor in link', function (done) {
            renderer.render(SOURCE, function (err, html) {
                if (err) done(err);

                var anchor = getAttrValue(html, getRegexp('attr', 'href'));

                anchor = anchor ? anchor.replace('#', '') : '';
                getAttrValue(html, getRegexp('attr', 'id')).should.equal(anchor);
                done();
            });
        });
    });

    describe('#anchors-with-id', function () {
        var HEADING = CONTENT.HEADING_WITH_ID,
            SOURCE = HEADING.source;

        it('should be correct rendered github-like title with custom id for anchor', function (done) {
            renderer.render(SOURCE, function (err, html) {
                if (err) done(err);

                getAttrValue(html, getRegexp('attr', 'id')).should.equal(HEADING.idx);
                done();
            });
        });

        it('should be the same – title custom id and href anchor in link', function (done) {
            renderer.render(SOURCE, function (err, html) {
                if (err) done(err);

                var anchor = getAttrValue(html, getRegexp('attr', 'href'));

                anchor = anchor ? anchor.replace('#', '') : '';
                getAttrValue(html, getRegexp('attr', 'id')).should.equal(anchor);
                done();
            });
        });
    });

    describe('#link', function () {
        var LINK = CONTENT.LINK,
            VIDEO = CONTENT.VIDEO;

        it('should render link', function (done) {
            renderer.render(LINK.source, function (err, html) {
                if (err) done(err);

                getCleanedHtml('a', html).should.equal(LINK.result);
                done();
            });
        });

        it('should render video iframe', function (done) {
            renderer.render(VIDEO.source, function (err, html) {
                if (err) done(err);

                getCleanedHtml('iframe', html).should.equal(VIDEO.result);
                done();
            });
        });
    });
});

/**
 * Get new regexp to matching value of pass key
 * @param {String} type - type regexp match (atts || tag)
 * @param {String} key - e.g. html attr like id, class and anothers
 * @returns {RegExp}
 */
function getRegexp (type, key) {
    var reg = CONTENT.REGEXP[type].replace(/key/g, key);

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
    var result = html.match(regexp, 'g');
    
    return (result && result.length > 1) ? result[1] : '';
}

/**
 * Get cleaned html result by matched tag
 * For true compare, we need remove in result html
 * tags link `p` and new line symbol
 * html: <p><a href="http://link.com/index" title="Custom title">Link</a></p>\n
 * result = <a href="http://link.com/index" title="Custom title">Link</a>
 * @param {String} tag
 * @param {String} html
 * @returns {*}
 */
function getCleanedHtml(tag, html) {
    html = html.match(getRegexp('tag', tag), 'g');

    return html.length ? html[0] : '';
}
