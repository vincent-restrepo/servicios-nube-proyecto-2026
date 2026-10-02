'use client'
import { Box, Flex, Text } from '@chakra-ui/react';
import type { Muestra } from './useEstadoServidor';

const COLORES = ['#2b6cb0', '#dd6b20', '#2f855a', '#805ad5', '#d53f8c', '#718096'];

const ANCHO = 640;
const ALTO = 240;
const MARGEN = { izq: 44, der: 12, arr: 12, aba: 28 };
const NIVELES = [0, 25, 50, 75, 100];

/**
 * Gráfica en vivo del uso de CPU. Dibuja una línea por instancia, de modo que
 * detrás de un balanceador de carga se vea cada servidor por separado.
 */
const GraficaCpu: React.FC<{ historial: Muestra[]; ventanaSegundos?: number }> = ({
  historial,
  ventanaSegundos = 120,
}) => {
  if (historial.length === 0) {
    return (
      <Box borderWidth="1px" borderRadius="lg" padding={6} textAlign="center" color="gray.500">
        Esperando datos del servidor…
      </Box>
    );
  }

  const fin = historial[historial.length - 1].t;
  const inicio = fin - ventanaSegundos * 1000;
  const anchoUtil = ANCHO - MARGEN.izq - MARGEN.der;
  const altoUtil = ALTO - MARGEN.arr - MARGEN.aba;

  const x = (t: number) => MARGEN.izq + ((t - inicio) / (fin - inicio)) * anchoUtil;
  const y = (cpu: number) => MARGEN.arr + (1 - Math.min(Math.max(cpu, 0), 100) / 100) * altoUtil;

  const instancias = Array.from(new Set(historial.map((m) => m.instancia)));
  const ultimoPorInstancia = (id: string) => {
    const propias = historial.filter((m) => m.instancia === id);
    return propias[propias.length - 1];
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" padding={4}>
      <Text fontWeight="bold" marginBottom={2}>Uso de CPU en tiempo real</Text>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        width="100%"
        role="img"
        aria-label="Gráfica del uso de CPU de las instancias en los últimos segundos"
      >
        {NIVELES.map((nivel) => (
          <g key={nivel}>
            <line
              x1={MARGEN.izq}
              x2={ANCHO - MARGEN.der}
              y1={y(nivel)}
              y2={y(nivel)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text x={MARGEN.izq - 6} y={y(nivel) + 4} textAnchor="end" fontSize={11} fill="#718096">
              {nivel}%
            </text>
          </g>
        ))}
        <text x={MARGEN.izq} y={ALTO - 8} fontSize={11} fill="#718096">
          -{ventanaSegundos} s
        </text>
        <text x={ANCHO - MARGEN.der} y={ALTO - 8} textAnchor="end" fontSize={11} fill="#718096">
          ahora
        </text>

        {instancias.map((id, i) => {
          const color = COLORES[i % COLORES.length];
          const puntos = historial.filter((m) => m.instancia === id);
          return (
            <g key={id}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                points={puntos.map((m) => `${x(m.t).toFixed(1)},${y(m.cpu).toFixed(1)}`).join(' ')}
              />
              {puntos.length > 0 && (
                <circle
                  cx={x(puntos[puntos.length - 1].t)}
                  cy={y(puntos[puntos.length - 1].cpu)}
                  r={3.5}
                  fill={color}
                />
              )}
            </g>
          );
        })}
      </svg>

      <Flex gap={4} wrap="wrap" marginTop={2}>
        {instancias.map((id, i) => (
          <Flex key={id} align="center" gap={2}>
            <Box width="12px" height="12px" borderRadius="full" bg={COLORES[i % COLORES.length]} />
            <Text fontSize="sm">
              {id}: <b>{ultimoPorInstancia(id).cpu} %</b>
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default GraficaCpu;
