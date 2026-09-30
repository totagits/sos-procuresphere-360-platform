import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logAuditEvent } from '../services/audit-trail.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sos-procuresphere-secret-key-2026';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact an Administrator.' });
    }

    // Trigger JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        locationId: user.locationId,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Audit Log this activity
    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: `Successful login session initiated. 2FA verification code bypassed via secure mock policy.`,
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        locationId: user.locationId,
      },
      requires2FA: true, // Simulates active 2FA check trigger for UI presentation
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-2fa', (req, res) => {
  const { token, code } = req.body;
  // Simulates TOTP verification key check. 
  // Any 6 digit code containing standard numeric entries works in sandbox.
  if (/^\d{6}$/.test(code)) {
    res.json({ success: true, message: 'TOTP authentication code accepted.' });
  } else {
    res.status(400).json({ error: 'Invalid security code. Attempt logged.' });
  }
});

export default router;
