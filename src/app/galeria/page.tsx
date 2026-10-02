import { Box, Heading } from '@chakra-ui/react';
import ImageGallery from './gallery';

async function loadImages(): Promise<{ images: string[] }> {
  try {
    const res = await fetch(process.env.AWS_S3_LAMBDA_URL || '', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AWS_S3_LAMBDA_APIKEY || '',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('El servicio de imágenes respondió con estado', res.status);
      return { images: [] };
    }

    const { images } = await res.json();
    return { images: Array.isArray(images) ? images : [] };
  } catch (error) {
    console.error('Error al consultar el servicio de imágenes:', error);
    return { images: [] };
  }
}

export const fetchCache = 'force-no-store'

const GaleriaPage: React.FC = async () => {
  const { images } = await loadImages();
  return (
    <Box padding={4}>
      <Heading as="h1" size="xl" textAlign="center" my={4}>
        Galería de la empresa
      </Heading>
      {images.length > 0 ? (
        <ImageGallery images={images} />
      ) : (
        <Heading as="h2" size="md" textAlign="center" color="gray.500">
          No hay imágenes disponibles por el momento.
        </Heading>
      )}
    </Box>
  );
};

export default GaleriaPage;
