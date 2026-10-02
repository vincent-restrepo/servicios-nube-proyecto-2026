'use client'
import { useState } from 'react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Heading,
  Input,
  InputGroup,
  InputRightAddon,
  Text,
  VStack,
} from '@chakra-ui/react';
import GraficaCpu from '../../../components/GraficaCpu';
import { useEstadoServidor } from '../../../components/useEstadoServidor';

type Resultado = {
  status: 'success' | 'warning' | 'error';
  titulo: string;
  detalle: string;
};

const MAX_SEGUNDOS = 600;

const PruebaDeCargaPage: React.FC = () => {
  const [isLoading, setLoading] = useState(false);
  const [duration, setDuration] = useState(60);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const { estado, historial } = useEstadoServidor(1000);

  const iniciarPrueba = async (segundos: number) => {
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/carga?segundos=${segundos}`, { method: 'POST' });
      const data = await res.json();

      if (res.status === 202) {
        setResultado({
          status: 'success',
          titulo: `Prueba iniciada en la instancia ${data.instancia}`,
          detalle: `Durará ${data.segundos} segundos. Observe la gráfica o conéctese por SSH a esa instancia y use top o htop.`,
        });
      } else if (res.status === 409) {
        setResultado({
          status: 'warning',
          titulo: `Ya hay una prueba en curso en la instancia ${data.instancia}`,
          detalle: `Quedan ${data.restante} segundos.`,
        });
      } else {
        setResultado({
          status: 'error',
          titulo: 'No se pudo iniciar la prueba',
          detalle: data.message ?? 'Error desconocido',
        });
      }
    } catch (error) {
      console.error('Error al iniciar la prueba de carga:', error);
      setResultado({
        status: 'error',
        titulo: 'No se pudo iniciar la prueba',
        detalle: 'No hubo respuesta del servidor.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding={6} maxWidth="760px" marginX="auto">
      <VStack spacing={5} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="lg">Prueba de carga</Heading>
          <Text color="gray.600" marginTop={2}>
            Genera carga de CPU, memoria y disco en el servidor que atiende esta petición
            (máximo {MAX_SEGUNDOS} segundos). Úsela para verificar cómo responde la infraestructura.
          </Text>
        </Box>

        {estado && !estado.stressInstalado && (
          <Alert status="warning" borderRadius="md" alignItems="flex-start">
            <AlertIcon />
            <Box>
              <AlertTitle>El comando stress no está instalado</AlertTitle>
              <AlertDescription>
                Instálelo en el servidor con <code>sudo apt install stress -y</code> (o{' '}
                <code>sudo yum install stress -y</code>) antes de iniciar la prueba.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <VStack spacing={4}>
          <InputGroup width="12em">
            <Input
              type="number"
              min={1}
              max={MAX_SEGUNDOS}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              aria-label="Duración en segundos"
            />
            <InputRightAddon>Segundos</InputRightAddon>
          </InputGroup>
          <Button
            colorScheme="red"
            size="lg"
            isLoading={isLoading}
            loadingText="Iniciando"
            rightIcon={<WarningTwoIcon boxSize={5} />}
            onClick={() => iniciarPrueba(duration)}
          >
            Iniciar prueba de carga
          </Button>
          {estado?.pruebaCarga && (
            <Badge colorScheme="red" fontSize="md" padding={1}>
              En curso en {estado.instancia} · quedan {estado.pruebaCarga.restante} s
            </Badge>
          )}
        </VStack>

        {resultado && (
          <Alert status={resultado.status} alignItems="flex-start" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>{resultado.titulo}</AlertTitle>
              <AlertDescription>{resultado.detalle}</AlertDescription>
            </Box>
          </Alert>
        )}

        <GraficaCpu historial={historial} />
      </VStack>
    </Box>
  );
};

export default PruebaDeCargaPage;
