import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../ports/auth.repository.interface';
import { User } from '../../domain/user.entity';

export class ValidateUser {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(email: string, password: string): Promise<User | null> {
    const user = await this.authRepo.findByEmail(email);
    if (!user || !user.isActive) return null;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return null;

    return user;
  }
}
