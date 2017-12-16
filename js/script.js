$('.js--create-room-opener').on('click', function() {
	createRoomInputShow($(this));
	return false;
})

$('.js--call-room-opener').on('click', function() {
	callRoomInputShow($(this));
	return false;
})

$('.js--create-room').on('click', function() {
	createRoom($(this).parent());
});

$('.js--home').on('click', function() {
	redirectToHomepage();
	return false;
})

$('.js--popup-closer').on('click', function() {
	hideElem(($(this)).parents('.popup').first());
})

function redirectToChat() {
	var oldHref = window.location.href;
	console.log(document.cookie);
	window.location = '/test.html';
}

function redirectToHomepage() {
	window.location = '/';
}

function createRoom(container) {
	var input = container.find('.create-room__input'),
		roomName = input.val();
	if (!roomName) {
		showLocalError(container, 'You need to enter a name for your room');
		return false;
	}
	document.cookie = 'room=' + roomName;
	redirectToChat();
}