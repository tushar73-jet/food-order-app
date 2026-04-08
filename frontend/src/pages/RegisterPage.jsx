import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Text, 
  Input, 
  Button, 
  Alert, 
  Center, 
  Stack, 
  Separator, 
  HStack,
  SimpleGrid
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ name, email, password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="#fcfcfc" minH="90vh" display="flex" alignItems="center">
        <Container maxW="container.lg">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={20} align="center">
                <VStack align="flex-start" spacing={8} display={{ base: "none", md: "flex" }}>
                    <Heading size="4xl" fontWeight="900" letterSpacing="tight">
                        Healthy meals <br/>
                        <Text as="span" color="#e53e3e">delivered</Text> <br/>
                        every single day.
                    </Heading>
                    <Text fontSize="xl" color="gray.500" fontWeight="600" lineHeight="1.8">
                        Join the foodstore community today to unlock exclusive perks, faster checkout, and real-time order tracking.
                    </Text>
                </VStack>

                <Box bg="white" p={12} borderRadius="3xl" boxShadow="2xl" w="full" maxW="450px" borderWidth="1px" borderColor="gray.100">
                    <VStack spacing={8} align="stretch" as="form" onSubmit={handleSubmit}>
                        <VStack align="flex-start" spacing={1}>
                            <Heading size="xl" fontWeight="900">Sign Up</Heading>
                            <Text color="gray.400" fontWeight="700">Create your foodstore account</Text>
                        </VStack>

                        {error && (
                            <Alert.Root status="error" borderRadius="xl">
                                {error}
                            </Alert.Root>
                        )}

                        <VStack spacing={4}>
                            <Input 
                                placeholder="Full Name" 
                                size="lg" 
                                h="14" 
                                borderRadius="xl" 
                                bg="gray.50" 
                                border="none" 
                                fontWeight="600"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <Input 
                                type="email" 
                                placeholder="Email Address" 
                                size="lg" 
                                h="14" 
                                borderRadius="xl" 
                                bg="gray.50" 
                                border="none" 
                                fontWeight="600"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input 
                                type="password" 
                                placeholder="Create Password" 
                                size="lg" 
                                h="14" 
                                borderRadius="xl" 
                                bg="gray.50" 
                                border="none" 
                                fontWeight="600"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </VStack>

                        <Button 
                            type="submit" 
                            bg="#e53e3e" 
                            color="white" 
                            size="xl" 
                            h="16" 
                            borderRadius="2xl" 
                            fontWeight="900" 
                            fontSize="xl" 
                            isLoading={loading}
                            _hover={{ bg: "#c53030", transform: 'translateY(-2px)', shadow: 'xl' }}
                        >
                            Sign Up
                        </Button>

                        <HStack w="full" justify="center" py={4}>
                            <Separator />
                            <Text color="gray.300" fontSize="xs" fontWeight="900" whiteSpace="nowrap" px={4}>ALREADY ENROLLED?</Text>
                            <Separator />
                        </HStack>

                        <Button 
                            as={Link} 
                            to="/login" 
                            variant="outline" 
                            size="lg" 
                            h="14" 
                            borderRadius="xl" 
                            fontWeight="800"
                            borderColor="gray.200"
                        >
                            Log In Instead
                        </Button>
                    </VStack>
                </Box>
            </SimpleGrid>
        </Container>
    </Box>
  );
};

export default RegisterPage;
