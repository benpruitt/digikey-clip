/**
 * settings.js
 * (c) Ben Pruitt, 2017 [MIT License, see LICENSE]
 *
 * js logic for the settings dialog for digikey-clip
 *
 */

// Create an HTML list from `list_arr` inside of the ul element with id
// `ul_el_id`
// note that the innerHTML and data-id attributes of the list items will both
// be the respective value of `list_arr`
function createList(ul_el_id, list_arr) {
  var cont = document.getElementById(ul_el_id);
  cont.innerHTML = '';
  list_arr.forEach(function(val) {
    var span_el = document.createElement('span');
    span_el.className = 'dragico';
    var li_el = document.createElement('li');
    li_el.appendChild(span_el);
    li_el.setAttribute('data-id', val);
    li_el.innerHTML += val;
    cont.appendChild(li_el);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // we'll store our active fields in the chrome sync storage so that they
  // will persist across devices if the user is logged in
  chrome.storage.sync.get(
    ['active-fields', 'inactive-fields'],
    function(res){
      // if the user has not used this extension then the defaults will be
      // left in place, otherwise we will dynamically create the lists from
      // the save orders
      if (res['active-fields'] && res['inactive-fields']) {
        createList('active-fields', res['active-fields']);
        createList('inactive-fields', res['inactive-fields']);
      }
      var el1 = document.getElementById('active-fields');
      var el2 = document.getElementById('inactive-fields');
      // we use sortable js (https://github.com/RubaXa/Sortable) for our
      // draggable lists
      var s1 = Sortable.create(el1, {
        group: "digikey-clip",
      });
      var s2 = Sortable.create(el2, {
        group: "digikey-clip",
      });
      // when the user clicks save we drop everything into the sync local
      // storage
      document.getElementById("save-btn").onclick = function() {
        chrome.storage.sync.set({
          'active-fields': s1.toArray(),
          'inactive-fields': s2.toArray()
        });
      }
    }
  );
});
