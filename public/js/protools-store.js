(function (global) {
  var CART_KEY = 'protools_cart_v1';
  var WISH_KEY = 'protools_wishlist_v1';

  function parse(json, fallback) {
    try {
      var v = JSON.parse(json);
      return Array.isArray(v) ? v : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function cartGet() {
    return parse(localStorage.getItem(CART_KEY), []);
  }

  function cartSave(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    var count = items.reduce(function (s, i) {
      return s + (Number(i.quantity) || 0);
    }, 0);
    global.dispatchEvent(
      new CustomEvent('protools-cart-updated', { detail: { count: count } })
    );
  }

  function cartCount() {
    return cartGet().reduce(function (s, i) {
      return s + (Number(i.quantity) || 0);
    }, 0);
  }

  function cartAdd(line) {
    var items = cartGet();
    var pid = String(line.productId);
    var vid = line.variantId != null ? String(line.variantId) : '';
    var idx = items.findIndex(function (x) {
      return String(x.productId) === pid && String(x.variantId || '') === vid;
    });
    var addQ = Number(line.quantity) || 1;
    if (idx >= 0) {
      items[idx].quantity = (Number(items[idx].quantity) || 0) + addQ;
    } else {
      items.push({
        productId: pid,
        variantId: line.variantId || null,
        quantity: addQ,
        name: line.name || '',
        price: line.price,
        image: line.image || '',
        sku: line.sku || '',
      });
    }
    cartSave(items);
  }

  function cartSetQty(productId, variantId, quantity) {
    var items = cartGet();
    var pid = String(productId);
    var vid = variantId != null ? String(variantId) : '';
    var idx = items.findIndex(function (x) {
      return String(x.productId) === pid && String(x.variantId || '') === vid;
    });
    if (idx < 0) return;
    var q = Number(quantity);
    if (!Number.isFinite(q) || q < 1) items.splice(idx, 1);
    else items[idx].quantity = q;
    cartSave(items);
  }

  function cartRemove(productId, variantId) {
    cartSetQty(productId, variantId, 0);
  }

  function cartClear() {
    cartSave([]);
  }

  function wishGet() {
    return parse(localStorage.getItem(WISH_KEY), []);
  }

  function wishSave(ids) {
    localStorage.setItem(WISH_KEY, JSON.stringify(ids));
    global.dispatchEvent(new CustomEvent('protools-wishlist-updated'));
  }

  function wishToggle(productId) {
    var id = String(productId);
    var ids = wishGet().map(String);
    var i = ids.indexOf(id);
    if (i >= 0) {
      ids.splice(i, 1);
      wishSave(ids);
      return false;
    }
    ids.push(id);
    wishSave(ids);
    return true;
  }

  function wishHas(productId) {
    var id = String(productId);
    return wishGet()
      .map(String)
      .indexOf(id) >= 0;
  }

  global.ProToolsStore = {
    cartGet: cartGet,
    cartSave: cartSave,
    cartCount: cartCount,
    cartAdd: cartAdd,
    cartSetQty: cartSetQty,
    cartRemove: cartRemove,
    cartClear: cartClear,
    wishGet: wishGet,
    wishSave: wishSave,
    wishToggle: wishToggle,
    wishHas: wishHas,
  };
})(typeof window !== 'undefined' ? window : this);
