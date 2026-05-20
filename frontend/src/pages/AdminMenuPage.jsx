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
  Button,
  Input,
  Textarea,
  NativeSelect,
  Image,
  IconButton
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { fetchAllRestaurantsAdmin, createProduct, updateProduct, deleteProduct } from "../services/api";
import { Link } from "react-router-dom";

export default function AdminMenuPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Simple form state (in a real app, use a Drawer/Modal from Chakra UI V3)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", category: "", imageUrl: ""
  });

  const loadData = async () => {
    try {
      const { data } = await fetchAllRestaurantsAdmin();
      setRestaurants(data);
      if (data.length > 0 && !selectedRestId) {
        setSelectedRestId(data[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to load restaurants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeRestaurant = restaurants.find(r => r.id.toString() === selectedRestId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        restaurantId: Number(selectedRestId)
      };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", description: "", price: "", category: "", imageUrl: "" });
      loadData();
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save product.");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(productId);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete product.");
    }
  };

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="#e53e3e" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box bg="#f4f6f8" minH="100vh">
      <Box bg="#1a202c" py={6} px={8} color="white" mb={8} boxShadow="md">
        <Container maxW="container.xl">
          <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="flex-start" spacing={1}>
              <Heading size="xl" fontWeight="900">Menu Management</Heading>
              <Text color="gray.400" fontWeight="600">Create, update, and manage your product listings.</Text>
            </VStack>
            <HStack gap={3} wrap="wrap">
              <Link to="/admin/orders">
                <Button colorScheme="whiteAlpha" variant="outline" size="sm" borderRadius="md">
                  🔙 Back to Orders
                </Button>
              </Link>
              <Button 
                colorScheme="red" 
                size="sm" 
                borderRadius="md" 
                bg="#e53e3e"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", description: "", price: "", category: "", imageUrl: "" });
                  setShowForm(!showForm);
                }}
              >
                {showForm ? "Cancel" : "➕ Add Product"}
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={12}>
        <HStack mb={6}>
          <Text fontWeight="800">Select Restaurant: </Text>
          <NativeSelect.Root w="250px" bg="white">
            <NativeSelect.Field 
              value={selectedRestId} 
              onChange={(e) => {
                setSelectedRestId(e.target.value);
                setShowForm(false);
              }}
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </HStack>

        {showForm && (
          <CardRoot mb={8} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
            <CardBody>
              <Heading size="md" mb={4}>{editingId ? 'Edit Product' : 'Add New Product'}</Heading>
              <form onSubmit={handleSubmit}>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <VStack align="stretch">
                    <Text fontSize="sm" fontWeight="700">Name</Text>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </VStack>
                  <VStack align="stretch">
                    <Text fontSize="sm" fontWeight="700">Category</Text>
                    <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </VStack>
                  <VStack align="stretch">
                    <Text fontSize="sm" fontWeight="700">Price (₹)</Text>
                    <Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </VStack>
                  <VStack align="stretch">
                    <Text fontSize="sm" fontWeight="700">Image URL</Text>
                    <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                  </VStack>
                  <VStack align="stretch" gridColumn={{ md: "span 2" }}>
                    <Text fontSize="sm" fontWeight="700">Description</Text>
                    <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </VStack>
                </SimpleGrid>
                <Button type="submit" mt={4} colorScheme="blue" bg="blue.500" color="white" borderRadius="md">
                  {editingId ? 'Update Product' : 'Save Product'}
                </Button>
              </form>
            </CardBody>
          </CardRoot>
        )}

        {activeRestaurant && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
            {activeRestaurant.products?.map(product => (
              <CardRoot key={product.id} borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.100" boxShadow="sm">
                <Image src={product.imageUrl || 'https://placehold.co/400x300'} h="150px" w="100%" objectFit="cover" />
                <CardBody p={4}>
                  <Badge colorScheme="purple" mb={2}>{product.category}</Badge>
                  <Heading size="sm" noOfLines={1}>{product.name}</Heading>
                  <Text fontSize="xs" color="gray.500" mt={1} noOfLines={2}>{product.description}</Text>
                  <HStack justify="space-between" mt={4} align="center">
                    <Text fontWeight="800">₹{product.price}</Text>
                    <HStack>
                      <Button size="xs" onClick={() => {
                        setEditingId(product.id);
                        setFormData({
                          name: product.name,
                          description: product.description,
                          price: product.price,
                          category: product.category,
                          imageUrl: product.imageUrl || ""
                        });
                        setShowForm(true);
                      }}>Edit</Button>
                      <Button size="xs" colorScheme="red" variant="outline" onClick={() => handleDelete(product.id)}>Del</Button>
                    </HStack>
                  </HStack>
                </CardBody>
              </CardRoot>
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}
