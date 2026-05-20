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
  SimpleGrid,
  CardRoot,
  CardHeader,
  CardBody,
  Button,
  Input
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { fetchAllAdminOrders, updateOrderStatus, dispatchOrder } from "../services/api";
import { Link } from "react-router-dom";

const STATUSES = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

const statusColors = {
  PENDING: { bg: "#fff7ed", color: "#c05621" },
  PREPARING: { bg: "#ebf8ff", color: "#2b6cb0" },
  OUT_FOR_DELIVERY: { bg: "#faf5ff", color: "#6b21a8" },
  DELIVERED: { bg: "#f0fff4", color: "#276749" },
  CANCELLED: { bg: "#fff5f5", color: "#c53030" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const prevPending = useRef(0);

  useEffect(() => {
    loadOrders();
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Auto-refresh every 10 seconds to catch new orders
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentPending = orders.filter(o => o.status === 'PENDING').length;
    if (currentPending > prevPending.current && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Received!', { body: `You have ${currentPending} pending orders.` });
    }
    prevPending.current = currentPending;
  }, [orders]);

  const loadOrders = async () => {
    try {
      const { data } = await fetchAllAdminOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load admin orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, currentStatus) => {
    const currentIndex = STATUSES.indexOf(currentStatus);
    if (currentIndex >= STATUSES.length - 1) return;
    
    const nextStatus = STATUSES[currentIndex + 1];
    
    // Optimistic UI update
    setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));

    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      console.error("Failed to update", err);
      loadOrders(); // Revert on failure
    }
  };

  const handleDispatch = async (orderId) => {
    setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: 'OUT_FOR_DELIVERY' } : o));
    try {
      await dispatchOrder(orderId);
    } catch (err) {
      loadOrders(); // revert
      if (err.response?.status === 503) {
        alert("No riders available!");
      } else {
        console.error("Failed to dispatch order", err);
      }
    }
  };

  const exportCSV = () => {
    const headers = "ID,Customer,Status,Amount,Date\n";
    const csv = headers + orders.map(o => `${o.id},"${o.user?.name || 'Unknown'}",${o.status},${o.totalPrice},"${new Date(o.createdAt).toLocaleString()}"`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getNextActionLabel = (status) => {
    if (status === "PENDING") return "Accept & Cook";
    if (status === "PREPARING") return "🚀 Auto-Dispatch Rider";
    if (status === "OUT_FOR_DELIVERY") return "Mark Delivered";
    return null;
  };

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="#e53e3e" thickness="4px" />
      </Center>
    );
  }

  // Filter orders by search term
  const filteredOrders = orders.filter(o => 
    o.id.toString().includes(searchTerm) || 
    (o.user?.name && o.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group orders by status
  const groupedOrders = STATUSES.map(status => ({
    status,
    items: filteredOrders.filter(o => o.status === status)
  }));

  // Calculate Stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const stats = {
    revenue: todayOrders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + Number(o.totalPrice), 0).toFixed(0),
    pending: orders.filter(o => o.status === 'PENDING').length,
    active: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
    total: todayOrders.length
  };

  return (
    <Box bg="#f4f6f8" minH="100vh">
        <Box bg="#1a202c" py={6} px={8} color="white" mb={8} boxShadow="md">
            <Container maxW="container.xl">
                <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
                    <VStack align="flex-start" spacing={1}>
                        <Heading size="xl" fontWeight="900">Restaurant Admin</Heading>
                        <Text color="gray.400" fontWeight="600">Manage live orders and dispatch riders.</Text>
                    </VStack>
                    <HStack gap={3} wrap="wrap">
                        <Input 
                          placeholder="Search orders..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          w={{ base: "full", md: "160px" }}
                          bg="white"
                          color="black"
                          borderRadius="md"
                          size="sm"
                        />
                        <Button onClick={exportCSV} colorScheme="whiteAlpha" variant="outline" size="sm" borderRadius="md">
                          Export CSV
                        </Button>
                        <Link to="/admin/analytics">
                            <Button colorScheme="whiteAlpha" variant="outline" size="sm" borderRadius="md">
                                📊 Analytics
                            </Button>
                        </Link>
                        <Link to="/admin/menu">
                            <Button colorScheme="whiteAlpha" variant="outline" size="sm" borderRadius="md">
                                🍽️ Menu
                            </Button>
                        </Link>
                        <Link to="/admin/users">
                            <Button colorScheme="whiteAlpha" variant="solid" size="sm" borderRadius="md" bg="green.500" _hover={{ bg: "green.600" }}>
                                Manage Riders 🏍️
                            </Button>
                        </Link>
                    </HStack>
                </HStack>
            </Container>
        </Box>

        <Container maxW="container.xl" pb={12}>
            {/* Stats Bar */}
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
                <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white">
                    <CardBody p={4} textAlign="center">
                        <Text fontSize="sm" color="gray.500" fontWeight="700">Today's Revenue</Text>
                        <Heading size="md" color="green.500" mt={1}>₹{stats.revenue}</Heading>
                    </CardBody>
                </CardRoot>
                <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white">
                    <CardBody p={4} textAlign="center">
                        <Text fontSize="sm" color="gray.500" fontWeight="700">Pending Orders</Text>
                        <Heading size="md" color="orange.500" mt={1}>{stats.pending}</Heading>
                    </CardBody>
                </CardRoot>
                <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white">
                    <CardBody p={4} textAlign="center">
                        <Text fontSize="sm" color="gray.500" fontWeight="700">Active Deliveries</Text>
                        <Heading size="md" color="purple.500" mt={1}>{stats.active}</Heading>
                    </CardBody>
                </CardRoot>
                <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white">
                    <CardBody p={4} textAlign="center">
                        <Text fontSize="sm" color="gray.500" fontWeight="700">Total Orders</Text>
                        <Heading size="md" color="blue.500" mt={1}>{stats.total}</Heading>
                    </CardBody>
                </CardRoot>
            </SimpleGrid>

            {/* Kanban Board Layout */}
            <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={6} align="start">
                {groupedOrders.map(group => (
                    <Box key={group.status} bg="white" borderRadius="2xl" p={4} boxShadow="sm" borderWidth="1px" borderColor="gray.200">
                        <HStack justify="space-between" mb={4} p={2} borderBottom="2px solid" borderColor={statusColors[group.status].color}>
                            <Heading size="sm" fontWeight="800" color={statusColors[group.status].color}>
                                {group.status.replace(/_/g, " ")}
                            </Heading>
                            <Badge bg={statusColors[group.status].bg} color={statusColors[group.status].color} borderRadius="full">
                                {group.items.length}
                            </Badge>
                        </HStack>

                        <VStack spacing={4} align="stretch" maxH="75vh" overflowY="auto" css={{ "&::-webkit-scrollbar": { display: "none" } }}>
                            {group.items.length === 0 ? (
                                <Box py={8} textAlign="center">
                                    <Text color="gray.400" fontWeight="600" fontSize="sm">No orders</Text>
                                </Box>
                            ) : (
                                group.items.map(order => (
                                    <CardRoot key={order.id} borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="xs" _hover={{ shadow: "md" }} transition="all 0.2s">
                                        <CardHeader p={4} pb={2}>
                                            <HStack justify="space-between">
                                                <Heading size="sm" fontWeight="900">#{order.id}</Heading>
                                                <Text fontSize="xs" fontWeight="700" color="gray.500">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </HStack>
                                            <Text fontSize="xs" fontWeight="700" color="#e53e3e" mt={1}>
                                                {order.user?.name || "Customer"}
                                            </Text>
                                        </CardHeader>
                                        <CardBody p={4} pt={2}>
                                            <VStack align="stretch" spacing={3}>
                                                <Box bg="gray.50" p={2} borderRadius="lg">
                                                    {order.items.slice(0,2).map(i => (
                                                        <Text key={i.id} fontSize="xs" fontWeight="600" color="gray.700" noOfLines={1}>
                                                            {i.quantity}x {i.product?.name}
                                                        </Text>
                                                     ))}
                                                    {order.items.length > 2 && (
                                                        <Text fontSize="xs" color="gray.400" fontWeight="700">+{order.items.length - 2} more items</Text>
                                                    )}
                                                </Box>

                                                <Box borderTop="1px dashed" borderColor="gray.200" pt={2}>
                                                    <Text fontSize="2xs" fontWeight="800" color="gray.400" textTransform="uppercase">Deliver To:</Text>
                                                    <Text fontSize="xs" fontWeight="700" color="gray.600" noOfLines={2}>{order.deliveryAddress}</Text>
                                                    <Text fontSize="xs" fontWeight="700" color="blue.500" mt={1}>📞 {order.contactNumber}</Text>
                                                </Box>
                                                
                                                <HStack justify="space-between" align="center">
                                                    <Text fontWeight="800" fontSize="sm">₹{Number(order.totalPrice).toFixed(0)}</Text>
                                                    {getNextActionLabel(order.status) && (
                                                        <Button 
                                                            size="xs" 
                                                            bg="#e53e3e" 
                                                            color="white" 
                                                            borderRadius="md" 
                                                            px={3}
                                                            fontWeight="800"
                                                            _hover={{ bg: "#c53030" }}
                                                            onClick={() => {
                                                                if (order.status === "PREPARING") {
                                                                    handleDispatch(order.id);
                                                                } else {
                                                                    handleUpdateStatus(order.id, order.status);
                                                                }
                                                            }}
                                                        >
                                                            {getNextActionLabel(order.status)}
                                                        </Button>
                                                    )}
                                                </HStack>
                                            </VStack>
                                        </CardBody>
                                    </CardRoot>
                                ))
                            )}
                        </VStack>
                    </Box>
                ))}
            </SimpleGrid>
        </Container>
    </Box>
  );
}
