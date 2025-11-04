import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductById } from "../services/api";
import { useCart } from "../context/CartContext";

const ProductPage = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const { addToCart } = useCart();

  useEffect(() => {
    const getProduct = async () => {
      try {
        const { data } = await fetchProductById(id);
        setProduct(data);
      } catch (error) {
        setError("Product not found");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getProduct();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="error-state">
        <p>{error || "Product not found"}</p>
        <Link to="/" className="btn btn-primary">Back to Menu</Link>
      </div>
    );
  }

  return (
    <div className="product-page">
      <Link to="/" className="back-link">← Back to Menu</Link>
      <div className="product-detail">
        <div className="product-detail__image">
          <img src={product.imageUrl || "https://via.placeholder.com/500"} alt={product.name} />
        </div>
        <div className="product-detail__info">
          <h1>{product.name}</h1>
          <p className="product-detail__description">{product.description}</p>
          <div className="product-detail__price">${Number(product.price)}</div>
          <button onClick={handleAddToCart} className="btn btn-primary btn-large">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
