import { Container, Heading, Stack, Text } from '@chakra-ui/react';
import styles from './page.module.css'

export default function Home() {
  const companyName = process.env.COMPANY_NAME;
  return (
    <main className={styles.main}>
      <Heading as="h1" textAlign="center">
        Bienvenidos a la intranet{companyName ? ` de ${companyName}` : ''}
      </Heading>
      <Container>
        <Stack spacing={4} marginTop={6}>
          <Text>
            Este es el portal interno de la empresa. Aquí los empleados pueden
            consultar la información corporativa y gestionar el directorio de personal.
          </Text>
          <Text>
            Desde el menú puede ver los datos de la empresa, consultar el directorio
            de empleados, registrar un nuevo empleado y revisar la galería de
            imágenes corporativas.
          </Text>
          <Text>
            El área de TI cuenta además con herramientas de administración para
            verificar el estado del servicio y su capacidad de respuesta.
          </Text>
        </Stack>
      </Container>
    </main>
  )
}
