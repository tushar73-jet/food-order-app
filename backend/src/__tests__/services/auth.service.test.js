import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/auth.service.js';
import { userRepository } from '../../repositories/user.repository.js';
import { tokenRepository } from '../../repositories/token.repository.js';
import { AppError } from '../../utils/AppError.js';
import bcrypt from 'bcryptjs';

vi.mock('../../repositories/user.repository.js');
vi.mock('../../repositories/token.repository.js');
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  }
}));
vi.mock('../../lib/mailer.js');

describe('authService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('register', () => {
    it('should throw error if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValueOnce({ id: 1, email: 'test@test.com' });

      await expect(authService.register({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User'
      })).rejects.toThrow(AppError);
    });

    it('should create user successfully', async () => {
      userRepository.findByEmail.mockResolvedValueOnce(null);
      bcrypt.hash.mockResolvedValueOnce('hashedPassword');
      
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        role: 'USER'
      };
      userRepository.create.mockResolvedValueOnce(mockUser);
      tokenRepository.createRefreshToken.mockResolvedValueOnce({});

      const result = await authService.register({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(result.message).toBe('User created!');
      expect(result.user.email).toBe('test@test.com');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
