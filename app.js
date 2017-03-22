var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var conversation_id = "";
var w_conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: process.env.CONVERSATION_USERNAME || 'ce275acc-481f-4d17-ba3a-50816b09d7ff',
    password: process.env.CONVERSATION_PASSWORD || 'igrGT0SegeXe',
    version: 'v1',
    version_date: '2016-07-11'
});
var workspace = process.env.WORKSPACE_ID || '8be28395-8206-4a78-b8b2-8928342de0a6';

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'tokenDeVerificacaoFacebook') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Erro de validação no token.');
});

app.post('/webhook/', function (req, res) {
	var text = null;
	
    messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {	
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}
		
		var params = {
			input: text,
			context: {"conversation_id": conversation_id}
		}

		var payload = {
			workspace_id: workspace
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
    res.sendStatus(200);
});

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, convResults) {
        if (err) {
            return responseToRequest.send("Erro.");
        }
		
		if(convResults.context != null)
    	   conversation_id = convResults.context.conversation_id;
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){
				sendMessage(sender, convResults.output.text[i++]);
			}
		}
            
    });
}

function sendMessage(sender, text_) {
	text_ = text_.substring(0, 319);
	messageData = {	text: text_ };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

var token = "EAAMyn50WO6QBABrpvpwJQx08eDGItjvrgZBptfSlAAbsduxAspJj9fYpeI7Vvb0J8jRtZAcZAu0YI0E0ilmBdAhQltxdurUwCvKXca6QtnilZA7rxmcy2iE46B1PXPhVeg108Kv1BZC3ZBuit8YUvRPQiuXQ8V1fHcBUZCvOzIXrwZDZD";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);