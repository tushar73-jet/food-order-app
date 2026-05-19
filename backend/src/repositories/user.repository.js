import prisma from "../lib/prisma.js";

export const userRepository = {
  findByEmail: async (email) => {
    return prisma.user.findUnique({ where: { email } });
  },

  findById: async (id) => {
    return prisma.user.findUnique({ where: { id: parseInt(id) } });
  },

  create: async (data) => {
    return prisma.user.create({ data });
  },

  updateResetToken: async (email, hashedToken, tokenExpiry) => {
    return prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: tokenExpiry,
      },
    });
  },

  findByValidResetToken: async (hashedToken) => {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gte: new Date() },
      },
    });
  },

  updatePasswordAndClearToken: async (id, hashedPassword) => {
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  },

  findAll: async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  },

  updateRole: async (id, role) => {
    return prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }
};
