import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchRestaurantById } from "../services/api";
import { useCart } from "../context/CartContext";

const RestaurantPage = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { id } = useParams();
  const { addToCart } = useCart();

  useEffect(() => {
    const getRestaurant = async () => {
      try {
        const { data } = await fetchRestaurantById(id);
        setRestaurant(data);
      } catch (error) {
        setError("Restaurant not found");
      } finally {
        setLoading(false);
      }
    };
    getRestaurant();
  }, [id]);

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="error-state">
        <p>{error || "Restaurant not found"}</p>
        <Link to="/" className="btn btn-primary">Back to Restaurants</Link>
      </div>
    );
  }

  const categories = ["All", ...new Set(restaurant.products.map((p) => p.category))];
  const filteredProducts = selectedCategory === "All"
    ? restaurant.products
    : restaurant.products.filter((p) => p.category === selectedCategory);

  return (
    <div className="restaurant-page">
      <Link to="/" className="back-link">← Back to Restaurants</Link>

      <div className="restaurant-header">
        <div className="restaurant-header__image img-wrap">
          <img src={restaurant.imageUrl || "https://via.placeholder.com/800"} alt={restaurant.name} />
          <div className="img-overlay" />
        </div>
        <div className="restaurant-header__info">
          <h1>{restaurant.name}</h1>
          <p className="restaurant-header__cuisine">{restaurant.cuisine}</p>
          <p className="restaurant-header__description">{restaurant.description}</p>
          <div className="restaurant-header__meta">
            <span>⭐ {Number(restaurant.rating).toFixed(1)}</span>
            <span>🕐 {restaurant.deliveryTime} min</span>
            <span>💰 Min ₹{Number(restaurant.minOrder)}</span>
          </div>
        </div>
      </div>

      <div className="menu-section">
        <h2 className="menu-title">Menu</h2>
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-chip ${selectedCategory === category ? "active" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>No items in this category.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="menu-item">
                <div className="menu-item__image">
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/300"}
                    alt={product.name}
                  />
                </div>
                <div className="menu-item__content">
                  <h3>{product.name}</h3>
                  <p className="menu-item__description">{product.description}</p>
                  <div className="menu-item__footer">
                    <span className="menu-item__price">₹{Number(product.price)}</span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="btn btn-primary"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantPage;

