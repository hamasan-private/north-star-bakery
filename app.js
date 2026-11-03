/* Shared data and helpers for the North Star Bakery site.
   Loaded on every page so the order badge in the navigation stays in sync. */

const STORAGE_KEYS = {
  order: 'northStarOrder',
  pickupDate: 'northStarPickupDate'
};

/* Prices are stored in cents so adding them together never produces
   something like 11.499999999. */
const PRODUCTS = [
  { id: 'country-sourdough', name: 'Country sourdough', price: 700, category: 'breads', note: 'The one Dot makes' },
  { id: 'sandwich-loaf', name: 'Honey oat sandwich loaf', price: 800, category: 'breads', note: 'Soft, sliced on request' },
  { id: 'seeded-rye', name: 'Seeded rye', price: 900, category: 'breads', note: 'Caraway and sunflower' },
  { id: 'baguette', name: 'Baguette', price: 450, category: 'breads', note: 'Saturdays only' },
  { id: 'croissant', name: 'Butter croissant', price: 450, category: 'pastries', note: 'Baked at 4 a.m.' },
  { id: 'almond-croissant', name: 'Almond croissant', price: 550, category: 'pastries', note: 'Filled and toasted' },
  { id: 'cinnamon-roll', name: 'Cinnamon roll', price: 450, category: 'pastries', note: 'Saturdays only' },
  { id: 'cookies', name: 'Cookies, half dozen', price: 1200, category: 'pastries', note: 'Oatmeal, chocolate chip, thumbprint' },
  { id: 'scone', name: 'Morning bun or scone', price: 425, category: 'pastries', note: 'Whatever Sam baked' },
  { id: 'cake-6', name: '6-inch round cake', price: 3800, category: 'cakes', note: 'Serves 6 to 8' },
  { id: 'cake-9', name: '9-inch round cake', price: 5800, category: 'cakes', note: 'Serves 12 to 16' },
  { id: 'sheet-cake', name: 'Sheet cake', price: 8500, category: 'cakes', note: 'Serves about 40' }
];

/* The order builder buttons are generated from this list instead of being
   typed into the HTML one by one. */
const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'breads', label: 'Breads' },
  { id: 'pastries', label: 'Pastries' },
  { id: 'cakes', label: 'Cakes' }
];

const CATEGORY_LABELS = {
  breads: 'Bread',
  pastries: 'Pastry',
  cakes: 'Cake'
};

function formatMoney(cents) {
  return '$' + (cents / 100).toFixed(2);
}

function findProduct(id) {
  return PRODUCTS.find(function (product) {
    return product.id === id;
  });
}

/* Reads the saved order and throws away anything that is no longer a real
   product, so an old bookmark cannot break the page. */
function readOrder() {
  var saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.order) || '[]');
  } catch (error) {
    return [];
  }
  if (!Array.isArray(saved)) {
    return [];
  }
  return saved
    .filter(function (line) {
      return line && findProduct(line.id) && Number(line.qty) > 0;
    })
    .map(function (line) {
      return { id: line.id, qty: Math.min(Number(line.qty), 99) };
    });
}

function saveOrder(order) {
  try {
    localStorage.setItem(STORAGE_KEYS.order, JSON.stringify(order));
  } catch (error) {
    /* storage can be blocked in private browsing; the page still works */
  }
}

function countOrder(order) {
  return order.reduce(function (total, line) {
    return total + line.qty;
  }, 0);
}

function totalOrder(order) {
  return order.reduce(function (total, line) {
    return total + findProduct(line.id).price * line.qty;
  }, 0);
}

/* Small number next to "My order" in the navigation, on every page. */
function updateOrderBadge() {
  var badge = document.getElementById('order-count');
  if (!badge) {
    return;
  }
  var count = countOrder(readOrder());
  badge.textContent = count;
  badge.hidden = count === 0;
}
