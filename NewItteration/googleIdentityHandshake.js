
function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    //request following
    var request =  gapi.client.youtube.captions.download({'id': '9P6rdqiybaw'});
    request.execute(function(response) { console.log(response) });
}

window.onload = function () {
  google.accounts.id.initialize({
    client_id: "787718893823-ief5upq817odgurk45ga691p9m3ejd57.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById("buttonDiv"),
    { theme: "outline", size: "large" }  // customization attributes
  );
  google.accounts.id.prompt(); // also display the One Tap dialog
}


