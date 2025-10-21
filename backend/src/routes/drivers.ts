import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { requireCsrf } from '../middleware/csrf';
import { User } from '../models/User';

const router = Router();

/**
 * GET /drivers/vehicle
 * 
 * Get current driver's vehicle information.
 * Protected: requires 'driver' role
 */
router.get('/vehicle', requireAuth, requireRole('driver'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ 
        code: 'not_found', 
        message: 'User not found' 
      });
    }

    // Return vehicle info
    return res.status(200).json({
      vehicleId: user.driver?.vehicleId || null,
      hasVehicle: !!user.driver?.vehicleId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /drivers/vehicle
 * 
 * Register a new vehicle for the current driver.
 * Protected: requires 'driver' role + CSRF token
 * 
 * Request body:
 * {
 *   "vehicleId": "ABC123"
 * }
 * 
 * Headers:
 * - X-CSRF-Token: <csrf_token from cookie>
 */
router.post('/vehicle', requireAuth, requireRole('driver'), requireCsrf, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const { vehicleId } = req.body;

    if (!vehicleId || typeof vehicleId !== 'string') {
      return res.status(400).json({
        code: 'invalid_schema',
        message: 'Validation failed',
        details: [{ field: 'vehicleId', issue: 'required' }],
      });
    }

    // Update user's vehicle
    const user = await User.findByIdAndUpdate(
      userId,
      { 'driver.vehicleId': vehicleId },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ 
        code: 'not_found', 
        message: 'User not found' 
      });
    }

    return res.status(201).json({
      vehicleId: user.driver?.vehicleId,
      hasVehicle: true,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /drivers/vehicle
 * 
 * Update current driver's vehicle information.
 * Protected: requires 'driver' role + CSRF token
 * 
 * Request body:
 * {
 *   "vehicleId": "XYZ789"
 * }
 * 
 * Headers:
 * - X-CSRF-Token: <csrf_token from cookie>
 */
router.patch('/vehicle', requireAuth, requireRole('driver'), requireCsrf, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const { vehicleId } = req.body;

    if (!vehicleId || typeof vehicleId !== 'string') {
      return res.status(400).json({
        code: 'invalid_schema',
        message: 'Validation failed',
        details: [{ field: 'vehicleId', issue: 'required' }],
      });
    }

    // Update user's vehicle
    const user = await User.findByIdAndUpdate(
      userId,
      { 'driver.vehicleId': vehicleId },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ 
        code: 'not_found', 
        message: 'User not found' 
      });
    }

    return res.status(200).json({
      vehicleId: user.driver?.vehicleId,
      hasVehicle: !!user.driver?.vehicleId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
