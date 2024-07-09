
export default {
    type: "object",
    properties: {
      username: { type: 'string', format: 'email' },
      password: { type: 'string' }
    },
    required: ['username', 'password']
  } as const;
  