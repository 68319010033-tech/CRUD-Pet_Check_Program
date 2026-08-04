const { requireRole } = require('../middleware/authMiddleware');

describe('requireRole middleware', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('allows admin when admin role is required', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    requireRole('admin')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('rejects user when admin role is required', () => {
    const req = { user: { role: 'user' } };
    const res = mockRes();
    const next = jest.fn();

    requireRole('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden. Insufficient permissions.',
    });
  });
});
