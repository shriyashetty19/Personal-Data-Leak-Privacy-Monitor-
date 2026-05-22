import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { logAction } from '../utils/auditLogger.js';

// @desc    Create a new organization
// @route   POST /api/organization
// @access  Private
export const createOrganization = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Organization name is required' });

        const org = await Organization.create({
            name,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'admin' }]
        });

        res.status(201).json(org);

        await logAction({
            userId: req.user._id,
            orgId: org._id,
            action: 'ORG_CREATED',
            resource: 'ORGANIZATION',
            details: { name }
        }, req);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's organizations
// @route   GET /api/organization
// @access  Private
export const getMyOrganizations = async (req, res) => {
    try {
        const orgs = await Organization.find({
            'members.user': req.user._id
        }).populate('owner', 'name email');
        
        res.status(200).json(orgs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add member to organization
// @route   POST /api/organization/:id/members
// @access  Private (Admin only)
export const addMember = async (req, res) => {
    try {
        const { email, role } = req.body;
        const org = await Organization.findById(req.params.id);

        if (!org) return res.status(404).json({ message: 'Organization not found' });

        // Check if requester is admin
        const requester = org.members.find(m => m.user.toString() === req.user._id.toString());
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const userToAdd = await User.findOne({ email });
        if (!userToAdd) return res.status(404).json({ message: 'User not found' });

        // Check if already a member
        if (org.members.some(m => m.user.toString() === userToAdd._id.toString())) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        org.members.push({ user: userToAdd._id, role: role || 'member' });
        await org.save();

        res.status(200).json(org);

        await logAction({
            userId: req.user._id,
            orgId: org._id,
            action: 'MEMBER_ADDED',
            resource: 'ORGANIZATION',
            details: { memberEmail: email, role }
        }, req);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get organization details
// @route   GET /api/organization/:id
// @access  Private
export const getOrganizationDetails = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id)
            .populate('members.user', 'name email')
            .populate('owner', 'name email');

        if (!org) return res.status(404).json({ message: 'Organization not found' });

        // Check if requester is a member
        if (!org.members.some(m => m.user._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.status(200).json(org);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
