import express from 'express';
import { createOrganization, getMyOrganizations, addMember, getOrganizationDetails } from '../controllers/organizationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getMyOrganizations)
    .post(createOrganization);

router.route('/:id')
    .get(getOrganizationDetails);

router.route('/:id/members')
    .post(addMember);

export default router;
