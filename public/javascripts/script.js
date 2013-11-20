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
    // $(document).keydown(function(e) {
	   //  if (e.which === 13 && (e.ctrlKey || e.metaKey)) { // Ctrl + b
	   //      $("#gmail-form").submit();
	   //  }
    // });

    // <https://github.com/jaredhanson/passport-facebook/issues/12>
    if (window.location.hash && window.location.hash === "#_=_") {
      if (window.history && history.pushState) {
        window.history.pushState("", document.title, window.location.pathname);
      } else {
        // Prevent scrolling by storing the page's current scroll offset
        var scroll = {
          top: document.body.scrollTop,
          left: document.body.scrollLeft
        };
        window.location.hash = "";
        // Restore the scroll offset, should be flicker free
        document.body.scrollTop = scroll.top;
        document.body.scrollLeft = scroll.left;
      }
    }
});