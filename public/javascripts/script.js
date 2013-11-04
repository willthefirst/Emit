$(function() {

	// Autoresize textarea
    var txt = $('.msg-body__textarea'),
        hiddenDiv = $(document.createElement('div')),
        content = null;

    txt.addClass('txtstuff no-scroll');
    hiddenDiv.addClass('hiddendiv common');

    $('body').append(hiddenDiv);

    txt.on('keyup', function () {

        content = $(this).val();

        content = content.replace(/\n/g, '<br>');
        hiddenDiv.html(content + '<br class="lbr">');

        $(this).css('height', (hiddenDiv.height()+60));
    });

    // Shortcut to send
    $(document).keydown(function(e) {
	    if (e.which === 13 && (e.ctrlKey || e.metaKey)) { // Ctrl + b
	        $("#gmail-form").submit();
	    }
    });
});