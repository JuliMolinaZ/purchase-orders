import bcrypt from 'bcrypt';

/**
 * Interfaz de Usuario
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department?: string;
}

/**
 * Interfaz de Usuario con contraseña (solo para uso interno)
 */
interface UserWithPassword extends User {
  password: string; // Hash
}

/**
 * Base de datos de usuarios
 * IMPORTANTE: En producción, esto debería estar en una base de datos real
 *
 * Usuario configurado:
 * - Admin: admin@runsolutions.com / Admin2025!
 */
const USERS_DB: UserWithPassword[] = [
  {
    id: '1',
    name: 'Administrador RUN',
    email: 'admin@runsolutions.com',
    // Hash de: Admin2025!
    password: '$2b$10$8ZHPi321Vk13vuXl9VK7eu15GJVHE0zPILudrhTaceHghGIkNaQnm',
    role: 'admin',
    department: 'Dirección General',
  },
];

/**
 * Genera el hash de una contraseña
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica si una contraseña coincide con su hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado
 * @returns true si coincide, false si no
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Busca un usuario por email
 * @param email - Email del usuario
 * @returns Usuario encontrado o null
 */
export async function findUserByEmail(
  email: string
): Promise<UserWithPassword | null> {
  const user = USERS_DB.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  return user || null;
}

/**
 * Busca un usuario por ID
 * @param id - ID del usuario
 * @returns Usuario sin contraseña o null
 */
export async function findUserById(id: string): Promise<User | null> {
  const user = USERS_DB.find((u) => u.id === id);
  if (!user) return null;

  // Retornar usuario sin la contraseña
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Autentica un usuario
 * @param email - Email del usuario
 * @param password - Contraseña en texto plano
 * @returns Usuario sin contraseña si es válido, null si no
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return null;
  }

  // Retornar usuario sin la contraseña
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Obtiene todos los usuarios (sin contraseñas)
 * Solo para uso administrativo
 */
export async function getAllUsers(): Promise<User[]> {
  return USERS_DB.map(({ password, ...user }) => user);
}

/**
 * Valida la fortaleza de una contraseña
 * @param password - Contraseña a validar
 * @returns true si es válida, false si no
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
