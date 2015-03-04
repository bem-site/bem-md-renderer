# bem-md-renderer
Markdown renderer for Github like anchors. Use on bem-sites with npm module https://github.com/chjj/marked 

## Usage

Minimal usage:

```
var bmdr = require('bem-md-renderer');
bmdr.render('I am using __markdown__.', function(err, result) {
    if(err) throw err;
    
    console.log('result', result);
});
// Outputs: <p>I am using <strong>markdown</strong>.</p>
```
 
## API

## bmdr.render(markdownString [,options], callback);
### markdownString

Type: `string`

Required. String of markdown source to be compiled.

### options

Type: `object`

Hash of options. All available options can be viewed in `marked` module docs https://github.com/chjj/marked

### callback

Type: `function`

Required. Function called when the `markdownString` has been fully parsed when using
async highlighting. If the `options` argument is omitted, this can be used as
the second argument.

## bmdr.getRenderer();
Return an instance of custom marked renderer.

Example:

```
var marked = require('marked'),
    bmdr = required('bem-md-renderer');
    
var html = marked('## Some title\n## Some title', {
    gfm: true,
    pedantic: false,
    sanitize: false,
    renderer: bmdr.getRenderer() // get custom renderer
});

console.log(html);
/**
 * Outputs: 
 * <h2 id="some-title"><a href="#some-title"></a>some-title</h2>
 * <h2 id="some-title-1"><a href="#some-title-1"></a>some-title</h2>
 */
``` 
 
**Note #1:** The titles are identical, but both has a different anchors
**Note #2:** You can make possible a copy anchor by click on `<a>` inside headline, when you hover it 
**Note #3:** Work good with TOC https://github.com/eGavr/toc-md

## bmdr.getAnchor(anchorString);

Return an anchor, create in Github styles

### anchorString

Type: `string`

Required. String of headline text. Work with latin and cyrilic symbols

Example:

```
var bmdr = require('bem-md-renderer');
console.log(bmdr.getAnchor('Create a decl for a "heavy" block requested by demand'));
// Outputs: create-a-decl-for-a-heavy-block-requested-by-demand
```

