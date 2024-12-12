export function hideKeyboard() {
  // this set timeout needed for case when hideKeyboard is called inside of 'onfocus' event handler
  setTimeout(function () {
    const field = document.createElement('input');
    field.setAttribute('type', 'text');
    // -webkit-user-modify is nessesary for Android 4.x
    field.setAttribute(
      'style',
      'position:absolute; top: 0px; opacity: 0; -webkit-user-modify: read-write-plaintext-only; left:0px;'
    );
    document.body.appendChild(field);

    // adding onfocus event handler for the temp field
    field.onfocus = function () {
      field.setAttribute('style', 'display:none;');
      setTimeout(function () {
        document.body.removeChild(field);
        document.body.focus();
      }, 14);
    };
    field.focus();
  }, 50);
}
