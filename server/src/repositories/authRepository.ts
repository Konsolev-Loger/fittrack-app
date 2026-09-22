import type { RegisterRequest, UserPayload, UserWithPassword } from "../types/auth";
import { prisma } from "../utils/prisma";


class AuthRepository {
	async findByEmail(email: string): Promise<UserWithPassword | null> {
		return prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				name: true,
				password: true,
			},
		});
	}

	async findById(id: string): Promise<UserPayload | null> {
		return prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
			},
		});
	}
	async createUser(data: RegisterRequest): Promise<UserPayload> {
		return prisma.user.create({
			data,
			select: {
				id: true,
				email: true,
				name: true,
			},
		});
	}
}

export const authRepository = new AuthRepository();
