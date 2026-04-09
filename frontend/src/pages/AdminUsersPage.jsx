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
  Button,
  Alert,
  SimpleGrid,
  Stack
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { fetchAllUsers, updateUserRole } from "../services/api";
import { Link } from "react-router-dom";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users. Are you an admin?");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === "RIDER" ? "USER" : "RIDER";
    
    try {
      await updateUserRole(userId, nextRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
    } catch (err) {
      alert("Failed to update role");
    }
  };

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="#e53e3e" />
      </Center>
    );
  }

  return (
    <Box bg="#f4f6f8" minH="100vh">
        <Box bg="#1a202c" py={6} px={8} color="white" mb={8}>
            <Container maxW="container.xl">
                <HStack justify="space-between">
                    <VStack align="flex-start" spacing={1}>
                        <Heading size="xl" fontWeight="900">Rider Management 🏍️</Heading>
                        <Text color="gray.400">Promote users to Riders for the mobile app.</Text>
                    </VStack>
                    <Link to="/admin/orders">
                        <Button variant="outline" color="white" borderColor="whiteAlpha.500" _hover={{ bg: "whiteAlpha.200" }}>
                            Back to Orders
                        </Button>
                    </Link>
                </HStack>
            </Container>
        </Box>

        <Container maxW="container.xl" pb={10}>
            {error && <Alert status="error" mb={4} borderRadius="xl">{error}</Alert>}
            
            <VStack spacing={4} align="stretch">
                {/* Header Row */}
                <Box px={6} py={3} display={{ base: "none", md: "block" }}>
                    <SimpleGrid columns={4} spacing={4}>
                        <Text fontWeight="800" fontSize="xs" color="gray.500" letterSpacing="wider">NAME</Text>
                        <Text fontWeight="800" fontSize="xs" color="gray.500" letterSpacing="wider">EMAIL</Text>
                        <Text fontWeight="800" fontSize="xs" color="gray.500" letterSpacing="wider">ROLE</Text>
                        <Text fontWeight="800" fontSize="xs" color="gray.500" letterSpacing="wider" textAlign="right">ACTION</Text>
                    </SimpleGrid>
                </Box>

                {users.map(user => (
                    <Box 
                      key={user.id} 
                      bg="white" 
                      p={5} 
                      borderRadius="2xl" 
                      boxShadow="xs" 
                      border="1px solid" 
                      borderColor="gray.100"
                    >
                        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} alignItems="center">
                            <Stack spacing={0}>
                                <Text fontWeight="900" color="#1a202c">{user.name || "Anonymous"}</Text>
                                <Text display={{ base: "block", md: "none" }} fontSize="xs" color="gray.400">{user.email}</Text>
                            </Stack>
                            
                            <Text display={{ base: "none", md: "block" }} color="gray.600" fontWeight="600" fontSize="sm">{user.email}</Text>
                            
                            <Box>
                                <Badge 
                                  bg={user.role === "RIDER" ? "#faf5ff" : "#f1f5f9"} 
                                  color={user.role === "RIDER" ? "#6b21a8" : "#475569"} 
                                  px={3} 
                                  py={1} 
                                  borderRadius="full"
                                  fontSize="xs"
                                  fontWeight="800"
                                >
                                    {user.role}
                                </Badge>
                            </Box>

                            <Box textAlign={{ base: "left", md: "right" }}>
                                <Button 
                                    size="sm" 
                                    bg={user.role === "RIDER" ? "#fff5f5" : "#ebf8ff"}
                                    color={user.role === "RIDER" ? "#c53030" : "#2b6cb0"}
                                    fontWeight="900"
                                    px={6}
                                    borderRadius="lg"
                                    _hover={{ opacity: 0.8 }}
                                    onClick={() => handleToggleRole(user.id, user.role)}
                                    isDisabled={user.role === "ADMIN"}
                                >
                                    {user.role === "RIDER" ? "Revoke Rider" : "Make Rider"}
                                </Button>
                            </Box>
                        </SimpleGrid>
                    </Box>
                ))}
            </VStack>
        </Container>
    </Box>
  );
}
