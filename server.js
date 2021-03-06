var Express = require('express');
var BodyParser = require('body-parser');
var Jade = require('jade');
var Typeset = require('./typeset.js');
var util = require('util');

var SERVER = process.env.SERVER || '127.0.0.1';
var PORT = process.env.PORT || '9999';

// Install the routes.
var router = Express.Router();
router.post('/', function(req, res) {
  var cd = new Date();
  var requestString = req.body.text;
  var bpr = 'math\\!';
  console.log(cd + ":" + requestString);
  console.log( " going to send "+bpr );
  var typesetPromise = Typeset.typeset(requestString,'');
  if (typesetPromise === null) {
    res.send('no text found to typeset');
    res.end(); // Empty 200 response -- no text was found to typeset.
    return;
  }
  var promiseSuccess = function(mathObjects) {
    var locals = {'mathObjects': mathObjects,
                  'serverAddress': util.format('http://bits.csb.pitt.edu/mathslax/')};
    var htmlResult = Jade.renderFile('./views/slack-response.jade', locals);
    res.json({'text' : requestString,'response_type':'in_channel',"attachments": [
       {"image_url": htmlResult}]});
    res.end();
  };
  var promiseError = function(error) {
    console.log('Error in typesetting:');
    console.log(error);
    res.end(); // Empty 200 response.
  };
  typesetPromise.then(promiseSuccess, promiseError);
});
router.post('/slashtypeset', function(req, res) {
  var cd = new Date();
  var requestString = req.body.text;
  var typesetPromise = Typeset.typeset(requestString,'');
  if (typesetPromise === null) {
    res.send('no text found to typeset');
    res.end(); // Empty 200 response -- no text was found to typeset.
    return;
  }
  var promiseSuccess = function(mathObjects) {
    var locals = {'mathObjects': mathObjects,
                  'serverAddress': util.format('http://bits.csb.pitt.edu/mathslax/')};
    var htmlResult = Jade.renderFile('./views/slack-slash-response.jade', locals);
    res.send(htmlResult);
    res.end();
  };
  var promiseError = function(error) {
    console.log('Error in typesetting:');
    console.log(error);
    res.end(); // Empty 200 response.
  };
  typesetPromise.then(promiseSuccess, promiseError);
});


// Start the server.
var app = Express();
app.use(BodyParser.urlencoded({extended: true}));
app.use(BodyParser.json());
app.use('/static', Express.static('static'));
app.use('/', router);

app.listen(PORT);
console.log("Mathslax is listening at http://%s:%s/", SERVER, PORT);
console.log("Make a test request with something like:");
console.log("curl -v -X POST '%s:%d/typeset' --data " +
            "'{\"text\": \"math! f(x) = x^2/sin(x) * E_0\"}' " +
            "-H \"Content-Type: application/json\"", SERVER, PORT);
console.log('___________\n');
