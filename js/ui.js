function showElem(elem) {
	elem.removeClass('hidden');
	elem.addClass('shown');
}

function hideElem(elem) {
	elem.removeClass('shown');
	elem.addClass('hidden');
}

function createRoomInputShow(elem) {
	var container = elem.siblings('.toolbar-create-room');
	showElem(container);
	container.find('.create-room__input').focus();
}

function callRoomInputShow(elem) {
	var container = elem.siblings('.toolbar-call-room');
	showElem(container);
	container.find('.call-room__input').focus();
}

function showLocalError(elem, text, extraClass) {
	var oldError = elem.find('.error').remove();
	if (!extraClass) {
		var extraClass = '';
	}
	var errorLayout = '<div class="error popup ' + extraClass + '"><span class="error__text">' + text + '</span></div>'
	elem.append(errorLayout);
	setTimeout(function() {
		elem.find('.error').addClass('shown');
	}, 50);
}