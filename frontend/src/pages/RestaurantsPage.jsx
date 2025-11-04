import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchRestaurants } from "../services/api";

const RestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");

  useEffect(() => {
    const getRestaurants = async () => {
      try {
        const { data } = await fetchRestaurants();
        setRestaurants(data);
      } catch (error) {
        setError("Failed to load restaurants");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getRestaurants();
  }, []);

  const cuisines = ["All", ...new Set(restaurants.map((r) => r.cuisine))];

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === "All" || restaurant.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading restaurants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="restaurants-page">
      <div className="restaurants-hero">
        <h1 className="page-title">Discover Restaurants</h1>
        <p className="page-subtitle">Order from your favorite local spots</p>
      </div>

      <div className="restaurants-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="cuisine-filters">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`cuisine-chip ${selectedCuisine === cuisine ? "active" : ""}`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {filteredRestaurants.length === 0 ? (
        <div className="empty-state">
          <p>No restaurants found. Try different filters.</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {filteredRestaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/restaurant/${restaurant.id}`}
              className="restaurant-card"
            >
              <div className="restaurant-card__image img-wrap">
                <img
                  src={restaurant.imageUrl || "https://via.placeholder.com/400"}
                  alt={restaurant.name}
                />
                <div className="restaurant-card__rating">
                  ⭐ {Number(restaurant.rating).toFixed(1)}
                </div>
              </div>
              <div className="restaurant-card__content">
                <h3>{restaurant.name}</h3>
                <p className="restaurant-card__cuisine">{restaurant.cuisine}</p>
                <p className="restaurant-card__description">{restaurant.description}</p>
                <div className="restaurant-card__meta">
                  <span>🕐 {restaurant.deliveryTime} min</span>
                  <span>💰 Min ₹{Number(restaurant.minOrder)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantsPage;

