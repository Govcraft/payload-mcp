import { Project, InterfaceDeclaration, PropertySignature, Type, TypeAliasDeclaration } from 'ts-morph';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { logger } from './utils/logger.js';

const OUTPUT_DIR = path.join(process.cwd(), 'src', 'mcp', 'generated');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

function typeToJsonSchema(type: Type): any {
  if (type.isString()) return { type: 'string' };
  if (type.isNumber()) return { type: 'number' };
  if (type.isBoolean()) return { type: 'boolean' };
  
  if (type.isArray()) {
    const elementType = type.getArrayElementType();
    
    // Special handling for fields array
    if (elementType && elementType.isUnion() && elementType.getUnionTypes().some(t => t.getProperties().some(p => p.getName() === 'type'))) {
      // This is likely a fields array, handle it specially
      return {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'The name of the field' },
            type: { type: 'string', description: 'The type of field' },
            label: { type: 'string', description: 'The label shown in the admin UI' },
            required: { type: 'boolean', description: 'Whether this field is required' }
          },
          required: ['name', 'type']
        },
        description: 'Array of field configurations'
      };
    }
    
    // Special handling for options array (common in select/radio fields)
    if (elementType && elementType.isObject() && 
        elementType.getProperties().some(p => p.getName() === 'label') && 
        elementType.getProperties().some(p => p.getName() === 'value')) {
      return {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'Display label for the option' },
            value: { 
              oneOf: [
                { type: 'string', description: 'Value stored in the database' },
                { type: 'number', description: 'Numeric value stored in the database' }
              ]
            }
          },
          required: ['label', 'value']
        },
        description: 'Array of options for select/radio fields'
      };
    }
    
    return { 
      type: 'array', 
      items: elementType ? typeToJsonSchema(elementType) : { type: 'object', description: 'Generic object' } 
    };
  }
  
  if (type.isObject()) {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    type.getProperties().forEach((prop: any) => {
      const propName = prop.getName();
      try {
        const declarations = prop.getDeclarations();
        const propType = declarations.length > 0 ? prop.getTypeAtLocation(declarations[0]) : prop.getType();
        
        // Skip properties that are functions or too complex
        if (propType.getCallSignatures().length > 0) {
          // For function properties, provide a simplified schema
          properties[propName] = { 
            type: 'string', 
            description: 'Function expression (e.g., "({ req }) => req.user.role === \'admin\'")'
          };
          return;
        }
        
        properties[propName] = typeToJsonSchema(propType);
        if (!prop.isOptional()) required.push(propName);
      } catch (error) {
        logger.warn(`Failed to process property ${propName} in type ${type.getText()}: ${error instanceof Error ? error.message : String(error)}`);
        
        // Instead of generic any, try to infer a better type based on property name
        if (propName.includes('path') || propName.includes('url') || propName.includes('name') || 
            propName.includes('label') || propName.includes('title') || propName.includes('description')) {
          properties[propName] = { type: 'string', description: `${propName} string value` };
        } else if (propName.includes('count') || propName.includes('limit') || propName.includes('max') || 
                  propName.includes('min') || propName.includes('size') || propName.includes('length')) {
          properties[propName] = { type: 'number', description: `${propName} numeric value` };
        } else if (propName.includes('enabled') || propName.includes('disabled') || propName.includes('required') || 
                  propName.includes('visible') || propName.includes('hidden') || propName.startsWith('is') || 
                  propName.startsWith('has') || propName.startsWith('can')) {
          properties[propName] = { type: 'boolean', description: `${propName} boolean flag` };
        } else if (propName.includes('options') || propName.includes('items') || propName.includes('list')) {
          properties[propName] = { 
            type: 'array', 
            items: { type: 'object' },
            description: `${propName} array of items`
          };
        } else {
          properties[propName] = { 
            type: 'object', 
            description: `${propName} configuration object`
          };
        }
      }
    });
    
    return { 
      type: 'object', 
      properties, 
      required: required.length ? required : undefined 
    };
  }
  
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    
    // Check if this is a field type union (common in Payload)
    const isFieldUnion = unionTypes.some(t => {
      const props = t.getProperties();
      return props.some(p => p.getName() === 'type') && 
             props.some(p => p.getName() === 'name');
    });
    
    if (isFieldUnion) {
      // For field unions, create a more specific schema
      return {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of the field' },
          type: { type: 'string', description: 'The type of field' },
          label: { type: 'string', description: 'The label shown in the admin UI' },
          required: { type: 'boolean', description: 'Whether this field is required' }
        },
        required: ['name', 'type'],
        description: 'Field configuration'
      };
    }
    
    // Handle string literal unions (like enums)
    const stringLiterals = unionTypes.filter(t => t.isStringLiteral());
    if (stringLiterals.length === unionTypes.length) {
      return { 
        type: 'string', 
        enum: stringLiterals.map(t => t.getLiteralValueOrThrow()),
        description: 'One of the allowed string values'
      };
    }
    
    // Handle number literal unions
    const numberLiterals = unionTypes.filter(t => t.isNumberLiteral());
    if (numberLiterals.length === unionTypes.length) {
      return { 
        type: 'number', 
        enum: numberLiterals.map(t => t.getLiteralValueOrThrow()),
        description: 'One of the allowed numeric values'
      };
    }
    
    // Handle boolean unions
    const booleanTypes = unionTypes.filter(t => t.isBoolean());
    if (booleanTypes.length > 0) {
      return { type: 'boolean', description: 'Boolean value' };
    }
    
    // Handle string/number unions (common for IDs)
    const stringTypes = unionTypes.filter(t => t.isString());
    const numberTypes = unionTypes.filter(t => t.isNumber());
    if (stringTypes.length > 0 && numberTypes.length > 0 && 
        stringTypes.length + numberTypes.length === unionTypes.length) {
      return { 
        oneOf: [
          { type: 'string', description: 'String value' },
          { type: 'number', description: 'Numeric value' }
        ],
        description: 'String or number value'
      };
    }
    
    // Handle null unions (optional types)
    const nonNullTypes = unionTypes.filter(t => !t.isNull() && !t.isUndefined());
    if (nonNullTypes.length === 1) {
      return typeToJsonSchema(nonNullTypes[0]);
    }
    
    // For other unions, use oneOf
    return { 
      oneOf: unionTypes
        .filter(t => !t.isNull() && !t.isUndefined())
        .map((t: Type) => typeToJsonSchema(t)),
      description: 'One of the allowed types'
    };
  }
  
  if (type.isEnum()) {
    const enumMembers = type.getSymbol()?.getDeclarations()?.[0]?.getType().getUnionTypes() || [];
    const enumValues = enumMembers.map((t: Type) => t.getLiteralValueOrThrow());
    return { 
      type: 'string', 
      enum: enumValues,
      description: 'One of the enum values'
    };
  }
  
  // For any other type, try to provide a more specific schema based on the type name
  const typeName = type.getText();
  if (typeName.includes('string') || typeName.includes('String')) {
    return { type: 'string', description: 'String value' };
  } else if (typeName.includes('number') || typeName.includes('Number') || 
            typeName.includes('int') || typeName.includes('float')) {
    return { type: 'number', description: 'Numeric value' };
  } else if (typeName.includes('boolean') || typeName.includes('Boolean')) {
    return { type: 'boolean', description: 'Boolean value' };
  } else if (typeName.includes('[]') || typeName.includes('Array')) {
    return { type: 'array', items: { type: 'object' }, description: 'Array of items' };
  } else if (typeName.includes('Record') || typeName.includes('Map') || typeName.includes('Object')) {
    return { type: 'object', properties: {}, description: 'Object with properties' };
  } else if (typeName.includes('Function') || typeName.includes('Callback')) {
    return { type: 'string', description: 'Function expression' };
  } else if (typeName.includes('Date')) {
    return { type: 'string', format: 'date-time', description: 'Date string (ISO format)' };
  }
  
  // If all else fails, return a generic object schema
  return { 
    type: 'object', 
    description: `${typeName} configuration object`
  };
}

function generateToolName(name: string): string {
  return `create${name.endsWith('Field') || name.endsWith('Hook') ? name : name.replace(/Config$/, '')}`;
}

async function generatePayloadTools() {
  logger.info('Generating Payload CMS tools...');

  const project = new Project();
  const sourceFiles = project.addSourceFilesAtPaths([
    'node_modules/payload/dist/**/*.d.ts',
    'node_modules/payload/types/**/*.d.ts',
    'node_modules/payload/dist/types.d.ts',
    'node_modules/payload/dist/index.d.ts',
  ]);
  project.resolveSourceFileDependencies();

  if (sourceFiles.length === 0) {
    throw new Error('No Payload type definitions found. Run `pnpm install payload` first.');
  }
  logger.info(`Loaded ${sourceFiles.length} source files`);

  const allInterfaces = sourceFiles.flatMap(file => file.getInterfaces());
  const allTypeAliases = sourceFiles.flatMap(file => file.getTypeAliases());

  const tools: any[] = [];
  const targetNames = [
    'CollectionConfig', 'GlobalConfig', 'Config', 'SanitizedConfig', 'PayloadConfig',
    'Access', 'CollectionAdminOptions',
    'BeforeChangeHook', 'CollectionBeforeChangeHook', 'BeforeDeleteHook', 'CollectionBeforeDeleteHook',
    'BeforeLoginHook', 'CollectionBeforeLoginHook', 'BeforeOperationHook', 'CollectionBeforeOperationHook',
    'BeforeReadHook', 'CollectionBeforeReadHook', 'BeforeValidateHook', 'CollectionBeforeValidateHook',
    'AfterChangeHook', 'CollectionAfterChangeHook', 'AfterDeleteHook', 'CollectionAfterDeleteHook',
    'AfterErrorHook', 'CollectionAfterErrorHook', 'AfterForgotPasswordHook', 'CollectionAfterForgotPasswordHook',
    'AfterLoginHook', 'CollectionAfterLoginHook', 'AfterLogoutHook', 'CollectionAfterLogoutHook',
    'AfterMeHook', 'CollectionAfterMeHook', 'AfterOperationHook', 'CollectionAfterOperationHook',
    'AfterReadHook', 'CollectionAfterReadHook', 'AfterRefreshHook', 'CollectionAfterRefreshHook',
    'MeHook', 'CollectionMeHook', 'RefreshHook', 'CollectionRefreshHook',
    'Field', 'TextField', 'NumberField', 'DateField', 'EmailField', 'TextareaField',
    'RelationshipField', 'PolymorphicRelationshipField', 'SingleRelationshipField',
    'ArrayField', 'RichTextField', 'CodeField', 'JSONField', 'SelectField', 'RadioField',
    'PointField', 'BlocksField', 'JoinField', 'UploadField', 'GroupField'
  ];
  const processedNames: Set<string> = new Set();

  for (const iface of allInterfaces) {
    const name = iface.getName();
    const baseName = name.replace('Sanitized', '');
    if (targetNames.includes(name) || (name.startsWith('Sanitized') && targetNames.includes(baseName))) {
      if (!processedNames.has(baseName)) {
        logger.info(`Processing interface: ${name} from ${iface.getSourceFile().getFilePath()}`);
        addTool(iface, name, tools);
        processedNames.add(baseName);
      } else {
        logger.debug(`Skipping duplicate interface: ${name} (base: ${baseName})`);
      }
    } else {
      logger.debug(`Skipping interface: ${name}`);
    }
  }

  for (const typeAlias of allTypeAliases) {
    const name = typeAlias.getName();
    const baseName = name.replace('Sanitized', '');
    if (targetNames.includes(name) || (name.startsWith('Sanitized') && targetNames.includes(baseName))) {
      if (!processedNames.has(baseName)) {
        logger.info(`Processing type alias: ${name} from ${typeAlias.getSourceFile().getFilePath()}`);
        addTool(typeAlias, name, tools);
        processedNames.add(baseName);
      } else {
        logger.debug(`Skipping duplicate type alias: ${name} (base: ${baseName})`);
      }
    } else {
      logger.debug(`Skipping type alias: ${name}`);
    }
  }

  const missingTargets = targetNames.filter(name => !processedNames.has(name) && !processedNames.has(name.replace('Sanitized', '')));
  if (missingTargets.length > 0) {
    logger.warn('Target names not found:', missingTargets);
  }

  logger.info('Generated tools:', tools.map(t => t.name));
  
  // Generate the JSON file with tools in MCP format
  const toolsOutput = { tools: Object.fromEntries(tools.map(t => [t.name, t])) };
  writeFileSync(path.join(OUTPUT_DIR, 'payload-tools.json'), JSON.stringify(toolsOutput, null, 2));
  logger.info('Generated payload-tools.json');
  
  // Generate the JavaScript module that exports the tools
  const jsContent = `
/**
 * Auto-generated Payload CMS tools for MCP
 * DO NOT EDIT DIRECTLY - Generated by generate-tools.ts
 */
import { logger } from '../../utils/logger.js';

// Import the tools JSON
import toolsJson from './payload-tools.json' with { type: 'json' };

// Convert JSON tools to MCP SDK format
export const payloadTools = Object.values(toolsJson.tools).map((tool) => {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
    template: tool.template
  };
});
`;
  writeFileSync(path.join(OUTPUT_DIR, 'payload-tools.js'), jsContent);
  logger.info('Generated payload-tools.js');
  
  // Generate TypeScript declaration file
  const dtsContent = `
/**
 * Auto-generated Payload CMS tools for MCP
 */

/**
 * Tool interface matching the SDK requirements
 */
export interface PayloadTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  template: string;
}

export const payloadTools: PayloadTool[];

/**
 * Map of tool names to tool definitions
 */
export interface PayloadToolsMap {
  tools: Record<string, PayloadTool>;
}

/**
 * Default export for JSON import
 */
declare const toolsJson: PayloadToolsMap;
export default toolsJson;
`;
  writeFileSync(path.join(OUTPUT_DIR, 'payload-tools.d.ts'), dtsContent);
  logger.info('Generated payload-tools.d.ts');
}

function addTool(decl: InterfaceDeclaration | TypeAliasDeclaration, name: string, toolsArray: any[]) {
  const schema = typeToJsonSchema(decl.getType());
  let template = '';
  const baseName = name.replace('Sanitized', '');
  const toolName = generateToolName(baseName);

  if (baseName === 'CollectionConfig' || baseName === 'GlobalConfig' || baseName === 'PayloadConfig' || baseName === 'Config' || baseName === 'SanitizedConfig') {
    template = baseName === 'GlobalConfig' || baseName === 'PayloadConfig' || baseName === 'Config' || baseName === 'SanitizedConfig'
      ? "export const {slug} = { slug: '{slug}', fields: {fields}, ...{rest} };"
      : "export const {slug} = { slug: '{slug}', fields: {fields}, ...{rest} };";
  } else if (baseName === 'Field' || baseName.endsWith('Field')) {
    const typeProp = 'getProperty' in decl ? decl.getProperty('type') as PropertySignature | undefined : undefined;
    const typeEnum = typeProp && typeProp.getType().isUnion()
      ? typeProp.getType().getUnionTypes().map((t: Type) => t.isLiteral() ? t.getLiteralValueOrThrow() : null)
      : baseName === 'Field' ? [
          'text', 'number', 'date', 'email', 'textarea', 'relationship', 'array', 'richText',
          'code', 'json', 'select', 'radio', 'point', 'blocks', 'join', 'upload', 'group'
        ] : [baseName.toLowerCase()];
    
    // Ensure we have a proper schema for field types
    if (schema.type === 'any' || !schema.properties) {
      // Create a standard field schema if none exists
      schema.type = 'object';
      schema.properties = {
        name: { type: 'string', description: 'The name of the field, used as the property name in the database' },
        type: { 
          type: 'string', 
          enum: typeEnum.filter(Boolean),
          description: 'The type of field'
        },
        label: { type: 'string', description: 'The label shown in the admin UI' },
        required: { type: 'boolean', description: 'Whether this field is required' }
      };
      
      // Add field-specific properties based on the field type
      if (baseName === 'TextField' || baseName === 'EmailField' || baseName === 'TextareaField') {
        schema.properties.minLength = { type: 'number', description: 'Minimum length of the text' };
        schema.properties.maxLength = { type: 'number', description: 'Maximum length of the text' };
      } else if (baseName === 'NumberField') {
        schema.properties.min = { type: 'number', description: 'Minimum value' };
        schema.properties.max = { type: 'number', description: 'Maximum value' };
      } else if (baseName === 'DateField') {
        schema.properties.defaultValue = { type: 'string', description: 'Default date value' };
      } else if (baseName === 'RelationshipField' || baseName === 'PolymorphicRelationshipField') {
        schema.properties.relationTo = { 
          oneOf: [
            { type: 'string', description: 'Collection to relate to' },
            { type: 'array', items: { type: 'string' }, description: 'Collections to relate to' }
          ]
        };
        schema.properties.hasMany = { type: 'boolean', description: 'Whether this field can relate to multiple documents' };
      } else if (baseName === 'ArrayField') {
        schema.properties.minRows = { type: 'number', description: 'Minimum number of rows' };
        schema.properties.maxRows = { type: 'number', description: 'Maximum number of rows' };
      } else if (baseName === 'SelectField' || baseName === 'RadioField') {
        schema.properties.options = { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' }
            }
          },
          description: 'Options for the select/radio field'
        };
      }
      
      schema.required = ['name', 'type'];
    } else if (typeProp) {
      // If we have a schema but need to add the type enum
      schema.properties.type = { 
        type: 'string', 
        enum: typeEnum.filter(Boolean),
        description: 'The type of field'
      };
      schema.required = schema.required?.includes('type') ? ['name', 'type'] : ['name'];
    }
    
    template = "{ name: '{name}', type: '{type}', ...{rest} }";
  } else if (baseName.includes('Hook')) {
    template = "({ data }) => { return { ...data, modified: true }; }";
    
    // Improve hook schema
    if (schema.type === 'any' || !schema.properties) {
      schema.type = 'object';
      schema.properties = {
        description: { type: 'string', description: 'Description of what this hook does' }
      };
    }
  } else if (baseName === 'Access') {
    template = "({ req }) => !!req.user;";
    
    // Improve access schema
    if (schema.type === 'any' || !schema.properties) {
      schema.type = 'object';
      schema.properties = {
        description: { type: 'string', description: 'Description of this access control function' }
      };
    }
  } else if (baseName === 'CollectionAdminOptions') {
    template = "{ ...{rest} }";
  }

  // Create tool in MCP format
  toolsArray.push({
    name: toolName,
    description: `Creates a Payload CMS 3.0 ${baseName} configuration`,
    inputSchema: schema,  // Using inputSchema instead of parameters to match MCP spec
    template
  });
}

generatePayloadTools().catch(error => {
  console.error('Failed to generate tools:', error.message);
  process.exit(1);
});