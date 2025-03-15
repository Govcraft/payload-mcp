import { logger } from '../../utils/logger.js';
export const createCollectionTool = {
    name: 'createCollection',
    description: 'Creates a Payload CMS 3.0 collection configuration',
    parameters: {
        "type": "object",
        "properties": {
            "auth": {
                "type": "object",
                "properties": {
                    "forgotPassword": {
                        "type": "object",
                        "properties": {
                            "expiration": {
                                "type": "number"
                            },
                            "generateEmailHTML": {
                                "type": "object",
                                "properties": {}
                            },
                            "generateEmailSubject": {
                                "type": "object",
                                "properties": {}
                            }
                        }
                    },
                    "loginWithUsername": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "object",
                                "properties": {
                                    "allowEmailLogin": {
                                        "type": "string"
                                    },
                                    "requireEmail": {
                                        "type": "boolean"
                                    },
                                    "requireUsername": {
                                        "type": "string"
                                    }
                                }
                            },
                            {
                                "type": "object",
                                "properties": {
                                    "allowEmailLogin": {
                                        "type": "string"
                                    },
                                    "requireEmail": {
                                        "type": "boolean"
                                    },
                                    "requireUsername": {
                                        "type": "boolean"
                                    }
                                }
                            }
                        ]
                    },
                    "verify": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "object",
                                "properties": {
                                    "generateEmailHTML": {
                                        "type": "object",
                                        "properties": {}
                                    },
                                    "generateEmailSubject": {
                                        "type": "object",
                                        "properties": {}
                                    }
                                }
                            }
                        ]
                    }
                },
                "required": [
                    "loginWithUsername"
                ]
            },
            "endpoints": {
                "oneOf": [
                    {
                        "type": "string"
                    },
                    {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "custom": {
                                    "type": "object",
                                    "properties": {}
                                },
                                "handler": {
                                    "type": "object",
                                    "properties": {}
                                },
                                "method": {
                                    "oneOf": [
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        }
                                    ]
                                },
                                "path": {
                                    "type": "string"
                                },
                                "root": {
                                    "type": "string"
                                }
                            },
                            "required": [
                                "handler",
                                "method",
                                "path"
                            ]
                        }
                    }
                ]
            },
            "fields": {
                "type": "array",
                "items": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "object",
                            "properties": {
                                "admin": {
                                    "type": "object",
                                    "properties": {
                                        "components": {
                                            "type": "string"
                                        },
                                        "condition": {
                                            "type": "object",
                                            "properties": {}
                                        },
                                        "custom": {
                                            "type": "object",
                                            "properties": {}
                                        },
                                        "disableBulkEdit": {
                                            "type": "boolean"
                                        },
                                        "disableListColumn": {
                                            "type": "boolean"
                                        },
                                        "position": {
                                            "type": "string"
                                        },
                                        "width": {
                                            "type": "string"
                                        }
                                    }
                                },
                                "custom": {
                                    "type": "object",
                                    "properties": {}
                                },
                                "label": {
                                    "oneOf": [
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "object",
                                            "properties": {}
                                        }
                                    ]
                                },
                                "name": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                }
                            },
                            "required": [
                                "admin",
                                "name",
                                "type"
                            ]
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        }
                    ]
                }
            },
            "flattenedFields": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            "joins": {
                "type": "object",
                "properties": {}
            },
            "polymorphicJoins": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "field": {
                            "type": "string"
                        },
                        "getForeignPath": {
                            "type": "object",
                            "properties": {}
                        },
                        "joinPath": {
                            "type": "string"
                        },
                        "parentIsLocalized": {
                            "type": "boolean"
                        },
                        "targetField": {
                            "oneOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "string"
                                }
                            ]
                        }
                    },
                    "required": [
                        "field",
                        "joinPath",
                        "parentIsLocalized",
                        "targetField"
                    ]
                }
            },
            "sanitizedIndexes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "fields": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "field": {
                                        "type": "string"
                                    },
                                    "localizedPath": {
                                        "type": "string"
                                    },
                                    "path": {
                                        "type": "string"
                                    },
                                    "pathHasLocalized": {
                                        "type": "boolean"
                                    }
                                },
                                "required": [
                                    "field",
                                    "localizedPath",
                                    "path",
                                    "pathHasLocalized"
                                ]
                            }
                        },
                        "unique": {
                            "type": "boolean"
                        }
                    },
                    "required": [
                        "fields",
                        "unique"
                    ]
                }
            },
            "slug": {
                "type": "string"
            },
            "upload": {
                "type": "string"
            },
            "versions": {
                "type": "object",
                "properties": {
                    "drafts": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "object",
                                "properties": {
                                    "autosave": {
                                        "oneOf": [
                                            {
                                                "type": "string"
                                            },
                                            {
                                                "type": "object",
                                                "properties": {
                                                    "interval": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    "schedulePublish": {
                                        "type": "boolean"
                                    },
                                    "validate": {
                                        "type": "boolean"
                                    }
                                },
                                "required": [
                                    "autosave",
                                    "schedulePublish",
                                    "validate"
                                ]
                            }
                        ]
                    },
                    "maxPerDoc": {
                        "type": "number"
                    }
                },
                "required": [
                    "drafts",
                    "maxPerDoc"
                ]
            }
        },
        "required": [
            "auth",
            "endpoints",
            "fields",
            "flattenedFields",
            "joins",
            "polymorphicJoins",
            "sanitizedIndexes",
            "slug",
            "upload",
            "versions"
        ]
    },
    handler: async (params) => {
        try {
            const { slug, fields } = params;
            const code = `
import { CollectionConfig } from 'payload/types';

export const ${slug}Collection: CollectionConfig = {
  slug: '${slug}',
  fields: ${JSON.stringify(fields, null, 2)},
  // Add other properties as needed from params
  ...${JSON.stringify(Object.entries(params)
                .filter(([key]) => !['slug', 'fields'].includes(key))
                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}), null, 2)}
};
`;
            return {
                code,
                message: `Collection '${slug}' created successfully`
            };
        }
        catch (error) {
            logger.error('Error in createCollection tool', { error, params });
            throw error;
        }
    }
};
export const createGlobalTool = {
    name: 'createGlobal',
    description: 'Creates a Payload CMS 3.0 global configuration',
    parameters: {
        "type": "object",
        "properties": {
            "endpoints": {
                "oneOf": [
                    {
                        "type": "string"
                    },
                    {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "custom": {
                                    "type": "object",
                                    "properties": {}
                                },
                                "handler": {
                                    "type": "object",
                                    "properties": {}
                                },
                                "method": {
                                    "oneOf": [
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "string"
                                        }
                                    ]
                                },
                                "path": {
                                    "type": "string"
                                },
                                "root": {
                                    "type": "string"
                                }
                            },
                            "required": [
                                "handler",
                                "method",
                                "path"
                            ]
                        }
                    }
                ]
            },
            "fields": {
                "type": "array",
                "items": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "object",
                            "properties": {
                                "admin": {
                                    "type": "object",
                                    "properties": {
                                        "components": {
                                            "type": "string"
                                        },
                                        "condition": {
                                            "type": "object",
                                            "properties": {}
                                        },
                                        "custom": {
                                            "type": "object",
                                            "properties": {}
                                        },
                                        "disableBulkEdit": {
                                            "type": "boolean"
                                        },
                                        "disableListColumn": {
                                            "type": "boolean"
                                        },
                                        "position": {
                                            "type": "string"
                                        },
                                        "width": {
                                            "type": "string"
                                        }
                                    }
                                },
                                "custom": {
                                    "type": "object",
                                    "properties": {}
                                },
                                "label": {
                                    "oneOf": [
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "object",
                                            "properties": {}
                                        }
                                    ]
                                },
                                "name": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                }
                            },
                            "required": [
                                "admin",
                                "name",
                                "type"
                            ]
                        },
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        }
                    ]
                }
            },
            "flattenedFields": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            "slug": {
                "type": "string"
            },
            "versions": {
                "type": "object",
                "properties": {
                    "drafts": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "object",
                                "properties": {
                                    "autosave": {
                                        "oneOf": [
                                            {
                                                "type": "string"
                                            },
                                            {
                                                "type": "object",
                                                "properties": {
                                                    "interval": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    "schedulePublish": {
                                        "type": "boolean"
                                    },
                                    "validate": {
                                        "type": "boolean"
                                    }
                                },
                                "required": [
                                    "autosave",
                                    "schedulePublish",
                                    "validate"
                                ]
                            }
                        ]
                    },
                    "max": {
                        "type": "number"
                    }
                },
                "required": [
                    "drafts",
                    "max"
                ]
            }
        },
        "required": [
            "endpoints",
            "fields",
            "flattenedFields",
            "slug",
            "versions"
        ]
    },
    handler: async (params) => {
        try {
            const { slug, fields } = params;
            const code = `
import { GlobalConfig } from 'payload/types';

export const ${slug}Global: GlobalConfig = {
  slug: '${slug}',
  fields: ${JSON.stringify(fields, null, 2)},
  // Add other properties as needed from params
  ...${JSON.stringify(Object.entries(params)
                .filter(([key]) => !['slug', 'fields'].includes(key))
                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}), null, 2)}
};
`;
            return {
                code,
                message: `Global '${slug}' created successfully`
            };
        }
        catch (error) {
            logger.error('Error in createGlobal tool', { error, params });
            throw error;
        }
    }
};
export const createFieldTool = {
    name: 'createField',
    description: 'Creates a Payload CMS 3.0 field configuration',
    parameters: {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Name of the field (used as the property name in the document)"
            },
            "label": {
                "type": "string",
                "description": "Label displayed in the admin UI"
            },
            "type": {
                "type": "string",
                "enum": [
                    "text",
                    "textarea",
                    "number",
                    "email",
                    "code",
                    "json",
                    "date",
                    "checkbox",
                    "select",
                    "relationship",
                    "array",
                    "blocks",
                    "group",
                    "richText",
                    "upload",
                    "point"
                ],
                "description": "Type of field"
            },
            "required": {
                "type": "boolean",
                "description": "Whether the field is required"
            },
            "unique": {
                "type": "boolean",
                "description": "Whether the field value must be unique"
            },
            "defaultValue": {
                "type": "string",
                "description": "Default value for the field"
            },
            "admin": {
                "type": "object",
                "description": "Admin UI configuration",
                "properties": {
                    "description": {
                        "type": "string",
                        "description": "Description shown in the admin UI"
                    },
                    "position": {
                        "type": "string",
                        "enum": [
                            "sidebar",
                            "main"
                        ],
                        "description": "Position in the admin UI"
                    },
                    "width": {
                        "type": "string",
                        "description": "Width of the field in the admin UI"
                    },
                    "readOnly": {
                        "type": "boolean",
                        "description": "Whether the field is read-only in the admin UI"
                    }
                }
            },
            "options": {
                "type": "array",
                "description": "Options for select fields",
                "items": {
                    "type": "object",
                    "properties": {
                        "label": {
                            "type": "string",
                            "description": "Display label for the option"
                        },
                        "value": {
                            "type": "string",
                            "description": "Value stored in the database"
                        }
                    }
                }
            },
            "fields": {
                "type": "array",
                "description": "Subfields for array, blocks, or group fields",
                "items": {
                    "type": "object",
                    "description": "Field configuration"
                }
            },
            "relationTo": {
                "type": "string",
                "description": "Collection to relate to for relationship fields"
            },
            "hasMany": {
                "type": "boolean",
                "description": "Whether the relationship can have multiple values"
            },
            "minRows": {
                "type": "number",
                "description": "Minimum number of rows for array fields"
            },
            "maxRows": {
                "type": "number",
                "description": "Maximum number of rows for array fields"
            }
        },
        "required": [
            "name",
            "type"
        ]
    },
    handler: async (params) => {
        try {
            const { name, type } = params;
            const code = `
// Field configuration for ${name}
{
  name: '${name}',
  type: '${type}',
  ${Object.entries(params)
                .filter(([key]) => !['name', 'type'].includes(key))
                .map(([key, value]) => {
                if (typeof value === 'object') {
                    return `${key}: ${JSON.stringify(value, null, 2)}`;
                }
                if (typeof value === 'string') {
                    return `${key}: '${value}'`;
                }
                return `${key}: ${value}`;
            })
                .join(',\n  ')}
}
`;
            return {
                code,
                message: `Field '${name}' of type '${type}' created successfully`
            };
        }
        catch (error) {
            logger.error('Error in createField tool', { error, params });
            throw error;
        }
    }
};
export const createAuthTool = {
    name: 'createAuth',
    description: 'Creates a Payload CMS 3.0 authentication configuration',
    parameters: {
        "type": "object",
        "properties": {
            "collection": {
                "type": "string",
                "description": "Collection to use for authentication"
            },
            "tokenExpiration": {
                "type": "number",
                "description": "Token expiration time in seconds"
            },
            "maxLoginAttempts": {
                "type": "number",
                "description": "Maximum number of login attempts before locking"
            },
            "lockTime": {
                "type": "number",
                "description": "Time in milliseconds to lock account after max login attempts"
            },
            "useAPIKey": {
                "type": "boolean",
                "description": "Whether to enable API key authentication"
            },
            "forgotPassword": {
                "type": "object",
                "description": "Forgot password configuration",
                "properties": {
                    "enabled": {
                        "type": "boolean",
                        "description": "Whether to enable forgot password functionality"
                    },
                    "generateEmailHTML": {
                        "type": "boolean",
                        "description": "Whether to generate HTML email template"
                    },
                    "generateEmailSubject": {
                        "type": "boolean",
                        "description": "Whether to generate email subject template"
                    }
                }
            },
            "cookies": {
                "type": "object",
                "description": "Cookie configuration",
                "properties": {
                    "secure": {
                        "type": "boolean",
                        "description": "Whether to use secure cookies"
                    },
                    "sameSite": {
                        "type": "string",
                        "enum": [
                            "strict",
                            "lax",
                            "none"
                        ],
                        "description": "SameSite cookie setting"
                    },
                    "domain": {
                        "type": "string",
                        "description": "Cookie domain"
                    }
                }
            }
        },
        "required": [
            "collection"
        ]
    },
    handler: async (params) => {
        try {
            const { collection } = params;
            const code = `
// Authentication configuration
const authOptions = {
  ${Object.entries(params)
                .map(([key, value]) => {
                if (typeof value === 'object') {
                    return `${key}: ${JSON.stringify(value, null, 2)}`;
                }
                if (typeof value === 'string') {
                    return `${key}: '${value}'`;
                }
                return `${key}: ${value}`;
            })
                .join(',\n  ')}
};

// In your Payload config:
// {
//   collections: [...],
//   globals: [...],
//   ...
//   auth: authOptions,
// }
`;
            return {
                code,
                message: `Authentication configuration for collection '${collection}' created successfully`
            };
        }
        catch (error) {
            logger.error('Error in createAuth tool', { error, params });
            throw error;
        }
    }
};
export const createConfigTool = {
    name: 'createConfig',
    description: 'Creates a Payload CMS 3.0 configuration',
    parameters: {
        "type": "object",
        "properties": {
            "serverURL": {
                "type": "string",
                "description": "URL of the server"
            },
            "collections": {
                "type": "array",
                "description": "Collection configurations",
                "items": {
                    "type": "string",
                    "description": "Collection name"
                }
            },
            "globals": {
                "type": "array",
                "description": "Global configurations",
                "items": {
                    "type": "string",
                    "description": "Global name"
                }
            },
            "admin": {
                "type": "object",
                "description": "Admin UI configuration",
                "properties": {
                    "user": {
                        "type": "string",
                        "description": "User collection for admin authentication"
                    },
                    "meta": {
                        "type": "object",
                        "description": "Meta information for the admin UI",
                        "properties": {
                            "titleSuffix": {
                                "type": "string",
                                "description": "Suffix for the admin UI title"
                            },
                            "favicon": {
                                "type": "string",
                                "description": "Path to favicon"
                            },
                            "ogImage": {
                                "type": "string",
                                "description": "Path to Open Graph image"
                            }
                        }
                    }
                }
            },
            "rateLimit": {
                "type": "object",
                "description": "Rate limiting configuration",
                "properties": {
                    "window": {
                        "type": "number",
                        "description": "Time window in milliseconds"
                    },
                    "max": {
                        "type": "number",
                        "description": "Maximum number of requests per window"
                    }
                }
            },
            "graphQL": {
                "type": "object",
                "description": "GraphQL configuration",
                "properties": {
                    "schemaOutputFile": {
                        "type": "string",
                        "description": "Path to output GraphQL schema"
                    }
                }
            },
            "cors": {
                "type": "array",
                "description": "CORS allowed origins",
                "items": {
                    "type": "string",
                    "description": "Allowed origin"
                }
            },
            "csrf": {
                "type": "array",
                "description": "CSRF allowed origins",
                "items": {
                    "type": "string",
                    "description": "Allowed origin"
                }
            },
            "typescript": {
                "type": "object",
                "description": "TypeScript configuration",
                "properties": {
                    "outputFile": {
                        "type": "string",
                        "description": "Path to output TypeScript types"
                    }
                }
            }
        },
        "required": [
            "serverURL"
        ]
    },
    handler: async (params) => {
        try {
            const { serverURL } = params;
            const collections = Array.isArray(params.collections) ? params.collections : [];
            const globals = Array.isArray(params.globals) ? params.globals : [];
            const code = `
import { buildConfig } from 'payload/config';
import path from 'path';
${collections.length > 0 ? `
// Import collections
${collections.map(collection => `import { ${collection}Collection } from './collections/${collection}';`).join('\n')}` : ''}
${globals.length > 0 ? `
// Import globals
${globals.map(global => `import { ${global}Global } from './globals/${global}';`).join('\n')}` : ''}

export default buildConfig({
  serverURL: '${serverURL}',
  ${Object.entries(params)
                .filter(([key]) => !['serverURL', 'collections', 'globals'].includes(key))
                .map(([key, value]) => {
                if (typeof value === 'object') {
                    return `${key}: ${JSON.stringify(value, null, 2)}`;
                }
                if (typeof value === 'string') {
                    return `${key}: '${value}'`;
                }
                return `${key}: ${value}`;
            })
                .join(',\n  ')}
  ${collections.length > 0 ? `,
  collections: [
    ${collections.map(collection => `${collection}Collection`).join(',\n    ')}
  ]` : ''}
  ${globals.length > 0 ? `,
  globals: [
    ${globals.map(global => `${global}Global`).join(',\n    ')}
  ]` : ''}
});
`;
            return {
                code,
                message: 'Payload CMS configuration created successfully'
            };
        }
        catch (error) {
            logger.error('Error in createConfig tool', { error, params });
            throw error;
        }
    }
};
export const payloadTools = [
    createCollectionTool,
    createGlobalTool,
    createFieldTool,
    createAuthTool,
    createConfigTool
];
//# sourceMappingURL=payload-tools.js.map