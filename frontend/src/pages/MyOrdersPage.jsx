import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Text, 
  SimpleGrid, 
  CardRoot, 
  CardHeader, 
  CardBody, 
  Badge, 
  HStack, 
  Button, 
  Spinner, 
  Center,
  Separator,
  Icon,
  Spacer
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMyOrders } from "../services/api";

const statusConfig = {
  PENDING: { color: "#ff9800", bg: "#fffaf0" },
  PREPARING: { color: "#2196f3", bg: "#f0f9ff" },
  OUT_FOR_DELIVERY: { color: "#9c27b0", bg: "#faf5ff" },
  DELIVERED: { color: "#4caf50", bg: "#f0fff4" },
  CANCELLED: { color: "#f44336", bg: "#fff5f5" },
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadOrders() {
      try {
        const { data } = await fetchMyOrders();
        setOrders(data);
      } catch (err) {
        setErrorMsg("Failed to load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [navigate]);

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="#e53e3e" thickness="4px" />
      </Center>
    );
  }

  if (errorMsg) {
    return (
      <Center h="70vh">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="600">{errorMsg}</Text>
          <Button bg="#e53e3e" color="white" onClick={() => window.location.reload()} borderRadius="full">Try Again</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box bg="#fcfcfc" minH="100vh">
      <Container maxW="container.lg" py={12}>
        <VStack spacing={12} align="stretch">
          <VStack align="flex-start" spacing={2}>
              <Heading size="2xl" fontWeight="900" letterSpacing="tight">My Orders</Heading>
              <Text color="gray.500" fontSize="lg" fontWeight="600">Track and manage your recent and past meals.</Text>
          </VStack>

          {orders.length === 0 ? (
            <Center py={20} bg="white" borderRadius="3xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100">
              <VStack spacing={6} textAlign="center">
                <Box fontSize="5xl">🍔</Box>
                <VStack spacing={2}>
                  <Heading size="md" fontWeight="800">No orders yet!</Heading>
                  <Text color="gray.500">Delicious items are waiting to be discovered.</Text>
                </VStack>
                <Button as={Link} to="/" bg="#e53e3e" color="white" borderRadius="full" px={10} size="lg" _hover={{ bg: "#c53030", transform: 'translateY(-2px)', shadow: 'xl' }}>
                  Start Discovering
                </Button>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={6} align="stretch">
              {orders.map((order) => (
                <CardRoot 
                  key={order.id} 
                  borderRadius="2xl" 
                  boxShadow="sm" 
                  borderWidth="1px" 
                  borderColor="gray.100"
                  overflow="hidden"
                  transition="all 0.3s"
                  _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                >
                  <CardHeader bg="#fcfcfc" p={6}>
                    <HStack justify="space-between" align="center">
                      <VStack align="flex-start" spacing={1}>
                        <Heading size="sm" fontWeight="800">Order #{order.id}</Heading>
                        <Text color="gray.400" fontSize="xs" fontWeight="700">{new Date(order.createdAt).toLocaleString()}</Text>
                      </VStack>
                      <HStack spacing={4}>
                          <VStack align="flex-end" spacing={0}>
                             <Text fontSize="xs" fontWeight="800" color="gray.300" casing="uppercase" letterSpacing="wider">Amount</Text>
                             <Text fontSize="lg" fontWeight="900" color="black">₹{Number(order.totalPrice).toFixed(2)}</Text>
                          </VStack>
                          <Badge 
                             bg={statusConfig[order.status]?.bg || "gray.50"} 
                             color={statusConfig[order.status]?.color || "gray.400"} 
                             borderRadius="xl" 
                             px={4} 
                             py={2} 
                             fontSize="xs"
                             fontWeight="900"
                             boxShadow="xs"
                             minW="120px"
                             textAlign="center"
                          >
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                      </HStack>
                    </HStack>
                  </CardHeader>

                  <CardBody p={6} pt={0}>
                     <VStack align="stretch" spacing={6}>
                        <Separator />
                        <HStack justify="space-between" align="center">
                           <HStack>
                              <Box p={2} bg="gray.50" rounded="lg">
                                 📦
                              </Box>
                              <Text fontWeight="800" fontSize="sm">Track your delivery in real-time</Text>
                           </HStack>
                           <Button 
                              as={Link} 
                              to={`/track/${order.id}`} 
                              bg="#e53e3e" 
                              color="white"
                              borderRadius="full"
                              size="sm"
                              px={6}
                              h="40px"
                              fontWeight="800"
                              _hover={{ bg: "#c53030" }}
                           >
                              Track Order →
                           </Button>
                        </HStack>
                     </VStack>
                  </CardBody>
                </CardRoot>
              ))}
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
