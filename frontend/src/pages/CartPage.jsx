import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Stack, 
  HStack, 
  VStack, 
  Button, 
  Image, 
  Separator, 
  IconButton, 
  Flex, 
  Badge, 
  Alert, 
  Center, 
  Spacer,
  Input,
  Field
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createRazorpayOrder, verifyPayment } from "../services/api";
import RazorpayCheckout from "../components/RazorpayCheckout";

const CartPage = () => {
  const { cartItems, removeFromCart, addToCart, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleCheckout = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!deliveryAddress || deliveryAddress.length < 5 || !contactNumber || contactNumber.length < 10) {
      setPaymentError("Please provide a valid delivery address and contact number.");
      setLoading(false);
      return;
    }

    try {
      const payloadItems = cartItems.map(item => ({ productId: item.id, quantity: item.quantity }));
      const { data } = await createRazorpayOrder({
        items: payloadItems,
        deliveryAddress,
        contactNumber
      });
      setRazorpayOrder(data);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Unknown error";
      setPaymentError(`Payment initialization failed: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      const payload = {
        ...response,
        items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity })),
        deliveryAddress,
        contactNumber
      };
      const { data } = await verifyPayment(payload);
      clearCart();
      setRazorpayOrder(null);
      navigate(`/track/${data.id}`);
    } catch (error) {
      setPaymentError("Payment verification failed.");
      setLoading(false);
      setRazorpayOrder(null);
    }
  };

  const handlePaymentError = (error) => {
    setPaymentError(error || "Payment failed.");
    setLoading(false);
    setRazorpayOrder(null);
  };

  // GST & taxes estimation (5%)
  const subtotal = parseFloat(getTotalPrice());
  const tax = (subtotal * 0.05).toFixed(2);
  const grandTotal = (subtotal + parseFloat(tax)).toFixed(2);

  if (cartItems.length === 0) {
    return (
      <Box bg="#fcfcfc" minH="100vh">
        <Container maxW="container.lg" py={20}>
          <Center>
            <VStack spacing={8} textAlign="center">
              <Box fontSize="7xl">🛒</Box>
              <VStack spacing={2}>
                <Heading size="xl" fontWeight="900">Your basket is empty</Heading>
                <Text fontSize="lg" color="gray.500">Looks like you haven't added anything yet.</Text>
              </VStack>
              <Button as={Link} to="/" size="xl" bg="#e53e3e" color="white" borderRadius="full" px={12} _hover={{ bg: "#c53030", transform: 'translateY(-2px)', shadow: 'xl' }}>
                Start Discovering
              </Button>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="#fcfcfc" minH="100vh">
      <Container maxW="container.lg" py={12}>
        <HStack mb={12} justify="space-between" align="center">
          <Heading size="2xl" fontWeight="900" letterSpacing="tight">Shopping Basket</Heading>
          <Text color="gray.400" fontWeight="700" fontSize="sm">{cartItems.reduce((t, i) => t + i.quantity, 0)} items</Text>
        </HStack>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={12}>
          {/* Left: Cart Items */}
          <VStack spacing={6} align="stretch" gridColumn={{ lg: "span 2" }}>
            {cartItems.map((item) => (
              <Box 
                key={item.id} 
                p={6} 
                bg="white" 
                borderRadius="2xl" 
                boxShadow="sm" 
                borderWidth="1px" 
                borderColor="gray.100"
                transition="all 0.3s"
                _hover={{ shadow: 'md' }}
              >
                <Flex gap={6} align="center">
                  <Box borderRadius="xl" overflow="hidden" boxShadow="sm" flexShrink={0}>
                    <Image 
                      src={item.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=200"} 
                      alt={item.name} 
                      w="100px" 
                      h="100px" 
                      objectFit="cover" 
                    />
                  </Box>
                  <VStack align="flex-start" flex={1} spacing={3}>
                    <HStack w="full" justify="space-between" align="flex-start">
                      <VStack align="flex-start" spacing={0}>
                         <Heading size="md" fontWeight="800" color="black">{item.name}</Heading>
                         {item.category && <Text color="gray.400" fontWeight="600" fontSize="sm">{item.category}</Text>}
                      </VStack>
                      <IconButton
                        aria-label="Remove item"
                        icon={<Box fontSize="md">🗑️</Box>}
                        onClick={() => removeFromCart(item.id)}
                        variant="ghost"
                        colorScheme="gray"
                        borderRadius="full"
                        size="sm"
                      />
                    </HStack>
                    <HStack w="full" justify="space-between" align="center">
                      {/* Quantity Controls */}
                      <HStack spacing={2} bg="gray.50" borderRadius="full" px={3} py={1}>
                        <Button
                          size="xs"
                          variant="ghost"
                          borderRadius="full"
                          onClick={() => removeFromCart(item.id)}
                          color="gray.500"
                          fontWeight="900"
                          fontSize="lg"
                          h="28px"
                          w="28px"
                          minW="28px"
                          p={0}
                        >−</Button>
                        <Text fontWeight="900" fontSize="md" minW="20px" textAlign="center">{item.quantity}</Text>
                        <Button
                          size="xs"
                          variant="ghost"
                          borderRadius="full"
                          onClick={() => addToCart(item)}
                          color="#e53e3e"
                          fontWeight="900"
                          fontSize="lg"
                          h="28px"
                          w="28px"
                          minW="28px"
                          p={0}
                        >+</Button>
                      </HStack>
                      <VStack align="flex-end" spacing={0}>
                        <Text fontSize="xl" fontWeight="900" color="black">₹{(Number(item.price) * item.quantity).toFixed(2)}</Text>
                        <Text color="gray.400" fontSize="xs" fontWeight="600">₹{Number(item.price)} each</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </Flex>
              </Box>
            ))}
          </VStack>

          {/* Right: Summary */}
          <Box gridColumn={{ lg: "span 1" }}>
            <Box 
                bg="white" 
                borderRadius="3xl" 
                p={8} 
                boxShadow="xl" 
                position="sticky" 
                top="90px"
                borderWidth="1px" 
                borderColor="gray.100"
            >
              <Heading size="lg" fontWeight="900" mb={8}>Order Summary</Heading>
              
              <VStack spacing={5} align="stretch">
                <HStack justify="space-between" fontWeight="700" color="gray.500" fontSize="md">
                    <Text>Subtotal</Text>
                    <Text color="black">₹{subtotal.toFixed(2)}</Text>
                </HStack>
                <HStack justify="space-between" fontWeight="700" color="gray.500" fontSize="md">
                    <Text>GST (5%)</Text>
                    <Text color="black">₹{tax}</Text>
                </HStack>
                <HStack justify="space-between" fontWeight="700" color="gray.500" fontSize="md">
                    <Text>Delivery</Text>
                    <Badge bg="#f0fff4" color="green.500" px={3} py={1} borderRadius="lg" fontSize="sm" fontWeight="900">FREE</Badge>
                </HStack>
                
                <Separator />
                
                <HStack justify="space-between" align="center" py={2}>
                    <Text fontSize="xl" fontWeight="800" color="black">Total</Text>
                    <Text fontSize="3xl" fontWeight="900" color="#e53e3e">₹{grandTotal}</Text>
                </HStack>

                <Box bg="#fff5f5" p={6} borderRadius="2xl" border="2px solid" borderColor="#feb2b2">
                   <Heading size="sm" fontWeight="800" mb={4} color="#c53030">Delivery Details</Heading>
                   <VStack spacing={4}>
                      <Field.Root invalid={deliveryAddress && deliveryAddress.length < 5}>
                        <Input 
                          placeholder="Full Delivery Address" 
                          variant="subtle"
                          bg="white"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                        />
                      </Field.Root>
                      <Field.Root invalid={contactNumber && contactNumber.length < 10}>
                        <Input 
                          placeholder="Contact Number" 
                          variant="subtle"
                          bg="white"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                        />
                      </Field.Root>
                   </VStack>
                </Box>

                {!token && (
                  <Alert.Root status="warning" borderRadius="xl" fontSize="sm">
                    Please <Link to="/login" style={{ color: "#e53e3e", fontWeight: 700, marginLeft: 4 }}> log in</Link> to checkout
                  </Alert.Root>
                )}

                {paymentError && (
                  <Alert.Root status="error" borderRadius="xl" fontSize="sm">
                    {paymentError}
                  </Alert.Root>
                )}

                {razorpayOrder && (
                  <RazorpayCheckout
                    orderId={razorpayOrder.id}
                    amount={razorpayOrder.amount}
                    currency={razorpayOrder.currency}
                    keyId={razorpayOrder.keyId}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={loading || !!razorpayOrder}
                  bg="#e53e3e"
                  color="white"
                  size="xl"
                  borderRadius="2xl"
                  h="70px"
                  fontSize="xl"
                  fontWeight="900"
                  _hover={{ bg: "#c53030", transform: 'translateY(-2px)', shadow: '2xl' }}
                  isLoading={loading}
                >
                  {!token ? "Login to Checkout" : razorpayOrder ? "Processing..." : "Secure Checkout"}
                </Button>
                
                <HStack spacing={3} justify="center" opacity={0.6} mt={2}>
                    <Text fontSize="lg">🛡️</Text>
                    <Text fontSize="xs" fontWeight="700" letterSpacing="widest">100% SECURE PAYMENTS</Text>
                </HStack>
              </VStack>
            </Box>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default CartPage;
