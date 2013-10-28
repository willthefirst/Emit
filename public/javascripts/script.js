$(function () {
    var extractToken = function(hash) {
      var match = hash.match(/access_token=([\w-]+)/);
      return !!match && match[1];
    };

    var CLIENT_ID = "363206404232.apps.googleusercontent.com";
    var AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/auth";
    var RESOURCE_ENDPOINT = "https://api.soundcloud.com/me";
    var SCOPE = "https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/userinfo.profile& state=/profile";

    var token = extractToken(document.location.hash);
    if (token) {
      $('div.authenticated').show();

      $('span.token').text(token);

      $.ajax({
          url: RESOURCE_ENDPOINT
        , beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', "OAuth " + token);
            xhr.setRequestHeader('Accept',        "application/json");
          }
        , success: function (response) {
            var container = $('span.user');
            if (response) {
              container.text(response.username);
            } else {
              container.text("An error occurred.");
            }
          }
      });
    } else {
      $('div.authenticate').show();

      var authUrl = AUTHORIZATION_ENDPOINT +
        "?response_type=token" +
        "&client_id="    + CLIENT_ID +
        "&scope=" + SCOPE +
        "&redirect_uri=" + window.location;

      $("a.connect").attr("href", authUrl);
    }

    console.log('asd');
  });