import { authService } from "../services/auth.service.js";

export const authController = {
  register: async (req, res) => {
    const result = await authService.register(req.validated.body);
    res.status(201).json(result);
  },

  login: async (req, res) => {
    const result = await authService.login(req.validated.body);
    res.json(result);
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  },

  resetPassword: async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.json(result);
  },

  getAllUsers: async (req, res) => {
    const users = await authService.getAllUsers();
    res.json(users);
  },

  updateUserRole: async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const updatedUser = await authService.updateUserRole(id, role);
    res.json(updatedUser);
  }
};
