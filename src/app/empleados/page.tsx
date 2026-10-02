import { Box, Heading } from '@chakra-ui/react';
import getDatabaseData from './db';
import JsonTablePage from './jsonTable'

export default async function Page() {
  const data = await getDatabaseData();

  return (
    <Box padding={4}>
      <Heading as="h1" size="xl" textAlign="center" my={4}>
        Directorio de empleados
      </Heading>
      <JsonTablePage jsonData={data} />
    </Box>
  );
}
