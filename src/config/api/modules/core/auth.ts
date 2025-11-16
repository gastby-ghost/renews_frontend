/**
 * 用户认证服务模块API配置
 * 基于 auth.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const authService: ApiEndpointConfig = {
  name: '用户认证服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/auth',
  defaults: {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer {token}'
    },
    retryCount: 2,
    enableCache: true
  },
  paths: {
    // Register User
    '/register': {
      description: 'Register User',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: UserRegisterRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'PendingRegistrationResponse',
        statusCode: 200
      }
    },

    // Login User
    '/login': {
      description: 'Login User',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: UserLoginRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'AuthResponse',
        statusCode: 200
      }
    },

    // Forgot Password
    '/forgot-password': {
      description: 'Forgot Password',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: ForgotPasswordRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'ForgotPasswordResponse',
        statusCode: 200
      }
    },

    // Verify Email Token
    '/verify/{token}': {
      description: 'Verify Email Token',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          token: 'string - token (必需)'
        }
      },
      response: {
        dataType: 'VerificationResponse',
        statusCode: 200
      }
    },

    // Get Account Settings
    'GET /account': {
      description: 'Get Account Settings',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {}
      },
      response: {
        dataType: 'AccountSettingsResponse',
        statusCode: 200
      }
    },

    // Update Account Settings
    'PUT /account': {
      description: 'Update Account Settings',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: UpdateAccountRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'UpdateAccountResponse',
        statusCode: 200
      }
    },

    // Delete Account
    'DELETE /account': {
      description: 'Delete Account',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: DeleteAccountRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Refresh Access Token
    '/refresh-token': {
      description: 'Refresh Access Token',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          refresh_token: 'string - refresh_token (必需)'
        }
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Logout
    '/logout': {
      description: 'Logout',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {}
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Cleanup Expired Tokens
    '/cleanup-expired-tokens': {
      description: 'Cleanup Expired Tokens',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {}
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Health Check
    '/health': {
      description: 'Health Check',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Detailed Health Check
    '/health/detailed': {
      description: 'Detailed Health Check',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Readiness Check
    '/health/ready': {
      description: 'Readiness Check',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Liveness Check
    '/health/live': {
      description: 'Liveness Check',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Get Metrics
    '/metrics': {
      description: 'Get Metrics',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Get User Preferences
    'GET /preferences': {
      description: 'Get User Preferences',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {}
      },
      response: {
        dataType: 'UserPreferenceResponse',
        statusCode: 200
      }
    },

    // Update User Preferences
    'PUT /preferences': {
      description: 'Update User Preferences',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: UpdateUserPreferenceRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'UserPreferenceResponse',
        statusCode: 200
      }
    },

    // Get Default Preferences
    '/preferences/default': {
      description: 'Get Default Preferences',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'DefaultPreferencesResponse',
        statusCode: 200
      }
    }
  }
}
