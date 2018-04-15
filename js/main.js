'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var isInitiatorCustom = true;
var localStream;
var pc;
var remoteStream;
var turnReady;
var isError = false;
var isHostAgreed = false;
var remoteRoomName;



var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};


// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};


var room;
var roomTitle = $('.room-name');
var roomName = document.cookie.match( /room=(.*)/);
if (roomName) {
  roomName = roomName[1];
  roomTitle.html(roomTitle.html() + ' ' + roomName);
}

else {
  isError = true;
  showLocalError(roomTitle, 'You haven\'t selected a room name, you can return to homepage and choose one in order to create a new room or join existing', 'pos-relative');
}

room = roomName;
console.log(room);
// Could prompt for room name:
// room = prompt('Enter room name:');
var socket = io.connect();

socket.emit('main check', room);

if (room !== '' && !isError) {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('main check answer', function(remoteRoom) {
  if (remoteRoom == room) {
    isStarted = false;
    isChannelReady = true;
    var remoteContainer = $('.videos__remote');
    remoteContainer.find('.videos__text-container').remove();
    remoteContainer.append('<div class="videos__text-container"><span class="videos__span videos__text">Some user is calling you</span><span class="videos__text ui videos__btn js--accept-call">Accept</span></div>');
    setTimeout(function() {
      remoteContainer.find('.videos__text-container').addClass('shown');
    }, 50);
    remoteContainer.find('.js--accept-call').on('click', function() {
      isHostAgreed = true;
      remoteContainer.find('.videos__text-container').remove();
      socket.emit('host is agreed', room);
    })
  } else {
    isStarted = true;
    isChannelReady = false;
  }
})

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  // debugger;
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
  // debugger;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
})
.then(gotStream)
.catch(function(e) {
  // alert('Error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  if (isError) {
    return false;
  }
  
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

var constraints = {
  video: true,
  audio: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

function maybeStart() {
  // if (!isHostAgreed) {
  //   return false;
  // }
  // debugger;
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);

    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
      doCall();
  }
  
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  // debugger;
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
    function ex() {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
  }

  socket.on('host agreed', function() {
    fullHeight();
    ex();
  });
  
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function setBandwidth(sdp) {
  var audioBandwidth = 30;
  var videoBandwidth = 256;
  
    sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + audioBandwidth + '\r\n');
    sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + videoBandwidth + '\r\n');
    return sdp;
}

function doAnswer() {


    console.log('Sending answer to peer.');
    pc.createAnswer().then(
      setLocalAndSendMessage,
      onCreateSessionDescriptionError
    );

}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  // sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);

}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  function ex() {

    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
  }

  socket.on('host agreed', function() {
    ex();
  })
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  pc.close();
  pc = null;
}

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('m=audio') !== -1) {
      mLineIndex = i;
      break;
    }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
          opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length - 1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}
