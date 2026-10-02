CREATE TABLE public.empleado (
    id serial PRIMARY KEY,
    nombre varchar(50),
    apellido varchar(50),
    fecha_nacimiento date,
    direccion varchar(100),
    correo_electronico varchar(100),
    cargo varchar(50)
);

-- datos ficticios
INSERT INTO public.empleado (nombre, apellido, fecha_nacimiento, direccion, correo_electronico, cargo)
VALUES
    ('Ana', 'López', '2000-04-10', 'Calle 321, Ciudad', 'ana.lopez@example.com', 'Desarrolladora de software'),
    ('Carlos', 'Rodríguez', '1999-08-22', 'Avenida 654, Ciudad', 'carlos@example.com', 'Arquitecto de soluciones'),
    ('Sofía', 'Hernández', '1998-07-15', 'Calle 987, Ciudad', 'sofia@example.com', 'Contadora'),
    ('Diego', 'Gómez', '2001-01-05', 'Calle 123, Ciudad', 'diego@example.com', 'Ingeniero DevOps'),
    ('Laura', 'Díaz', '1999-03-20', 'Avenida 456, Ciudad', 'laura@example.com', 'Analista de datos'),
    ('Pedro', 'Ramírez', '1997-11-28', 'Calle 789, Ciudad', 'pedro@example.com', 'Gerente de proyectos'),
    ('Isabel', 'Torres', '1996-06-14', 'Avenida 654, Ciudad', 'isabel@example.com', 'Diseñadora UX'),
    ('Miguel', 'Pérez', '2002-09-08', 'Calle 321, Ciudad', 'miguel@example.com', 'Soporte técnico'),
    ('Carolina', 'García', '2000-02-25', 'Avenida 987, Ciudad', 'carolina@example.com', 'Analista financiera'),
    ('Andrés', 'López', '1998-05-12', 'Calle 123, Ciudad', 'andres@example.com', 'Especialista en seguridad'),
    ('Valeria', 'Mora', '1990-03-26', 'Calle 20, Ciudad', 'valeria@example.com', 'Directora de tecnología'),
    ('Elena', 'Gómez', '1997-09-18', 'Avenida 1234, Ciudad', 'elena@example.com', 'Ingeniera de redes'),
    ('Roberto', 'Fernández', '1996-12-05', 'Calle 5678, Ciudad', 'roberto@example.com', 'Administrador de sistemas'),
    ('Fernanda', 'Sánchez', '1999-02-28', 'Calle 9999, Ciudad', 'fernanda@example.com', 'Coordinadora de talento humano'),
    ('Julio', 'Martínez', '2001-05-10', 'Avenida 5555, Ciudad', 'julio@example.com', 'Analista de calidad'),
    ('Patricia', 'Torres', '1998-08-22', 'Calle 3333, Ciudad', 'patricia@example.com', 'Abogada corporativa'),
    ('Raúl', 'López', '1995-04-15', 'Avenida 7777, Ciudad', 'raul@example.com', 'Líder de ventas'),
    ('Natalia', 'Hernández', '2000-07-20', 'Calle 2222, Ciudad', 'natalia@example.com', 'Asistente administrativa'),
    ('Andrea', 'Ramírez', '1997-10-12', 'Calle 1111, Ciudad', 'andrea@example.com', 'Administradora de bases de datos'),
    ('Hugo', 'González', '1996-03-28', 'Avenida 8888, Ciudad', 'hugo@example.com', 'Gerente de operaciones'),
    ('Silvia', 'Pérez', '2002-01-08', 'Calle 4444, Ciudad', 'silvia@example.com', 'Especialista en cloud');
