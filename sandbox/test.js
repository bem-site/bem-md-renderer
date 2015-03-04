var fs = require('fs'),
    md = require('marked'),
    renderer = require('../index.js'),
    content = fs.readFileSync('./article.md', 'utf-8');
    //contentEn = fs.readFileSync('./article-en.md', 'utf-8');

//var result = md(content, {
//    gfm: true,
//    pedantic: false,
//    sanitize: false,
//    renderer: renderer.getRenderer()
//});

//var resultEn = md(contentEn, {
//    gfm: true,
//    pedantic: false,
//    sanitize: false,
//    renderer: renderer.getRenderer()
//});

//console.log('result', result);
//console.log('resultEn', resultEn);

renderer.render(content, function(err, result) {
    if(err) throw err;

    console.log('result marked', result);
});
