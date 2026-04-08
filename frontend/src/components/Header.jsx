import { 
  Box, 
  Flex, 
  HStack, 
  Text, 
  Avatar, 
  Badge, 
  Container,
  Menu,
  Portal,
  Button
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Header = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem("token");

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearCart();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Box as="header" bg="white" borderBottom="1px" borderColor="gray.100" py={3} position="sticky" top={0} zIndex={100} boxShadow="sm">
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Link to="/">
            <HStack spacing={0}>
              <Text fontWeight="800" fontSize="2xl" color="black">food</Text>
              <Text fontWeight="800" fontSize="2xl" color="#e53e3e">store</Text>
            </HStack>
          </Link>

          <HStack spacing={6}>
            {/* My Orders link */}
            {token && (
              <Link to="/orders">
                <HStack spacing={2} _hover={{ opacity: 0.8 }} color="gray.600">
                  <Text fontSize="lg">📦</Text>
                  <Text fontWeight="700" fontSize="sm" display={{ base: "none", md: "block" }}>Orders</Text>
                </HStack>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart">
              <Box position="relative">
                <HStack spacing={2} _hover={{ opacity: 0.8 }}>
                  <Box p={2} bg="gray.100" borderRadius="md" position="relative">
                    <Text fontSize="xl">🛒</Text>
                    {cartItemCount > 0 && (
                      <Badge 
                        position="absolute" 
                        top="-2" 
                        right="-2" 
                        bg="#e53e3e" 
                        color="white" 
                        borderRadius="full" 
                        fontSize="xs"
                        minW="20px"
                        h="20px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border="2px solid white"
                      >
                        {cartItemCount}
                      </Badge>
                    )}
                  </Box>
                  <Text fontWeight="600" fontSize="sm" mt={1}>Cart</Text>
                </HStack>
              </Box>
            </Link>

            {/* User Avatar with dropdown */}
            {token ? (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Box cursor="pointer" position="relative">
                    <Avatar.Root size="sm" bg="#e53e3e" color="white">
                      <Avatar.Fallback fontSize="xs" fontWeight="800" bg="#e53e3e" color="white">
                        {getInitials(user?.name)}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </Box>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content borderRadius="xl" boxShadow="xl" p={2} minW="180px">
                      <Box px={3} py={2} mb={1}>
                        <Text fontWeight="800" fontSize="sm" color="black">{user?.name || "User"}</Text>
                        <Text fontSize="xs" color="gray.400" fontWeight="600">{user?.email}</Text>
                      </Box>
                      <Menu.Separator />
                      <Menu.Item value="orders" borderRadius="lg" fontWeight="700" fontSize="sm" onClick={() => navigate("/orders")} mt={1}>
                        📦 My Orders
                      </Menu.Item>
                      <Menu.Item value="logout" borderRadius="lg" fontWeight="700" fontSize="sm" color="#e53e3e" onClick={handleLogout}>
                        🚪 Logout
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            ) : (
              <Link to="/login">
                <Button size="sm" bg="#e53e3e" color="white" borderRadius="full" px={5} fontWeight="700" _hover={{ bg: "#c53030" }}>
                  Sign In
                </Button>
              </Link>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
