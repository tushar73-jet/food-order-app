import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Header = () => {
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="header">
      <Link to="/" className="header__logo">
        <h1>🍽️ FoodStore</h1>
      </Link>
      <nav className="header__nav">
        <Link to="/cart" className="header__cart">
          🛒 Cart {cartItemCount > 0 && <span className="badge">{cartItemCount}</span>}
        </Link>
        {token ? (
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
