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

	socket.on('main check', function(room) {
		socket.broadcast.emit('main check answer', room);
	})

	socket.on('hard start', function(room) {
		socket.broadcast.emit('message', room);
	});

	socket.on('host is agreed', function(room) {
		socket.emit('host agreed')
		socket.broadcast.emit('host agreed');
	})

	socket.on('chat message', function(msg) {
		io.emit('chat message', msg);
	});

	function log() {
	    var array = ['Message from server:'];
	    array.push.apply(array, arguments);
	    socket.emit('log', array);
	}

		socket.on('message', function(message) {
		    log('Client said: ', message);
		    // for a real app, would be room-only (not broadcast)
		    socket.broadcast.emit('message', message);
		  });

	  socket.on('create or join', function(room) {
	    log('Received request to create or join room ' + room);

	    var numClients = io.sockets.sockets.length;
	    log('Room ' + room + ' now has ' + numClients + ' client(s)');

	    if (numClients === 1) {
	      socket.join(room);
	      log('Client ID ' + socket.id + ' created room ' + room);
	      socket.emit('created', room, socket.id);

	    } else if (numClients === 2) {
	      log('Client ID ' + socket.id + ' joined room ' + room);
	      io.sockets.in(room).emit('join', room);
	      socket.join(room);
	      socket.emit('joined', room, socket.id);
	      io.sockets.in(room).emit('ready');
	    } else { // max two clients
	      socket.emit('full', room);
	    }
	  });

	  socket.on('ipaddr', function() {
	    var ifaces = os.networkInterfaces();
	    for (var dev in ifaces) {
	      ifaces[dev].forEach(function(details) {
	        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
	          socket.emit('ipaddr', details.address);
	        }
	      });
	    }
	  });

	  socket.on('bye', function(){
	    console.log('received bye');
	  });

	

})

http.listen(process.env.PORT || 3000, function(){
	console.log('listening on *:3000');
})