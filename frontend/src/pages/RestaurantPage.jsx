import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  CardRoot, 
  CardBody, 
  Image, 
  HStack, 
  VStack, 
  Badge, 
  Button, 
  Spinner, 
  Flex, 
  Center,
  TabsRoot,
  TabsList,
  TabsTrigger
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchRestaurantById } from "../services/api";
import { useCart } from "../context/CartContext";

const RestaurantPage = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [addedItems, setAddedItems] = useState({});
  const { id } = useParams();
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();

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
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const getCartCount = (productId) => {
    const item = cartItems.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <Center h="70vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="#e53e3e" thickness="4px" />
          <Text color="gray.400" fontWeight="600">Loading menu...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !restaurant) {
    return (
      <Center h="70vh">
        <VStack spacing={4}>
          <Text fontSize="4xl">🍽️</Text>
          <Text fontSize="xl" fontWeight="600">{error || "Restaurant not found"}</Text>
          <Button as={Link} to="/" bg="#e53e3e" color="white" borderRadius="full">
            Back to Restaurants
          </Button>
        </VStack>
      </Center>
    );
  }

  const categories = ["All", ...new Set(restaurant.products.map((p) => p.category).filter(Boolean))];
  const filteredProducts = selectedCategory === "All"
    ? restaurant.products
    : restaurant.products.filter((p) => p.category === selectedCategory);

  return (
    <Box bg="#fcfcfc" minH="100vh">
      <Container maxW="container.lg" py={8}>
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          color="#e53e3e" 
          fontWeight="700" 
          px={0}
          mb={8}
          _hover={{ bg: "transparent", transform: "translateX(-4px)" }}
          transition="all 0.2s"
        >
          ← Back to Restaurants
        </Button>

        {/* Restaurant Header */}
        <Box 
            bg="white" 
            borderRadius="3xl" 
            overflow="hidden" 
            boxShadow="sm" 
            mb={12}
            borderWidth="1px"
            borderColor="gray.100"
        >
            <Box position="relative" h="350px">
              <Image 
                src={restaurant.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200"} 
                alt={restaurant.name} 
                h="full" 
                w="full" 
                objectFit="cover" 
              />
              <Box position="absolute" top={0} left={0} right={0} bottom={0} bgGradient="linear(to-b, transparent, rgba(0,0,0,0.4))" />
            </Box>
            
            <Box p={8} mt="-20px" position="relative" bg="white" borderTopRadius="3xl">
                <HStack justify="space-between" align="flex-start" mb={4}>
                    <VStack align="flex-start" spacing={1}>
                        <Heading size="2xl" fontWeight="900" letterSpacing="tight">{restaurant.name}</Heading>
                        <Text color="#e53e3e" fontWeight="700" fontSize="lg">{restaurant.cuisine}</Text>
                    </VStack>
                    <Badge bg="#fdf0ef" color="#e53e3e" px={4} py={2} borderRadius="xl" fontSize="md" fontWeight="800">
                        ⭐ {Number(restaurant.rating).toFixed(1)}
                    </Badge>
                </HStack>
                <Text color="gray.500" fontSize="lg" maxW="700px" lineHeight="1.8" mb={8}>
                    {restaurant.description}
                </Text>
                
                <Flex gap={10} color="gray.400" fontWeight="700" fontSize="sm">
                    <HStack spacing={2}><Text>🕐</Text><Text>{restaurant.deliveryTime} min delivery</Text></HStack>
                    <HStack spacing={2}><Text>💰</Text><Text>Min ₹{Number(restaurant.minOrder)}</Text></HStack>
                    <HStack spacing={2}><Text>🚚</Text><Text>Free delivery</Text></HStack>
                </Flex>
            </Box>
        </Box>

        {/* Categories Tab Bar */}
        <Box position="sticky" top="65px" zIndex={10} bg="#fcfcfc" pt={4} mb={8}>
            <HStack justify="space-between" mb={6}>
              <Heading size="lg" fontWeight="900">Menu</Heading>
              <Text color="gray.400" fontSize="sm" fontWeight="700">{filteredProducts.length} items</Text>
            </HStack>
            <TabsRoot value={selectedCategory} onValueChange={(e) => setSelectedCategory(e.value)}>
                <TabsList overflowX="auto" pb={4} border="none" sx={{ "&::-webkit-scrollbar": { display: "none" } }}>
                {categories.map((category) => (
                    <TabsTrigger
                        key={category}
                        value={category}
                        bg={selectedCategory === category ? "#e53e3e" : "white"}
                        color={selectedCategory === category ? "white" : "black"}
                        borderWidth="1px"
                        borderColor={selectedCategory === category ? "#e53e3e" : "gray.200"}
                        borderRadius="full"
                        px={8}
                        h="48px"
                        fontWeight="700"
                        _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                        transition="all 0.2s"
                        flexShrink={0}
                    >
                    {category}
                    </TabsTrigger>
                ))}
                </TabsList>
            </TabsRoot>
        </Box>

        {/* Product Grid */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            {filteredProducts.map((product) => {
              const count = getCartCount(product.id);
              const justAdded = addedItems[product.id];
              return (
                <CardRoot 
                  key={product.id} 
                  variant="outline" 
                  borderRadius="2xl" 
                  overflow="hidden"
                  border="none"
                  bg="white"
                  boxShadow="sm"
                  transition="all 0.3s"
                  _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
                >
                    <CardBody p={0}>
                        <HStack spacing={0} h="full" align="stretch">
                            <Image 
                              src={product.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300"} 
                              alt={product.name} 
                              w="140px"
                              minH="140px"
                              objectFit="cover" 
                            />
                            <VStack p={5} align="flex-start" justify="space-between" flex={1}>
                                <VStack align="flex-start" spacing={1}>
                                    <HStack>
                                      <Heading size="sm" fontWeight="800">{product.name}</Heading>
                                      {product.isVeg !== undefined && (
                                        <Box 
                                          borderWidth="1px" 
                                          borderColor={product.isVeg ? "green.500" : "#e53e3e"} 
                                          p="2px" 
                                          borderRadius="sm"
                                        >
                                          <Box 
                                            w="8px" h="8px" 
                                            borderRadius="full" 
                                            bg={product.isVeg ? "green.500" : "#e53e3e"} 
                                          />
                                        </Box>
                                      )}
                                    </HStack>
                                    {product.description && (
                                      <Text fontSize="xs" color="gray.500" noOfLines={2} lineHeight="1.5">
                                          {product.description}
                                      </Text>
                                    )}
                                </VStack>
                                <HStack w="full" justify="space-between" align="center" pt={2}>
                                    <VStack align="flex-start" spacing={0}>
                                      <Text fontWeight="900" fontSize="xl" color="black">₹{Number(product.price)}</Text>
                                      {count > 0 && (
                                        <Text fontSize="xs" color="gray.400" fontWeight="700">{count} in cart</Text>
                                      )}
                                    </VStack>
                                    <Button 
                                        onClick={() => handleAddToCart(product)} 
                                        bg={justAdded ? "green.500" : "#e53e3e"}
                                        color="white" 
                                        borderRadius="xl"
                                        px={5}
                                        size="sm"
                                        _hover={{ bg: justAdded ? "green.600" : "#c53030" }}
                                        fontSize="sm"
                                        fontWeight="800"
                                        transition="all 0.2s"
                                    >
                                        {justAdded ? "✓ Added" : count > 0 ? `Add More` : "Add"}
                                    </Button>
                                </HStack>
                            </VStack>
                        </HStack>
                    </CardBody>
                </CardRoot>
              );
            })}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default RestaurantPage;
