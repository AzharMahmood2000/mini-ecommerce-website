const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later';

// GET /api/cart?cartId=...
const getCart = async (req, res) => {
  try {
    const { cartId } = req.query;
    if (!cartId) {
      return res.status(400).json({ success: false, message: 'cartId is required' });
    }

    const cart = await Cart.findOne({ cartId }).lean();
    if (!cart) {
      return res.json({ success: true, cart: { cartId, items: [] } });
    }

    return res.json({ success: true, cart });
  } catch (error) {
    console.error('getCart error:', error.message);
    return res.status(500).json({ success: false, message: GENERIC_SERVER_MESSAGE });
  }
};

// POST /api/cart
// body: { cartId?: string, item: { productId, name, price, image, quantity } }
const upsertCart = async (req, res) => {
  try {
    const { cartId, item } = req.body || {};

    if (!item || !item.productId) {
      return res.status(400).json({ success: false, message: 'item with productId is required' });
    }

    // use provided cartId or create a new one
    const cid = cartId || String(new mongoose.Types.ObjectId());

    let cart = await Cart.findOne({ cartId: cid });

    if (!cart) {
      cart = new Cart({ cartId: cid, items: [] });
    }

    const existingIndex = cart.items.findIndex(i => String(i.productId) === String(item.productId));

    // Parse quantity correctly. Allow 0 to indicate removal.
    let qty = Number(item.quantity);
    if (!Number.isFinite(qty)) {
      qty = 1;
    }

    if (existingIndex !== -1) {
      if (qty <= 0) {
        // remove
        cart.items.splice(existingIndex, 1);
      } else {
        cart.items[existingIndex].quantity = qty;
        cart.items[existingIndex].price = Number(item.price) || cart.items[existingIndex].price;
        cart.items[existingIndex].name = item.name || cart.items[existingIndex].name;
        cart.items[existingIndex].image = item.image || cart.items[existingIndex].image;
      }
    } else {
      if (qty > 0) {
        cart.items.push({
          productId: item.productId,
          name: item.name || '',
          price: Number(item.price) || 0,
          image: item.image || '',
          quantity: qty,
        });
      }
    }

    await cart.save();

    return res.json({ success: true, cartId: cart.cartId, cart });
  } catch (error) {
    console.error('upsertCart error:', error);
    return res.status(500).json({ success: false, message: GENERIC_SERVER_MESSAGE });
  }
};

module.exports = {
  getCart,
  upsertCart,
};
