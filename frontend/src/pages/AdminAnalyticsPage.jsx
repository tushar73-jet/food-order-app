import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  HStack,
  SimpleGrid,
  CardRoot,
  CardBody,
  CardHeader,
  Spinner,
  Center,
  Button
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { fetchAnalytics } from "../services/api";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetchAnalytics();
        setData(response.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="#e53e3e" thickness="4px" />
      </Center>
    );
  }

  if (!data) return <Center h="70vh"><Text>Error loading data</Text></Center>;

  return (
    <Box bg="#f4f6f8" minH="100vh">
      {/* Header matching AdminOrdersPage */}
      <Box bg="#1a202c" py={6} px={8} color="white" mb={8} boxShadow="md">
        <Container maxW="container.xl">
          <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="flex-start" spacing={1}>
              <Heading size="xl" fontWeight="900">Analytics Dashboard</Heading>
              <Text color="gray.400" fontWeight="600">Track your restaurant's performance and revenue.</Text>
            </VStack>
            <HStack gap={3} wrap="wrap">
              <Link to="/admin/orders">
                <Button colorScheme="whiteAlpha" variant="outline" size="sm" borderRadius="md">
                  🔙 Back to Orders
                </Button>
              </Link>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={12}>
        {/* KPI Cards Row */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={6} mb={8}>
          <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white">
            <CardBody p={4}>
              <Text fontSize="sm" color="gray.500" fontWeight="700">Total Orders Today</Text>
              <Heading size="lg" color="blue.500" mt={2}>{data.today.totalOrders}</Heading>
            </CardBody>
          </CardRoot>
          <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white">
            <CardBody p={4}>
              <Text fontSize="sm" color="gray.500" fontWeight="700">Today's Revenue</Text>
              <Heading size="lg" color="green.500" mt={2}>₹{data.today.revenue}</Heading>
            </CardBody>
          </CardRoot>
          <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white">
            <CardBody p={4}>
              <Text fontSize="sm" color="gray.500" fontWeight="700">Average Order Value</Text>
              <Heading size="lg" color="purple.500" mt={2}>₹{data.today.averageOrderValue}</Heading>
            </CardBody>
          </CardRoot>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8}>
          {/* Revenue Chart */}
          <Box gridColumn={{ lg: "span 2" }}>
            <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white" h="full">
              <CardHeader pb={0}>
                <Heading size="md" fontWeight="800">7-Day Revenue</Heading>
              </CardHeader>
              <CardBody pt={4}>
                <Box h="300px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.dailyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { weekday: 'short' })}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(tick) => `₹${tick}`}
                      />
                      <Tooltip 
                        formatter={(value) => [`₹${value}`, 'Revenue']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#38a169" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </CardRoot>
          </Box>

          {/* Top Products */}
          <Box>
            <CardRoot borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" bg="white" h="full">
              <CardHeader pb={0}>
                <Heading size="md" fontWeight="800">Top Products</Heading>
                <Text fontSize="xs" color="gray.500">Based on last 7 days</Text>
              </CardHeader>
              <CardBody pt={4}>
                <VStack align="stretch" spacing={4}>
                  {data.topProducts.map((product, index) => (
                    <Box key={index}>
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" fontWeight="600" noOfLines={1}>{product.name}</Text>
                        <Text fontSize="sm" fontWeight="700" color="gray.600">{product.quantity} sold</Text>
                      </HStack>
                      {/* Simple horizontal progress bar approximation */}
                      <Box w="100%" bg="gray.100" borderRadius="full" h="8px">
                        <Box 
                          bg="blue.400" 
                          h="100%" 
                          borderRadius="full" 
                          w={`${Math.min((product.quantity / (data.topProducts[0]?.quantity || 1)) * 100, 100)}%`} 
                        />
                      </Box>
                    </Box>
                  ))}
                  {data.topProducts.length === 0 && (
                    <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>Not enough data yet.</Text>
                  )}
                </VStack>
              </CardBody>
            </CardRoot>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
