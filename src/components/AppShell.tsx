'use client'
import {
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  IconButton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type NavLink = { href: string; label: string };
type NavSection = { title?: string; links: NavLink[] };

const SECTIONS: NavSection[] = [
  {
    links: [
      { href: '/', label: 'Inicio' },
      { href: '/empresa', label: 'Empresa' },
      { href: '/empleados', label: 'Empleados' },
      { href: '/galeria', label: 'Galería' },
      { href: '/empleados/nuevo', label: 'Nuevo empleado' },
    ],
  },
  {
    title: 'Administración',
    links: [
      { href: '/administracion/carga', label: 'Prueba de carga' },
      { href: '/administracion/estado', label: 'Estado del servicio' },
    ],
  },
];

const SidebarContent: React.FC<{ companyName: string; onNavigate?: () => void }> = ({
  companyName,
  onNavigate,
}) => {
  const pathname = usePathname();

  return (
    <Stack spacing={5} align="stretch">
      <Box paddingX={2}>
        <Text fontSize="xl" fontWeight="bold">{companyName}</Text>
        <Text fontSize="sm" color="gray.500">Intranet</Text>
      </Box>

      {SECTIONS.map((section, index) => (
        <Stack key={section.title ?? index} spacing={1} align="stretch">
          {section.title && (
            <>
              <Divider />
              <Text
                paddingX={2}
                paddingTop={2}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                color="gray.500"
              >
                {section.title}
              </Text>
            </>
          )}
          {section.links.map((link) => {
            const isActive = pathname === link.href;
            return (
              // Enlace normal (no next/link) para que cada sección cargue datos frescos.
              <Button
                key={link.href}
                as="a"
                href={link.href}
                onClick={onNavigate}
                justifyContent="flex-start"
                variant={isActive ? 'solid' : 'ghost'}
                colorScheme={isActive ? 'blue' : 'gray'}
                fontWeight={isActive ? 'bold' : 'medium'}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </Button>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
};

const AppShell: React.FC<{ companyName: string; children: ReactNode }> = ({
  companyName,
  children,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex minHeight="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Pantallas pequeñas: barra superior con el menú en un cajón */}
      <Flex
        display={{ base: 'flex', md: 'none' }}
        align="center"
        gap={3}
        paddingX={4}
        paddingY={2}
        boxShadow="base"
      >
        <IconButton aria-label="Abrir menú" icon={<HamburgerIcon />} onClick={onOpen} />
        <Text fontSize="lg" fontWeight="bold">{companyName}</Text>
      </Flex>
      <Drawer placement="left" isOpen={isOpen} onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader />
          <DrawerBody>
            <SidebarContent companyName={companyName} onNavigate={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Pantallas medianas y grandes: barra lateral siempre visible */}
      <Box
        as="aside"
        display={{ base: 'none', md: 'block' }}
        width="250px"
        flexShrink={0}
        position="sticky"
        top={0}
        height="100vh"
        overflowY="auto"
        padding={4}
        borderRightWidth="1px"
        bg="gray.50"
      >
        <SidebarContent companyName={companyName} />
      </Box>

      <Box as="main" flex="1" minWidth={0}>
        {children}
      </Box>
    </Flex>
  );
};

export default AppShell;
