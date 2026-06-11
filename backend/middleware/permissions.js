function buildScopeFilter(user, tableAlias, startIndex = 1, memberField = 'member_id') {
  if (user.role === 'admin') {
    return { clause: '', params: [], nextIndex: startIndex };
  }

  if (user.role === 'head') {
    return {
      clause: `${tableAlias}.family_id = $${startIndex}`,
      params: [user.familyId],
      nextIndex: startIndex + 1
    };
  }

  if (user.role === 'member') {
    return {
      clause: `${tableAlias}.${memberField} = $${startIndex}`,
      params: [user.memberId],
      nextIndex: startIndex + 1
    };
  }

  return { clause: '', params: [], nextIndex: startIndex };
}

function canAccess(user, resource, memberIdField = 'member_id') {
  if (user.role === 'admin') return true;
  if (user.role === 'head') return resource.family_id === user.familyId;
  if (user.role === 'member') return resource[memberIdField] === user.memberId;
  return false;
}

function requireOwnership(resourceType, loader, memberIdField = 'member_id') {
  return async (req, res, next) => {
    try {
      const resource = await loader(req);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceType}不存在`
        });
      }

      if (!canAccess(req.user, resource, memberIdField)) {
        return res.status(403).json({
          success: false,
          message: `无权访问此${resourceType}`
        });
      }

      req.resource = resource;
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

module.exports = { buildScopeFilter, canAccess, requireOwnership };
