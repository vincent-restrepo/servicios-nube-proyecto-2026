'use client'
import {
  Box,
  Button,
  Flex,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDownIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import { ReactNode } from 'react';

const NavItem: React.FC<{ href: string; children: ReactNode; }> = ({ href, children }) => (
  <Box as="li" listStyleType="none" marginRight="4">
    <Link
      href={href}
      fontSize="lg"
      fontWeight="bold"
      color="blue.500"
      _hover={{ textDecoration: 'underline' }}
    >
      {children}
    </Link>
  </Box>
);

const AdminMenu: React.FC = () => (
  <Box as="li" listStyleType="none" marginRight="4">
    <Menu>
      <MenuButton
        as={Button}
        variant="link"
        colorScheme="blue"
        fontSize="lg"
        fontWeight="bold"
        rightIcon={<ChevronDownIcon />}
      >
        Administración
      </MenuButton>
      <MenuList>
        <MenuItem as="a" href="/administracion/carga">Prueba de carga</MenuItem>
        <MenuItem as="a" href="/administracion/estado">Estado del servicio</MenuItem>
      </MenuList>
    </Menu>
  </Box>
);

const Navbar: React.FC<{ companyName: string }> = ({ companyName }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      paddingX={4}
      paddingY={2}
      boxShadow="base"
      flexWrap="wrap"
    >
      <Text fontSize="lg" fontWeight="bold">{companyName}</Text>
      <IconButton
        display={{ base: 'block', md: 'none' }}
        aria-label="Abrir menú"
        icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
        onClick={isOpen ? onClose : onOpen}
      />
      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={2}
        display={{ base: isOpen ? 'block' : 'none', md: 'flex' }}
      >
        <NavItem href="/">Inicio</NavItem>
        <NavItem href="/empresa">Empresa</NavItem>
        <NavItem href="/empleados">Empleados</NavItem>
        <NavItem href="/empleados/nuevo">Nuevo empleado</NavItem>
        <NavItem href="/galeria">Galería</NavItem>
        <AdminMenu />
      </Stack>
    </Flex>
  );
};

export default Navbar;
