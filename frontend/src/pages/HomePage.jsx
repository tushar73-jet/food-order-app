import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { useCart } from "../context/CartContext";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const getProducts = async () => {
      try {
        const { data } = await fetchProducts();
        setProducts(data);
      } catch (error) {
        setError("Failed to load products");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading delicious food...</p>
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
    <div className="home">
      <h2 className="page-title">Our Menu</h2>
      {products.length === 0 ? (
        <div className="empty-state">
          <p>No products available at the moment.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <Link to={`/product/${product.id}`} className="product-card__link">
                <div className="product-card__image">
                  <img src={product.imageUrl || "https://via.placeholder.com/300"} alt={product.name} />
                </div>
                <div className="product-card__content">
                  <h3>{product.name}</h3>
                  <p className="product-card__price">${Number(product.price)}</p>
                </div>
              </Link>
              <button
                onClick={() => handleAddToCart(product)}
                className="btn btn-primary btn-full"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
