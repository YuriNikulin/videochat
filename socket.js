var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var publicPath = path.resolve(__dirname, './');


 app.use(express.static(publicPath));
 app.get('/', function(req, res){
     res.sendFile('socket.html', {root: publicPath});
 });

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('disconnect', function() {
		console.log('user disconnected');
	})

	socket.on('chat message', function(msg) {
		io.emit('chat message', msg);
	});
})

http.listen(3000, function(){
	console.log('listening on *:3000');
})