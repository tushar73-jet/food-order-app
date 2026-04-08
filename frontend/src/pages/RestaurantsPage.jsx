import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  CardRoot, 
  CardBody, 
  Image, 
  Stack, 
  HStack, 
  VStack, 
  Badge, 
  Input, 
  Button, 
  Spinner, 
  Flex, 
  Separator, 
  Center,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchRestaurants } from "../services/api";

const cuisineIcons = {
  All: "🥘",
  Indian: "🍛",
  Italian: "🍝",
  Mughlai: "🍗",
  "Street food": "🍟",
  Thali: "🍱",
  Chinese: "🥡",
  Desserts: "🎂",
};

const RestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const getRestaurants = async () => {
      try {
        const { data } = await fetchRestaurants();
        setRestaurants(data);
      } catch (error) {
        setError("Failed to load restaurants.");
      } finally {
        setLoading(false);
      }
    };
    getRestaurants();
  }, []);

  if (loading) {
    return (
      <Center h="70vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="#e53e3e" thickness="4px" />
          <Text color="gray.400" fontWeight="600">Finding restaurants near you...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !Array.isArray(restaurants)) {
    return (
      <Center h="70vh">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="600" color="red.500">{error || "Data error"}</Text>
          <Button colorScheme="red" onClick={() => window.location.reload()} borderRadius="full">Try Again</Button>
        </VStack>
      </Center>
    );
  }

  const cuisines = ["All", ...new Set(restaurants.map((r) => r.cuisine))];

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === "All" || restaurant.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  return (
    <Box bg="#fcfcfc" minH="100vh">
      {/* Hero Section */}
      <Box 
        bg="#2b140e" 
        color="white" 
        pt={10} 
        pb={12} 
        px={4} 
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.lg">
          <VStack align="flex-start" spacing={6} position="relative" zIndex={1}>
            <Badge 
              bg="rgba(255,255,255,0.15)" 
              color="white" 
              px={3} 
              py={1} 
              borderRadius="full" 
              fontSize="xs"
              fontWeight="600"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Box w={2} h={2} bg="green.400" borderRadius="full" />
              {restaurants.length}+ restaurants near you
            </Badge>

            <Heading size="2xl" maxW="600px" fontWeight="900" letterSpacing="tight">
                Hungry? We've got<br/>
                you covered.
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.800" fontWeight="500">
                Fresh food from your favourite local spots.
            </Text>

            <Box w="full" maxW="580px" mt={4}>
                <Flex bg="white" p={1} borderRadius="xl" boxShadow="2xl">
                    <Input 
                        placeholder="Search restaurants or cuisines..." 
                        color="black"
                        variant="unstyled"
                        px={4}
                        fontSize="lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && setSearchQuery("")}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        color="gray.400"
                        px={3}
                        onClick={() => setSearchQuery("")}
                        fontSize="lg"
                        _hover={{ bg: "gray.100" }}
                        borderRadius="lg"
                        minW="auto"
                      >
                        ✕
                      </Button>
                    )}
                </Flex>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Hero Stats — dynamic from data */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.100">
        <Container maxW="container.lg">
            <SimpleGrid columns={3} py={5} align="center">
                <VStack spacing={0} borderRight="1px solid" borderColor="gray.100">
                   <Text fontWeight="800" fontSize="xl" color="black">
                    {restaurants.length > 0 ? Math.round(restaurants.reduce((s, r) => s + (Number(r.deliveryTime) || 30), 0) / restaurants.length) : "--"} min
                   </Text>
                   <Text fontSize="xs" fontWeight="700" color="gray.400" mt="-1px">Avg delivery</Text>
                </VStack>
                <VStack spacing={0} borderRight="1px solid" borderColor="gray.100">
                   <Text fontWeight="800" fontSize="xl" color="black">{restaurants.length}</Text>
                   <Text fontSize="xs" fontWeight="700" color="gray.400" mt="-1px">Restaurants</Text>
                </VStack>
                <VStack spacing={0}>
                   <Text fontWeight="800" fontSize="xl" color="black">₹0</Text>
                   <Text fontSize="xs" fontWeight="700" color="gray.400" mt="-1px">Delivery fee</Text>
                </VStack>
            </SimpleGrid>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxW="container.lg" pt={8} pb={20}>
        {/* Cuisine Filters */}
        <HStack spacing={4} mb={10} overflowX="auto" pb={4} sx={{ "&::-webkit-scrollbar": { display: "none" } }}>
          {cuisines.map((cuisine) => (
            <Button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              variant={selectedCuisine === cuisine ? "solid" : "outline"}
              bg={selectedCuisine === cuisine ? "#e53e3e" : "white"}
              color={selectedCuisine === cuisine ? "white" : "black"}
              borderColor={selectedCuisine === cuisine ? "#e53e3e" : "gray.200"}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
              flexShrink={0}
              px={6}
              h="48px"
              _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
              transition="all 0.2s"
            >
              {cuisineIcons[cuisine] || "🍴"} {cuisine}
            </Button>
          ))}
        </HStack>

        <HStack mb={6} justify="space-between">
            <Heading size="lg" fontWeight="800">
              {searchQuery ? `Results for "${searchQuery}"` : "Featured today"}
            </Heading>
            <Text color="gray.400" fontWeight="700" fontSize="sm">{filteredRestaurants.length} found</Text>
        </HStack>

        {filteredRestaurants.length === 0 && (
          <Center py={20} bg="white" borderRadius="3xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100">
            <VStack spacing={4}>
              <Text fontSize="4xl">🍽️</Text>
              <Heading size="md" fontWeight="800">No restaurants found</Heading>
              <Text color="gray.400">Try a different search or cuisine filter</Text>
              <Button onClick={() => { setSearchQuery(""); setSelectedCuisine("All"); }} bg="#e53e3e" color="white" borderRadius="full" px={8}>
                Clear Filters
              </Button>
            </VStack>
          </Center>
        )}

        {/* Restaurant Cards */}
        <VStack spacing={6} align="stretch">
          {filteredRestaurants.map((restaurant) => (
            <CardRoot 
              key={restaurant.id} 
              overflow="hidden" 
              variant="outline" 
              borderRadius="2xl"
              border="none"
              bg="white"
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
              cursor="pointer"
              onClick={() => navigate(`/restaurant/${restaurant.id}`)}
            >
              <Box position="relative" h="280px">
                <Image
                  src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200"}
                  alt={restaurant.name}
                  h="full"
                  w="full"
                  objectFit="cover"
                />
                <Flex position="absolute" top="6" left="6" gap={3}>
                    <Badge bg="#1a843e" color="white" px={3} py={1} borderRadius="lg" fontSize="xs">Open</Badge>
                </Flex>
                <Box 
                    position="absolute" 
                    bottom="6" 
                    right="6"
                    bg="white" 
                    borderRadius="2xl" 
                    px={3} 
                    py={1} 
                    boxShadow="lg"
                    fontSize="xs"
                    fontWeight="800"
                    display="flex"
                    alignItems="center"
                    gap={1}
                >
                    ⭐ {Number(restaurant.rating).toFixed(1)}
                </Box>
              </Box>

              <CardBody p={6}>
                <VStack align="flex-start" spacing={3}>
                  <Heading size="md" fontWeight="800">{restaurant.name}</Heading>
                  <Text color="gray.400" fontSize="sm" fontWeight="600">{restaurant.cuisine}</Text>
                  
                  <HStack spacing={4} pt={2} w="full" justify="flex-start">
                    <HStack spacing={1} color="gray.600" fontSize="sm" fontWeight="700">
                        <Text>🕐</Text>
                        <Text>{restaurant.deliveryTime} min</Text>
                    </HStack>
                    <Text color="gray.300">•</Text>
                    <HStack spacing={1} color="gray.600" fontSize="sm" fontWeight="700">
                        <Text>💰</Text>
                        <Text>Min ₹{Number(restaurant.minOrder)}</Text>
                    </HStack>
                    <Text color="gray.300">•</Text>
                    <Text color="#e53e3e" fontSize="sm" fontWeight="800">Free delivery</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </CardRoot>
          ))}
        </VStack>

        {/* Promo Banner */}
        {filteredRestaurants.length > 0 && (
          <Box 
              mt={16} 
              bg="#102a43" 
              borderRadius="2xl" 
              p={8} 
              color="white" 
              position="relative" 
              overflow="hidden"
          >
              <VStack align="flex-start" spacing={2}>
                  <Text fontSize="xs" fontWeight="800" opacity={0.6} textTransform="uppercase">Limited time offer</Text>
                  <Heading size="lg" fontWeight="900">Free delivery on your<br/>first 3 orders</Heading>
                  <Text mt={4} fontWeight="900" color="#e53e3e" cursor="pointer">Claim now →</Text>
              </VStack>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default RestaurantsPage;
