/**
 * content.js
 * (c) Ben Pruitt, 2017 [MIT License, see LICENSE]
 *
 * js logic that will be injected into digikey pages, provides functionality
 * to copy part-related metadata from search / filter pages
 *
 */

// (somewhat hacky) means of setting the clipboard contents in chrome
function executeCopy(text) {
  // store window coordinates so that we can avoid a scroll event when we
  // focus on our injected textarea
  var x = window.scrollX, y = window.scrollY;
  // create a textarea to populate with the text to copy
  var input = document.createElement('textarea');
  document.body.appendChild(input);
  input.value = text;
  // focus on the input element + select so that when we execute the copy
  // command our text will be copied
  input.focus();
  input.select();
  // scroll to original viewport location
  window.scrollTo(x, y);
  document.execCommand('Copy');
  // remove the temporary text area
  input.remove();
}

// Safe text extraction w/ newline replacement
function getText(el) {
  var d = new DOMParser().parseFromString(el.innerHTML, 'text/html');
  return d.body.textContent.replace(/\r?\n|\r/g, ' ');
}

// Helper function to get nested child elements based on element
// tags / positions
function getNestedChild(el, child_tags, child_positions) {
  for (i = 0; i < child_tags.length; i++) {
    el = el.getElementsByTagName(child_tags[i])[child_positions[i]];
  }
  return el;
}

// Factory function to generate digikey part information getters
function genChildTextGetter(cell_class, child_tags, child_positions){
  var _getter = function(el) {
    var cell_el = el.getElementsByClassName(cell_class)[0];
    return getText(getNestedChild(cell_el, child_tags, child_positions));
  }
  return _getter;
}

// Getter functions for the various digikey fields
var DIGIKEY_GETTERS = {
  'digikey_description': genChildTextGetter('tr-description', [], []),
  'manufacturer_name': genChildTextGetter('tr-vendor', ['span', 'a', 'span'],
                                          [0, 0, 0]),
  'manufacturer_part_num': genChildTextGetter('tr-mfgPartNumber', ['a'], [0]),
  'digikey_part_num': genChildTextGetter('tr-dkPartNumber', ['a'], [0]),
  'digikey_label': function(){return 'Digikey';},
  'digikey_unit_price': genChildTextGetter('tr-unitPrice', [], []),
  'digikey_min_qty': genChildTextGetter('tr-minQty', [], []),
  'digikey_url': function(el) {
    var cell_el = el.getElementsByClassName('tr-dkPartNumber')[0];
    var a_el = getNestedChild(cell_el, ['a'], [0]);
    return 'https://www.digikey.com' + a_el.href;
  },
  'datasheet_url': function(el) {
    var cell_el = el.getElementsByClassName('tr-datasheet')[0];
    var a_el = getNestedChild(cell_el, ['a'], [0]);
    return a_el.href;
  }
}

// Click handler for the injected copy buttons
function handleCopyClick(ev) {
  ev.preventDefault();
  chrome.storage.sync.get(
    ['active-fields'],
    function(res){
      var acfs = res['active-fields'];
      if (!acfs) {
        alert('digikey-clip settings must be saved before copying!');
        return;
      }
      var part_row_el = ev.target.parentNode.parentNode.parentNode;
      var clip_text = '';
      for (var i = 0; i < acfs.length; i++) {
        console.log('[digikey-clip] getting field:', acfs[i]);
        var g_func = DIGIKEY_GETTERS[acfs[i]];
        if (g_func) {clip_text += g_func(part_row_el);}
        clip_text += '\t';
      }
      executeCopy(clip_text.substring(0, clip_text.length-1));
      ev.target.innerHTML = 'copied!';
      setTimeout(function() {ev.target.innerHTML='copy'}, 500);
    }
  )
}

// Find all of the td cells for item part numbers and add the copy button
var part_no_els = document.getElementsByClassName("tr-dkPartNumber");
for (var i=0; i < part_no_els.length; i++) {
  var btn_div = document.createElement('div');
  var btn = document.createElement('button');
  btn_div.appendChild(btn);
  btn.innerHTML = 'copy';
  btn.onclick = handleCopyClick;
  btn_div.setAttribute('style', 'position:"absolute"; right:0; right:0')
  btn_div.style.position = 'absolute';
  btn_div.style.right = 0;
  btn_div.style.top = 0;
  part_no_els[i].insertBefore(btn_div, part_no_els[i].firstChild);
  part_no_els[i].setAttribute('style', 'position: relative');
}
