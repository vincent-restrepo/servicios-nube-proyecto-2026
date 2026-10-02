'use client'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Heading,
  Progress,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import GraficaCpu from '../../../components/GraficaCpu';
import { useEstadoServidor } from '../../../components/useEstadoServidor';

const REFRESCO_MS = 1000;

const formatearUptime = (segundos: number) => {
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return d > 0 ? `${d} d ${h} h ${m} min` : `${h} h ${m} min`;
};

const colorPorUso = (porcentaje: number) =>
  porcentaje >= 80 ? 'red' : porcentaje >= 50 ? 'orange' : 'green';

const Tarjeta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box borderWidth="1px" borderRadius="lg" padding={4}>
    {children}
  </Box>
);

const EstadoServicioPage: React.FC = () => {
  const { estado, historial, error } = useEstadoServidor(REFRESCO_MS);

  return (
    <Box padding={6} maxWidth="900px" marginX="auto">
      <Heading as="h1" size="lg" marginBottom={1}>Estado del servicio</Heading>
      <Text color="gray.600" marginBottom={4}>
        Muestra el servidor que atendió cada consulta. Si el servicio está detrás de un
        balanceador de carga, la gráfica dibuja una línea por instancia.
      </Text>

      {error && (
        <Alert status="error" marginBottom={4} borderRadius="md">
          <AlertIcon />
          No se pudo consultar el estado del servicio.
        </Alert>
      )}

      {estado && (
        <>
          <Box marginBottom={4}>
            <GraficaCpu historial={historial} />
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Tarjeta>
              <Stat>
                <StatLabel>Última instancia que respondió</StatLabel>
                <StatNumber fontSize="xl">{estado.instancia}</StatNumber>
                <StatHelpText>{estado.hostname}</StatHelpText>
              </Stat>
            </Tarjeta>

            <Tarjeta>
              <Stat>
                <StatLabel>Prueba de carga</StatLabel>
                <StatNumber fontSize="xl">
                  {estado.pruebaCarga ? (
                    <Badge colorScheme="red" fontSize="md">
                      En curso · {estado.pruebaCarga.restante} s
                    </Badge>
                  ) : (
                    <Badge colorScheme="green" fontSize="md">Sin prueba</Badge>
                  )}
                </StatNumber>
                <StatHelpText>
                  {estado.stressInstalado
                    ? 'Disponible en Administración → Prueba de carga'
                    : 'El comando stress no está instalado en este servidor'}
                </StatHelpText>
              </Stat>
            </Tarjeta>

            <Tarjeta>
              <Stat>
                <StatLabel>CPU ({estado.nucleos} núcleos)</StatLabel>
                <StatNumber>{estado.cpuPorcentaje} %</StatNumber>
              </Stat>
              <Progress
                value={estado.cpuPorcentaje}
                colorScheme={colorPorUso(estado.cpuPorcentaje)}
                borderRadius="md"
                marginTop={2}
              />
            </Tarjeta>

            <Tarjeta>
              <Stat>
                <StatLabel>Memoria</StatLabel>
                <StatNumber>{estado.memoria.porcentaje} %</StatNumber>
                <StatHelpText>
                  {estado.memoria.usadaMb} MB de {estado.memoria.totalMb} MB
                </StatHelpText>
              </Stat>
              <Progress
                value={estado.memoria.porcentaje}
                colorScheme={colorPorUso(estado.memoria.porcentaje)}
                borderRadius="md"
              />
            </Tarjeta>

            <Tarjeta>
              <Stat>
                <StatLabel>Carga promedio (1 / 5 / 15 min)</StatLabel>
                <StatNumber fontSize="xl">
                  {estado.cargaPromedio.m1} / {estado.cargaPromedio.m5} / {estado.cargaPromedio.m15}
                </StatNumber>
              </Stat>
            </Tarjeta>

            <Tarjeta>
              <Stat>
                <StatLabel>Tiempo encendido</StatLabel>
                <StatNumber fontSize="xl">{formatearUptime(estado.uptimeSegundos)}</StatNumber>
              </Stat>
            </Tarjeta>
          </SimpleGrid>

          <Text fontSize="sm" color="gray.500" marginTop={4} textAlign="center">
            Se actualiza cada {REFRESCO_MS / 1000} s
          </Text>
        </>
      )}
    </Box>
  );
};

export default EstadoServicioPage;
