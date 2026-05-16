import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { createAuditLog } from './AuditController';
import { logger } from "../shared/logger";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { branch: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Credenciais inválidas ou usuário inativo.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, branchId: user.branchId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    await createAuditLog(user.id, 'LOGIN', 'AUTH', user.id, null, { email: user.email }, req.ip);

    res.json({
      message: 'Login realizado com sucesso.',
      token,
      user: userWithoutPassword
    });
  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};
