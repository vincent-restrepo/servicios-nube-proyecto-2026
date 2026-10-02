import { Box, Center, Heading } from '@chakra-ui/react';
import EmpleadoForm from './form';

export default function Page({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <>
      <Center height="100vh">
        <Box>
          <Heading as="h1" size="lg" textAlign="center" color="gray.500">
            Agregar Empleado
          </Heading>
          <EmpleadoForm />
        </Box>
      </Center>
    </>
  );
}
