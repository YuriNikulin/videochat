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

function fullHeight() {
	var container = $('.full-height');
	var mainContent = $('.header');
	var browserHeight, mainContentHeight, resultHeight;

	function calculate() {
		browserHeight = $(window).height();
		mainContentHeight = mainContent.outerHeight();
		resultHeight = browserHeight - mainContentHeight;
		container.css('min-height', resultHeight);
	}
	calculate();
}
fullHeight();

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

