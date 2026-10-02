import { Box, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

const COLUMN_LABELS: Record<string, string> = {
  id: 'ID',
  nombre: 'Nombre',
  apellido: 'Apellido',
  fecha_nacimiento: 'Fecha de nacimiento',
  direccion: 'Dirección',
  correo_electronico: 'Correo electrónico',
  cargo: 'Cargo',
};

const formatValue = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toLocaleDateString('es-CO');
  }
  return String(value ?? '');
};

const JsonTablePage: React.FC<{ jsonData: any }> = ({ jsonData }) => {
  // Asegura que los datos sean un arreglo de objetos
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return <Box textAlign="center">No hay empleados para mostrar.</Box>;
  }

  // Extrae las claves del primer objeto para crear las columnas de la tabla
  const columns = Object.keys(jsonData[0]);

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          {columns.map((column) => (
            <Th key={column}>{COLUMN_LABELS[column] ?? column}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {jsonData.map((row, rowIndex) => (
          <Tr key={rowIndex}>
            {columns.map((column) => (
              <Td key={column}>
                <span>{formatValue(row[column])}</span>
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default JsonTablePage;
