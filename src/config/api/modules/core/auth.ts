/**
 * 用户认证服务模块API配置
 * 基于 auth.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const authService: ApiEndpointConfig = {
  name: '用户认证服务',
  baseUrl: '/api/v1',
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
    '/api/v1/core/register': {
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
    '/api/v1/core/login': {
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
    '/api/v1/core/forgot-password': {
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
    '/api/v1/core/verify/{token}': {
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

    // Delete Account
    '/api/v1/core/account': {
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
    '/api/v1/core/refresh-token': {
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
    '/api/v1/core/logout': {
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
    '/api/v1/core/cleanup-expired-tokens': {
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
    '/api/v1/core/health': {
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
    '/api/v1/core/health/detailed': {
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
    '/api/v1/core/health/ready': {
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
    '/api/v1/core/health/live': {
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
    '/api/v1/core/metrics': {
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

    // Update User Preferences
    '/api/v1/core/preferences': {
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
    '/api/v1/core/preferences/default': {
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
