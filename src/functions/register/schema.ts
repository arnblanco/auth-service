
export default {
    type: "object",
    properties: {
      name: { type: 'string' },
      username: { type: 'string', format: 'email' },
      password: { type: 'string' }
    },
    required: ['name', 'username', 'password']
  } as const;
  