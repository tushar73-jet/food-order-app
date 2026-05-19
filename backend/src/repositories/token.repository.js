import prisma from "../lib/prisma.js";

export const tokenRepository = {
  createRefreshToken: async (userId, token, expiresAt) => {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  },

  findRefreshToken: async (token) => {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  revokeRefreshToken: async (token) => {
    return prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }
};
