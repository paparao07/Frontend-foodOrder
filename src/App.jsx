


import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:9091/food/all";

const categoryImages = {
  Biryani:
    "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=600&q=80",
  Pizza:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
  Burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  Drinks:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80",
  Desserts:
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
  Snacks:
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

function App() {
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Customer checkout states
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch food items from Spring Boot
  useEffect(() => {
    axios
      .get(API_URL)
      .then((response) => setFoods(response.data))
      .catch(() =>
        setError("Unable to load food items. Check Spring Boot.")
      )
      .finally(() => setLoading(false));
  }, []);

  // Food categories
  const categories = [
    "All",
    ...new Set(foods.map((food) => food.category).filter(Boolean)),
  ];

  // Filter available food
  const filteredFoods = foods.filter(
    (food) =>
      food.available !== false &&
      (selectedCategory === "All" ||
        food.category === selectedCategory)
  );

  // Add food to cart
  const addToCart = (food) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.foodId === food.foodId
      );

      if (existing) {
        return currentCart.map((item) =>
          item.foodId === food.foodId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...food, quantity: 1 }];
    });

    setOrderMessage("");
  };

  // Increase or decrease quantity
  const changeQuantity = (foodId, amount) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.foodId === foodId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

    setOrderMessage("");
  };

  // Cart calculations
  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  // Place order through Spring Boot API
  const handleCheckout = async (event) => {
    event.preventDefault();
    setOrderMessage("");

    if (cart.length === 0) {
      setOrderMessage("Please add food items to your cart.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:9091/orders/checkout",
        {
          customerName: customerName.trim(),
          phone: phone.trim(),
          deliveryAddress: deliveryAddress.trim(),
          items: cart.map((item) => ({
            foodId: item.foodId,
            quantity: item.quantity,
          })),
        }
      );

      setOrderMessage(
        `Order placed successfully! Order ID: ${
          response.data.orderId
        }. Total: ₹${Number(response.data.totalAmount).toFixed(2)}`
      );

      setCart([]);
      setCustomerName("");
      setPhone("");
      setDeliveryAddress("");
    } catch (error) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : "Unable to place order. Check your backend and try again.";

      setOrderMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🍽️ Foodie Express</h1>
        <p>Fresh food, delivered with love!</p>

        <a href="#cart" className="cart-link">
          🛒 My Cart ({totalItems})
        </a>
      </header>

      <main className="container">
        <h2>Explore Our Menu</h2>

        <div className="categories">
          {categories.map((category) => (
            <button
              key={category}
              className={
                selectedCategory === category
                  ? "category-btn active"
                  : "category-btn"
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading && <p>Loading food menu...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && filteredFoods.length === 0 && (
          <p>No available food items in this category.</p>
        )}

        <div className="food-grid">
          {filteredFoods.map((food) => (
            <div className="food-card" key={food.foodId}>
              <img
                className="food-image"
                src={
                  food.imageUrl ||
                  categoryImages[food.category] ||
                  fallbackImage
                }
                alt={food.foodName}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackImage;
                }}
              />

              <div className="food-info">
                <span className="food-category">
                  {food.category}
                </span>

                <h3>{food.foodName}</h3>

                <p className="price">
                  ₹{Number(food.price).toFixed(2)}
                </p>

                <button
                  className="add-btn"
                  onClick={() => addToCart(food)}
                >
                  + Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Shopping cart */}
        <section className="cart-section" id="cart">
          <h2>🛒 Your Shopping Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty. Add some delicious food!</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.foodId}>
                  <div className="cart-details">
                    <strong>{item.foodName}</strong>
                    <span>
                      ₹{Number(item.price).toFixed(2)} each
                    </span>
                  </div>

                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(item.foodId, -1)
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(item.foodId, 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <strong>
                    ₹
                    {(
                      Number(item.price) * item.quantity
                    ).toFixed(2)}
                  </strong>
                </div>
              ))}

              <div className="cart-total">
                <h3>Total: ₹{totalPrice.toFixed(2)}</h3>

                <button
                  type="button"
                  className="clear-btn"
                  onClick={() => {
                    setCart([]);
                    setOrderMessage("");
                  }}
                >
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </section>

        {/* Customer checkout */}
        <section className="checkout-section">
          <h2>📦 Customer Details & Checkout</h2>

          <form onSubmit={handleCheckout}>
            <label htmlFor="customerName">Full Name</label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(event) =>
                setCustomerName(event.target.value)
              }
              placeholder="Enter your full name"
              required
            />

            <label htmlFor="phone">Mobile Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength={10}
              required
            />

            <label htmlFor="deliveryAddress">
              Delivery Address
            </label>
            <textarea
              id="deliveryAddress"
              value={deliveryAddress}
              onChange={(event) =>
                setDeliveryAddress(event.target.value)
              }
              placeholder="Enter your complete delivery address"
              rows={4}
              required
            />

            <h3>Order Total: ₹{totalPrice.toFixed(2)}</h3>

            <button
              className="place-order-btn"
              type="submit"
              disabled={submitting || cart.length === 0}
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </form>

          {orderMessage && (
            <p className="order-message" role="status">
              {orderMessage}
            </p>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          © 2026 Foodie Express | Built with React & Spring Boot
        </p>
      </footer>
    </div>
  );
}

export default App;
