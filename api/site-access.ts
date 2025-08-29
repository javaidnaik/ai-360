/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Use environment variable for persistence across deployments
const getSiteAccessEnabled = () => {
  return process.env.SITE_ACCESS_ENABLED !== 'false';
};

const setSiteAccessEnabled = (enabled: boolean) => {
  // In production, you'd update this via Vercel API or environment variables
  // For now, we'll use a simple approach
  process.env.SITE_ACCESS_ENABLED = enabled.toString();
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check if user is super admin (basic check - in production, use proper JWT validation)
  const userRole = req.headers['x-user-role'] || req.cookies['user-role'];
  
  if (req.method === 'GET') {
    // Anyone can check the site access status
    const currentStatus = getSiteAccessEnabled();
    res.status(200).json({ 
      siteAccessEnabled: currentStatus,
      userRole: userRole || 'guest'
    });
    return;
  }

  if (req.method === 'POST') {
    // Only super admins can change site access
    if (userRole !== 'superadmin') {
      res.status(403).json({ error: 'Unauthorized. Super admin access required.' });
      return;
    }

    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'Invalid request. "enabled" must be a boolean.' });
      return;
    }

    setSiteAccessEnabled(enabled);
    
    res.status(200).json({ 
      success: true, 
      siteAccessEnabled: enabled,
      message: `Site access ${enabled ? 'enabled' : 'disabled'} successfully.`,
      note: 'In production, update SITE_ACCESS_ENABLED environment variable in Vercel dashboard for persistence.'
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
