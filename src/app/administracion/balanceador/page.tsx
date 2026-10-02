'use client'
import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Box, Heading, Text } from '@chakra-ui/react';

const REFRESCO_MS = 1000;

const BalanceadorPage: React.FC = () => {
  const [html, setHtml] = useState('');
  const [codigoHttp, setCodigoHttp] = useState<number | null>(null);
  const [ultima, setUltima] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let montado = true;

    const consultar = async () => {
      try {
        // /proxy reenvía la petición a la URL del balanceador (LOAD_BALANCER_URL)
        const res = await fetch(`/proxy?nocache=${Date.now()}`, { cache: 'no-store' });
        const texto = await res.text();
        if (!montado) return;
        setHtml(texto);
        setCodigoHttp(res.status);
        setUltima(new Date());
        setError(false);
      } catch (e) {
        console.error('Error al consultar el balanceador de carga:', e);
        if (montado) setError(true);
      }
    };

    consultar();
    const intervalo = setInterval(consultar, REFRESCO_MS);
    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, []);

  return (
    <Box padding={6} maxWidth="900px" marginX="auto">
      <Heading as="h1" size="lg" marginBottom={1}>Balanceador de carga</Heading>
      <Text color="gray.600" marginBottom={4}>
        Muestra la respuesta del balanceador de carga, consultada cada segundo. Cada petición
        puede ser atendida por un servidor distinto.
      </Text>

      {error && (
        <Alert status="error" marginBottom={4} borderRadius="md">
          <AlertIcon />
          No se pudo contactar el balanceador de carga.
        </Alert>
      )}

      <Box
        borderWidth="1px"
        borderRadius="lg"
        minHeight="400px"
        overflow="auto"
        dangerouslySetInnerHTML={{ __html: html }}
        suppressHydrationWarning
      />

      <Text fontSize="sm" color="gray.500" marginTop={3} textAlign="center" suppressHydrationWarning>
        {ultima
          ? `Última actualización: ${ultima.toLocaleTimeString()} · respuesta HTTP ${codigoHttp}`
          : 'Consultando…'}
      </Text>
    </Box>
  );
};

export default BalanceadorPage;
