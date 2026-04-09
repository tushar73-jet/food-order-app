import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Text, 
  HStack, 
  Badge, 
  Spinner, 
  Center,
  Separator,
  SimpleGrid,
  CardRoot,
  CardBody,
  Image,
  Spacer,
  Button
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import socket from "../utils/socket";
import { fetchOrderById } from "../services/api";

const statusOrder = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

const statusIcons = {
  PENDING: "🕒",
  PREPARING: "🍛",
  OUT_FOR_DELIVERY: "🛵",
  DELIVERED: "✅",
  CANCELLED: "❌",
};

const statusColors = {
  PENDING: { bg: "#fff7ed", color: "#c05621" },
  PREPARING: { bg: "#ebf8ff", color: "#2b6cb0" },
  OUT_FOR_DELIVERY: { bg: "#faf5ff", color: "#6b21a8" },
  DELIVERED: { bg: "#f0fff4", color: "#276749" },
  CANCELLED: { bg: "#fff5f5", color: "#c53030" },
};

const stepColors = {
  PENDING: "#ff9800",
  PREPARING: "#2196f3",
  OUT_FOR_DELIVERY: "#9c27b0",
  DELIVERED: "#4caf50",
};

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) {
      setErrorMsg("Invalid order ID");
      setLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        const { data } = await fetchOrderById(id);
        setOrder(data);
        setStatus(data.status);
        setLoading(false);
      } catch (err) {
        setErrorMsg("Failed to load order tracking details.");
        setLoading(false);
      }
    }

    loadOrder();

    if (socket.connected) {
      socket.emit("join_order_room", id);
    } else {
      socket.on("connect", () => {
        socket.emit("join_order_room", id);
      });
    }

    socket.on("order_status_updated", (data) => {
      if (data.status) {
        setStatus(data.status);
      }
    });

    return () => {
      socket.off("order_status_updated");
      socket.emit("leave_order_room", id);
    };
  }, [id]);

  if (loading) {
    return (
      <Center h="70vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="#e53e3e" thickness="4px" />
          <Text color="gray.400" fontWeight="600">Loading your order...</Text>
        </VStack>
      </Center>
    );
  }

  if (errorMsg || !order) {
    return (
      <Center h="70vh">
        <VStack spacing={4}>
          <Text fontSize="4xl">📦</Text>
          <Text fontSize="xl" fontWeight="600">{errorMsg || "No order found."}</Text>
          <Link to="/" style={{ color: "#e53e3e", fontWeight: 700 }}>← Back to Home</Link>
        </VStack>
      </Center>
    );
  }

  const currentStepIndex = statusOrder.indexOf(status);
  const isCancelled = status === "CANCELLED";

  return (
    <Box bg="#fcfcfc" minH="100vh">
        <Container maxW="container.lg" py={12}>
            <VStack spacing={12} align="stretch">
                <VStack align="flex-start" spacing={4}>
                    <Link to="/orders" style={{ color: "#e53e3e", fontWeight: 700, fontSize: 14 }}>
                      ← Back to My Orders
                    </Link>
                    <Heading size="3xl" fontWeight="900" letterSpacing="tight">
                        Tracking Order <Text as="span" color="#e53e3e">#{id}</Text>
                    </Heading>

                    <HStack spacing={4} flexWrap="wrap">
                        <Badge 
                          bg={statusColors[status]?.bg || "gray.50"} 
                          color={statusColors[status]?.color || "gray.500"} 
                          px={4} py={2} borderRadius="xl" fontSize="md" fontWeight="800"
                        >
                             {statusIcons[status]} {status?.replace(/_/g, " ")}
                        </Badge>
                        <Text color="gray.400" fontSize="sm" fontWeight="800">
                          ORDERED ON {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </Text>
                    </HStack>
                </VStack>

                {/* Real-Time Stepper */}
                {!isCancelled ? (
                  <Box bg="white" p={10} borderRadius="3xl" boxShadow="xl" borderWidth="1px" borderColor="gray.100">
                    <HStack spacing={0} align="center" justify="center" overflowX="auto">
                      {statusOrder.map((step, idx) => {
                        const isCompleted = idx < currentStepIndex;
                        const isActive = idx === currentStepIndex;
                        const isPending = idx > currentStepIndex;

                        return (
                          <HStack key={step} spacing={0} flex={idx < statusOrder.length - 1 ? 1 : "auto"}>
                            <VStack spacing={3} minW="80px">
                                <Box 
                                  w={14} h={14} 
                                  bg={isActive ? stepColors[step] : isCompleted ? "green.400" : "gray.100"} 
                                  color={isPending ? "gray.400" : "white"} 
                                  borderRadius="full" 
                                  display="flex" 
                                  alignItems="center" 
                                  justifyContent="center" 
                                  fontSize="xl"
                                  boxShadow={isActive ? `0 0 0 4px ${stepColors[step]}30` : "none"}
                                  transition="all 0.4s"
                                >
                                  {isCompleted ? "✓" : statusIcons[step]}
                                </Box>
                                <Text 
                                  fontWeight={isActive ? "900" : "700"} 
                                  fontSize="xs" 
                                  color={isActive ? stepColors[step] : isCompleted ? "green.500" : "gray.400"}
                                  textAlign="center"
                                  whiteSpace="nowrap"
                                >
                                  {step.replace(/_/g, " ")}
                                </Text>
                            </VStack>
                            {idx < statusOrder.length - 1 && (
                              <Box 
                                flex={1} h="2px" 
                                bg={idx < currentStepIndex ? "green.400" : "gray.100"}
                                mx={2}
                                transition="all 0.4s"
                              />
                            )}
                          </HStack>
                        );
                      })}
                    </HStack>
                  </Box>
                ) : (
                  <Box bg="#fff5f5" p={8} borderRadius="3xl" borderWidth="1px" borderColor="red.100" textAlign="center">
                    <Text fontSize="4xl" mb={2}>❌</Text>
                    <Heading size="md" color="#c53030" fontWeight="800">This order was cancelled</Heading>
                    <Text color="gray.500" mt={2}>You were not charged for this order.</Text>
                  </Box>
                )}

                {/* Items Summary */}
                <VStack align="stretch" spacing={6}>
                    <Heading size="lg" fontWeight="900">Order Items</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        {order.items?.map((item) => (
                            <CardRoot key={item.id} variant="outline" borderRadius="2xl" border="none" boxShadow="sm" overflow="hidden">
                                <CardBody p={5}>
                                    <HStack spacing={5}>
                                        <Image 
                                          src={item.product?.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=150"} 
                                          alt={item.product?.name} 
                                          w="70px" h="70px" 
                                          borderRadius="xl" 
                                          objectFit="cover" 
                                        />
                                        <VStack align="flex-start" spacing={0} flex={1}>
                                            <Heading size="sm" fontWeight="800">{item.product?.name || "Dish"}</Heading>
                                            <Text color="gray.400" fontSize="xs" fontWeight="700">Qty: {item.quantity}</Text>
                                        </VStack>
                                        <Text fontWeight="900" fontSize="lg">₹{(Number(item.product?.price || 0) * item.quantity).toFixed(2)}</Text>
                                    </HStack>
                                </CardBody>
                            </CardRoot>
                        ))}
                    </SimpleGrid>
                    
                    <Separator />
                    
                    <HStack justify="space-between" bg="white" p={8} borderRadius="2xl" boxShadow="sm">
                        <VStack align="flex-start" spacing={0}>
                            <Heading size="md" fontWeight="800">Total Charged</Heading>
                            <Text color="gray.400" fontSize="xs" fontWeight="800">PREPAID VIA RAZORPAY</Text>
                        </VStack>
                        <Heading size="xl" fontWeight="900" color="#e53e3e">₹{Number(order.totalPrice).toFixed(2)}</Heading>
                    </HStack>
                </VStack>
            </VStack>
        </Container>
    </Box>
  );
}
