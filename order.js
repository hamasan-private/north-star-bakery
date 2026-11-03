/* Order builder for products.html: filter the list, then add items to the
   order that is saved in localStorage and reused on contact.html. */

var currentFilter = 'all';

function renderFilterButtons() {
  var holder = document.getElementById('order-filters');
  if (!holder) {
    return;
  }
  holder.textContent = '';
  FILTERS.forEach(function (filter) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-button';
    button.textContent = filter.label;
    button.setAttribute('data-filter', filter.id);
    button.setAttribute('aria-pressed', String(filter.id === currentFilter));
    button.addEventListener('click', function () {
      currentFilter = filter.id;
      renderFilterButtons();
      renderProductCards();
    });
    holder.appendChild(button);
  });
}

function renderProductCards() {
  var list = document.getElementById('product-list');
  if (!list) {
    return;
  }
  list.textContent = '';

  var order = readOrder();
  var visible = PRODUCTS.filter(function (product) {
    return currentFilter === 'all' || product.category === currentFilter;
  });

  visible.forEach(function (product) {
    var card = document.createElement('article');
    card.className = 'product-card';

    var name = document.createElement('h3');
    name.textContent = product.name;

    var category = document.createElement('p');
    category.className = 'product-category';
    category.textContent = CATEGORY_LABELS[product.category];

    var note = document.createElement('p');
    note.className = 'product-note';
    note.textContent = product.note;

    var price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = formatMoney(product.price);

    var inOrder = order.find(function (line) {
      return line.id === product.id;
    });

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'add-button';
    button.textContent = inOrder ? 'Add another (' + inOrder.qty + ')' : 'Add to my order';
    button.setAttribute('aria-label', 'Add ' + product.name + ' to my order');
    button.addEventListener('click', function () {
      addToOrder(product.id);
    });

    card.appendChild(category);
    card.appendChild(name);
    card.appendChild(note);
    card.appendChild(price);
    card.appendChild(button);
    list.appendChild(card);
  });

  if (visible.length === 0) {
    var empty = document.createElement('p');
    empty.textContent = 'Nothing in that category today. Try another one.';
    list.appendChild(empty);
  }
}

function addToOrder(id) {
  var order = readOrder();
  var line = order.find(function (item) {
    return item.id === id;
  });
  if (line) {
    line.qty = Math.min(line.qty + 1, 99);
  } else {
    order.push({ id: id, qty: 1 });
  }
  saveOrder(order);
  renderProductCards();
  renderOrderPanel();
  updateOrderBadge();
}

function changeQuantity(id, difference) {
  var order = readOrder();
  var line = order.find(function (item) {
    return item.id === id;
  });
  if (!line) {
    return;
  }
  line.qty += difference;
  var updated = order.filter(function (item) {
    return item.qty > 0;
  });
  saveOrder(updated);
  renderProductCards();
  renderOrderPanel();
  updateOrderBadge();
}

function removeFromOrder(id) {
  var remaining = readOrder().filter(function (line) {
    return line.id !== id;
  });
  saveOrder(remaining);
  renderProductCards();
  renderOrderPanel();
  updateOrderBadge();
}

function clearOrder() {
  saveOrder([]);
  renderProductCards();
  renderOrderPanel();
  updateOrderBadge();
}

function renderOrderPanel() {
  var list = document.getElementById('order-lines');
  var summary = document.getElementById('order-summary');
  if (!list || !summary) {
    return;
  }
  list.textContent = '';

  var order = readOrder();
  if (order.length === 0) {
    var empty = document.createElement('li');
    empty.className = 'order-empty';
    empty.textContent = 'Nothing here yet. Add something from the list above.';
    list.appendChild(empty);
  }

  order.forEach(function (line) {
    var product = findProduct(line.id);
    var item = document.createElement('li');
    item.className = 'order-line';

    var text = document.createElement('span');
    text.className = 'order-line-text';
    text.textContent = product.name + ' \u00d7 ' + line.qty;

    var price = document.createElement('span');
    price.className = 'order-line-price';
    price.textContent = formatMoney(product.price * line.qty);

    var controls = document.createElement('span');
    controls.className = 'order-controls';

    var less = document.createElement('button');
    less.type = 'button';
    less.className = 'qty-button';
    less.textContent = '\u2212';
    less.setAttribute('aria-label', 'One fewer ' + product.name);
    less.addEventListener('click', function () {
      changeQuantity(line.id, -1);
    });

    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'qty-button';
    more.textContent = '+';
    more.setAttribute('aria-label', 'One more ' + product.name);
    more.addEventListener('click', function () {
      changeQuantity(line.id, 1);
    });

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + product.name);
    remove.addEventListener('click', function () {
      removeFromOrder(line.id);
    });

    controls.appendChild(less);
    controls.appendChild(more);
    controls.appendChild(remove);

    item.appendChild(text);
    item.appendChild(price);
    item.appendChild(controls);
    list.appendChild(item);
  });

  var count = countOrder(order);
  summary.textContent = count === 0
    ? 'Your order is empty.'
    : count + (count === 1 ? ' item, ' : ' items, ') + formatMoney(totalOrder(order)) + ' total';
}

function setupOrderPage() {
  if (!document.getElementById('product-list')) {
    return;
  }
  renderFilterButtons();
  renderProductCards();
  renderOrderPanel();

  var clear = document.getElementById('clear-order');
  if (clear) {
    clear.addEventListener('click', clearOrder);
  }

  document.addEventListener('DOMContentLoaded', updateOrderBadge);
}

setupOrderPage();
