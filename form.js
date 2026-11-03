/* Validation and storage for contact.html.
   Errors are written into the <p class="field-error"> under each field so the
   message sits where the user is looking. */

var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
var PHONE_PATTERN = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;

/* Two days' notice, and never a Monday because the bakery is closed. */
function earliestPickup() {
  var date = new Date();
  date.setDate(date.getDate() + 2);
  while (date.getDay() === 1) {
    date.setDate(date.getDate() + 1);
  }
  return toDateValue(date);
}

function toDateValue(date) {
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }
  var parts = value.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function showError(input, message) {
  var box = document.getElementById(input.id + '-error');
  if (box) {
    box.textContent = message;
  }
  input.setAttribute('aria-invalid', 'true');
}

function clearError(input) {
  var box = document.getElementById(input.id + '-error');
  if (box) {
    box.textContent = '';
  }
  input.removeAttribute('aria-invalid');
}

/* Each check returns an error message, or '' when the value is fine. */
function checkName() {
  var input = document.getElementById('name');
  if (input.value.trim().length === 0) {
    return 'Please tell us your name.';
  }
  if (input.value.trim().length < 2) {
    return 'That looks too short \u2014 please enter your full name.';
  }
  return '';
}

function checkEmail() {
  var input = document.getElementById('email');
  if (input.value.trim().length === 0) {
    return 'We need an email address to confirm your order.';
  }
  if (!EMAIL_PATTERN.test(input.value.trim())) {
    return 'Please use an address like name@example.com.';
  }
  return '';
}

function checkPhone() {
  var input = document.getElementById('phone');
  if (input.value.trim().length === 0) {
    return '';
  }
  if (!PHONE_PATTERN.test(input.value.trim())) {
    return 'Use the format 503-555-0134, with the dashes.';
  }
  return '';
}

function checkRequestType() {
  var input = document.getElementById('request-type');
  if (input.value === '') {
    return 'Choose what kind of request this is.';
  }
  return '';
}

function checkPickupDate() {
  var input = document.getElementById('pickup-date');
  var chosen = parseDateValue(input.value);
  if (!chosen) {
    return 'Pick the day you want to collect your order.';
  }
  if (chosen.getDay() === 1) {
    return 'We are closed on Mondays \u2014 please pick another day.';
  }
  var earliest = parseDateValue(earliestPickup());
  if (chosen < earliest) {
    return 'We need at least two days to bake it. Earliest pickup is ' + earliestPickup() + '.';
  }
  return '';
}

function checkItems() {
  var input = document.getElementById('items');
  if (input.value.trim().length === 0) {
    return 'Tell us what you would like, or add items on the breads page.';
  }
  if (input.value.trim().length < 10) {
    return 'Please add a little more detail so we can get it right.';
  }
  return '';
}

function checkConfirm() {
  var input = document.getElementById('confirm');
  if (!input.checked) {
    return 'Please confirm you understand the order is not final yet.';
  }
  return '';
}

var FIELDS = [
  { id: 'name', check: checkName },
  { id: 'email', check: checkEmail },
  { id: 'phone', check: checkPhone },
  { id: 'request-type', check: checkRequestType },
  { id: 'pickup-date', check: checkPickupDate },
  { id: 'items', check: checkItems },
  { id: 'confirm', check: checkConfirm }
];

function validateField(field) {
  var input = document.getElementById(field.id);
  var message = field.check();
  if (message) {
    showError(input, message);
  } else {
    clearError(input);
  }
  return message === '';
}

function validateForm() {
  var invalid = FIELDS.filter(function (field) {
    return !validateField(field);
  });
  return invalid.length === 0;
}

/* The saved order from products.html becomes the text of the items box. */
function prefillOrder() {
  var order = readOrder();
  var items = document.getElementById('items');
  var note = document.getElementById('order-note');
  var reset = document.getElementById('order-note-reset');
  if (order.length === 0) {
    if (note) {
      note.hidden = true;
    }
    if (reset) {
      reset.hidden = true;
    }
    return;
  }
  items.value = order.map(function (line) {
    var product = findProduct(line.id);
    return line.qty + ' \u00d7 ' + product.name + ' (' + formatMoney(product.price * line.qty) + ')';
  }).join('\n');

  var type = document.getElementById('request-type');
  if (type.value === '') {
    type.value = 'preorder';
  }

  if (reset) {
    reset.hidden = false;
  }
  if (note) {
    note.hidden = false;
    note.textContent = 'We filled this in from the ' + countOrder(order) + ' item' +
      (countOrder(order) === 1 ? '' : 's') + ' in your saved order, ' +
      formatMoney(totalOrder(order)) + ' total. You can edit it.';
  }
}

/* A pickup date the customer used last time is remembered. */
function prefillPickupDate() {
  var input = document.getElementById('pickup-date');
  var saved = localStorage.getItem(STORAGE_KEYS.pickupDate);
  input.min = earliestPickup();
  if (!saved) {
    return;
  }
  var parsed = parseDateValue(saved);
  if (!parsed || parsed.getDay() === 1 || parsed < parseDateValue(earliestPickup())) {
    return;
  }
  input.value = saved;
}

function submitForm(event) {
  event.preventDefault();

  var form = document.getElementById('request-form');
  var success = document.getElementById('form-success');

  if (!validateForm()) {
    var firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) {
      firstInvalid.focus();
    }
    if (success) {
      success.hidden = true;
    }
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.pickupDate, document.getElementById('pickup-date').value);
  } catch (error) {
    /* ignore blocked storage */
  }

  if (success) {
    success.hidden = false;
    success.textContent = 'Thanks, ' + document.getElementById('name').value.trim() +
      '. Your request is saved and Priya will reply by email within one business day.';
  }
}

function setupContactPage() {
  var form = document.getElementById('request-form');
  if (!form) {
    return;
  }
  prefillPickupDate();
  prefillOrder();

  form.addEventListener('submit', submitForm);

  /* Clear a message as soon as the user starts fixing that field. */
  FIELDS.forEach(function (field) {
    var input = document.getElementById(field.id);
    input.addEventListener('input', function () {
      var message = field.check();
      if (message === '') {
        clearError(input);
      }
    });
    input.addEventListener('change', function () {
      var message = field.check();
      if (message === '') {
        clearError(input);
      }
    });
  });

  var clearLink = document.getElementById('clear-saved-order');
  if (clearLink) {
    clearLink.addEventListener('click', function (event) {
      event.preventDefault();
      saveOrder([]);
      document.getElementById('items').value = '';
      document.getElementById('order-note').hidden = true;
      document.getElementById('order-note-reset').hidden = true;
      updateOrderBadge();
    });
  }
}

setupContactPage();
