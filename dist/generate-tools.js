import { Project } from 'ts-morph';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { logger } from './utils/logger.js';
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'mcp', 'generated');
if (!existsSync(OUTPUT_DIR))
    mkdirSync(OUTPUT_DIR, { recursive: true });
function extractJSDocDescription(node) {
    const jsDocs = node.getJsDocs();
    if (jsDocs.length === 0)
        return undefined;
    const combinedDescription = jsDocs.map(doc => {
        const description = doc.getDescription().trim();
        const tags = doc.getTags().map(tag => {
            const tagName = tag.getTagName();
            const comment = tag.getComment() || '';
            return `@${tagName} ${comment}`.trim();
        }).join('\n');
        return [description, tags].filter(Boolean).join('\n');
    }).join('\n\n');
    return combinedDescription || undefined;
}
function extractPropertyJSDoc(prop) {
    return extractJSDocDescription(prop);
}
function enhanceSchemaWithJSDocs(schema, _type, decl) {
    if (!schema || schema.type !== 'object' || !schema.properties)
        return schema;
    if (decl) {
        const typeDescription = extractJSDocDescription(decl);
        if (typeDescription) {
            schema.description = typeDescription;
        }
    }
    if (decl && 'getProperties' in decl) {
        const properties = decl.getProperties();
        for (const prop of properties) {
            const propName = prop.getName();
            if (schema.properties[propName]) {
                const propJSDoc = extractPropertyJSDoc(prop);
                if (propJSDoc) {
                    schema.properties[propName].description = propJSDoc;
                }
            }
        }
    }
    return schema;
}
function cleanTypeName(typeName) {
    let cleaned = typeName.replace(/import\(".*?\/node_modules\/payload\/dist\/(.*?)"\)\./, 'Payload.');
    cleaned = cleaned.replace(/<.*?>/, '');
    cleaned = cleaned.replace(/import\(".*?"\)\./g, '');
    return cleaned;
}
function typeToJsonSchema(type, _decl) {
    if (type.isString())
        return { type: 'string' };
    if (type.isNumber())
        return { type: 'number' };
    if (type.isBoolean())
        return { type: 'boolean' };
    if (type.isArray()) {
        const elementType = type.getArrayElementType();
        if (elementType && elementType.isUnion() && elementType.getUnionTypes().some(t => t.getProperties().some(p => p.getName() === 'type'))) {
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
        const properties = {};
        const required = [];
        type.getProperties().forEach((prop) => {
            const propName = prop.getName();
            try {
                const declarations = prop.getDeclarations();
                const propType = declarations.length > 0 ? prop.getTypeAtLocation(declarations[0]) : prop.getType();
                if (propType.getCallSignatures().length > 0) {
                    properties[propName] = {
                        type: 'string',
                        description: 'Function expression (e.g., "({ req }) => req.user.role === \'admin\'")'
                    };
                    return;
                }
                let propDescription;
                if (declarations.length > 0 && declarations[0].getKind() === 166) {
                    propDescription = extractPropertyJSDoc(declarations[0]);
                }
                properties[propName] = typeToJsonSchema(propType);
                if (propDescription) {
                    properties[propName].description = propDescription;
                }
                if (!prop.isOptional())
                    required.push(propName);
            }
            catch (error) {
                logger.warn(`Failed to process property ${propName} in type ${type.getText()}: ${error instanceof Error ? error.message : String(error)}`);
                if (propName.includes('path') || propName.includes('url') || propName.includes('name') ||
                    propName.includes('label') || propName.includes('title') || propName.includes('description')) {
                    properties[propName] = { type: 'string', description: `${propName} string value` };
                }
                else if (propName.includes('count') || propName.includes('limit') || propName.includes('max') ||
                    propName.includes('min') || propName.includes('size') || propName.includes('length')) {
                    properties[propName] = { type: 'number', description: `${propName} numeric value` };
                }
                else if (propName.includes('enabled') || propName.includes('disabled') || propName.includes('required') ||
                    propName.includes('visible') || propName.includes('hidden') || propName.startsWith('is') ||
                    propName.startsWith('has') || propName.startsWith('can')) {
                    properties[propName] = { type: 'boolean', description: `${propName} boolean flag` };
                }
                else if (propName.includes('options') || propName.includes('items') || propName.includes('list')) {
                    properties[propName] = {
                        type: 'array',
                        items: { type: 'object' },
                        description: `${propName} array of items`
                    };
                }
                else {
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
        const isFieldUnion = unionTypes.some(t => {
            const props = t.getProperties();
            return props.some(p => p.getName() === 'type') &&
                props.some(p => p.getName() === 'name');
        });
        if (isFieldUnion) {
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
        const stringLiterals = unionTypes.filter(t => t.isStringLiteral());
        if (stringLiterals.length === unionTypes.length) {
            return {
                type: 'string',
                enum: stringLiterals.map(t => t.getLiteralValueOrThrow()),
                description: 'One of the allowed string values'
            };
        }
        const numberLiterals = unionTypes.filter(t => t.isNumberLiteral());
        if (numberLiterals.length === unionTypes.length) {
            return {
                type: 'number',
                enum: numberLiterals.map(t => t.getLiteralValueOrThrow()),
                description: 'One of the allowed numeric values'
            };
        }
        const booleanTypes = unionTypes.filter(t => t.isBoolean());
        if (booleanTypes.length > 0) {
            return { type: 'boolean', description: 'Boolean value' };
        }
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
        const nonNullTypes = unionTypes.filter(t => !t.isNull() && !t.isUndefined());
        if (nonNullTypes.length === 1) {
            return typeToJsonSchema(nonNullTypes[0]);
        }
        return {
            oneOf: unionTypes
                .filter(t => !t.isNull() && !t.isUndefined())
                .map((t) => typeToJsonSchema(t)),
            description: 'One of the allowed types'
        };
    }
    if (type.isEnum()) {
        const enumMembers = type.getSymbol()?.getDeclarations()?.[0]?.getType().getUnionTypes() || [];
        const enumValues = enumMembers.map((t) => t.getLiteralValueOrThrow());
        return {
            type: 'string',
            enum: enumValues,
            description: 'One of the enum values'
        };
    }
    const typeName = type.getText();
    const cleanedTypeName = cleanTypeName(typeName);
    if (typeName.includes('string') || typeName.includes('String')) {
        return { type: 'string', description: 'String value' };
    }
    else if (typeName.includes('number') || typeName.includes('Number') ||
        typeName.includes('int') || typeName.includes('float')) {
        return { type: 'number', description: 'Numeric value' };
    }
    else if (typeName.includes('boolean') || typeName.includes('Boolean')) {
        return { type: 'boolean', description: 'Boolean value' };
    }
    else if (typeName.includes('[]') || typeName.includes('Array')) {
        return { type: 'array', items: { type: 'object' }, description: 'Array of items' };
    }
    else if (typeName.includes('Record') || typeName.includes('Map') || typeName.includes('Object')) {
        return { type: 'object', properties: {}, description: 'Object with properties' };
    }
    else if (typeName.includes('Function') || typeName.includes('Callback')) {
        return { type: 'string', description: 'Function expression' };
    }
    else if (typeName.includes('Date')) {
        return { type: 'string', format: 'date-time', description: 'Date string (ISO format)' };
    }
    return {
        type: 'object',
        description: `${cleanedTypeName} configuration object`
    };
}
function generateToolName(name) {
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
    const tools = [];
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
    const processedNames = new Set();
    const TOOLS_DIR = path.join(OUTPUT_DIR, 'tools');
    if (!existsSync(TOOLS_DIR))
        mkdirSync(TOOLS_DIR, { recursive: true });
    for (const iface of allInterfaces) {
        const name = iface.getName();
        const baseName = name.replace('Sanitized', '');
        if (targetNames.includes(name) || (name.startsWith('Sanitized') && targetNames.includes(baseName))) {
            if (!processedNames.has(baseName)) {
                logger.info(`Processing interface: ${name} from ${iface.getSourceFile().getFilePath()}`);
                addTool(iface, name, tools);
                processedNames.add(baseName);
            }
            else {
                logger.debug(`Skipping duplicate interface: ${name} (base: ${baseName})`);
            }
        }
        else {
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
            }
            else {
                logger.debug(`Skipping duplicate type alias: ${name} (base: ${baseName})`);
            }
        }
        else {
            logger.debug(`Skipping type alias: ${name}`);
        }
    }
    const missingTargets = targetNames.filter(name => !processedNames.has(name) && !processedNames.has(name.replace('Sanitized', '')));
    if (missingTargets.length > 0) {
        logger.warn('Target names not found:', missingTargets);
    }
    logger.info('Generated tools:', tools.map(t => t.name));
    for (const tool of tools) {
        const toolFilePath = path.join(TOOLS_DIR, `${tool.name}.json`);
        writeFileSync(toolFilePath, JSON.stringify(tool, null, 2));
        logger.info(`Generated ${tool.name}.json`);
    }
    const toolsOutput = { tools: Object.fromEntries(tools.map(t => [t.name, t])) };
    writeFileSync(path.join(OUTPUT_DIR, 'payload-tools.json'), JSON.stringify(toolsOutput, null, 2));
    logger.info('Generated payload-tools.json index file');
    const jsContent = `
/**
 * Auto-generated Payload CMS tools for MCP
 * DO NOT EDIT DIRECTLY - Generated by generate-tools.ts
 */
import { logger } from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read all tool files from the tools directory
const toolsDir = path.join(__dirname, 'tools');
logger.info(\`Loading tools from directory: \${toolsDir}\`);

let payloadTools = [];
let toolsMap = {};

try {
  // Check if the directory exists
  if (!fs.existsSync(toolsDir)) {
    logger.error(\`Tools directory does not exist: \${toolsDir}\`);
    throw new Error(\`Tools directory does not exist: \${toolsDir}\`);
  }

  // List all files in the directory
  const allFiles = fs.readdirSync(toolsDir);
  logger.info(\`Found \${allFiles.length} files in tools directory\`);
  
  // Filter for JSON files
  const toolFiles = allFiles.filter(file => file.endsWith('.json'));
  logger.info(\`Found \${toolFiles.length} JSON files in tools directory\`);

  // Load each tool file
  payloadTools = toolFiles.map(file => {
    try {
      const filePath = path.join(toolsDir, file);
      logger.info(\`Loading tool file: \${filePath}\`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const tool = JSON.parse(fileContent);
      return {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
        template: tool.template
      };
    } catch (error) {
      logger.error(\`Error loading tool file \${file}:\`, error);
      return null;
    }
  }).filter(Boolean); // Remove any null entries from failed loads

  logger.info(\`Successfully loaded \${payloadTools.length} tools\`);

  // For backward compatibility
  toolsMap = Object.fromEntries(
    payloadTools.map(tool => [tool.name, tool])
  );
} catch (error) {
  logger.error(\`Error loading tools:\`, error);
  // Provide empty arrays as fallbacks
  payloadTools = [];
  toolsMap = {};
}

export { payloadTools, toolsMap };
`;
    writeFileSync(path.join(OUTPUT_DIR, 'payload-tools.js'), jsContent);
    logger.info('Generated payload-tools.js');
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
 * For backward compatibility
 */
export const toolsMap: Record<string, PayloadTool>;
`;
    writeFileSync(path.join(OUTPUT_DIR, 'payload-tools.d.ts'), dtsContent);
    logger.info('Generated payload-tools.d.ts');
    const indexTsContent = `
/**
 * Auto-generated Payload CMS tools for MCP
 * DO NOT EDIT DIRECTLY - Generated by generate-tools.ts
 */

// Export all tools
export * from './payload-tools.js';

// Export individual tools for direct imports
${tools.map(tool => `export { default as ${tool.name} } from './tools/${tool.name}.json' with { type: 'json' };`).join('\n')}
`;
    writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexTsContent);
    logger.info('Generated index.ts');
}
function addTool(decl, name, toolsArray) {
    const jsDocDescription = extractJSDocDescription(decl);
    const schema = enhanceSchemaWithJSDocs(typeToJsonSchema(decl.getType(), decl), decl.getType(), decl);
    let template = '';
    const baseName = name.replace('Sanitized', '');
    const toolName = generateToolName(baseName);
    if (baseName === 'CollectionConfig') {
        template = `// Collection configuration for Payload CMS
export const {slug} = {
  slug: '{slug}', // URL-friendly identifier for this collection
  admin: {
    useAsTitle: 'title', // Field to use as the title in the admin UI
    defaultColumns: ['title', 'createdAt'], // Default columns in the admin UI list view
  },
  // Define the fields for this collection
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    // Add more fields as needed
    {fields}
  ],
  // Optional: Add hooks, access control, etc.
  ...{rest}
};`;
    }
    else if (baseName === 'GlobalConfig') {
        template = `// Global configuration for Payload CMS
export const {slug} = {
  slug: '{slug}', // URL-friendly identifier for this global
  admin: {
    group: 'Settings', // Group in the admin UI
  },
  // Define the fields for this global
  fields: [
    // Add your fields here
    {fields}
  ],
  // Optional: Add hooks, access control, etc.
  ...{rest}
};`;
    }
    else if (baseName === 'PayloadConfig' || baseName === 'Config' || baseName === 'SanitizedConfig') {
        template = `// Main Payload CMS configuration
export default {
  admin: {
    user: 'users', // Collection used for authentication
    meta: {
      titleSuffix: '- My Payload App', // Suffix for browser tab titles
    },
  },
  collections: [
    // Reference your collections here
  ],
  globals: [
    // Reference your globals here
  ],
  // Optional: Add plugins, localization, etc.
  ...{rest}
};`;
    }
    else if (baseName === 'Field' || baseName.endsWith('Field')) {
        const typeProp = 'getProperty' in decl ? decl.getProperty('type') : undefined;
        const typeEnum = typeProp && typeProp.getType().isUnion()
            ? typeProp.getType().getUnionTypes().map((t) => t.isLiteral() ? t.getLiteralValueOrThrow() : null)
            : baseName === 'Field' ? [
                'text', 'number', 'date', 'email', 'textarea', 'relationship', 'array', 'richText',
                'code', 'json', 'select', 'radio', 'point', 'blocks', 'join', 'upload', 'group'
            ] : [baseName.toLowerCase()];
        const fieldType = baseName.replace('Field', '').toLowerCase();
        if (fieldType === 'text' || fieldType === '') {
            template = `{
  name: '{name}', // Database field name
  type: 'text',
  label: 'Text Field', // Label shown in the admin UI
  required: true,
  minLength: 2,
  maxLength: 100,
  // Optional: Add custom validation
  validate: (value, { siblingData }) => {
    if (value && value.toLowerCase().includes('forbidden')) {
      return 'This field cannot contain the word "forbidden"';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'number') {
            template = `{
  name: '{name}', // Database field name
  type: 'number',
  label: 'Number Field', // Label shown in the admin UI
  required: true,
  min: 0,
  max: 1000,
  // Optional: Add custom validation
  validate: (value) => {
    if (value && value % 1 !== 0) {
      return 'Please enter a whole number';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'date') {
            template = `{
  name: '{name}', // Database field name
  type: 'date',
  label: 'Date Field', // Label shown in the admin UI
  required: true,
  admin: {
    date: {
      pickerAppearance: 'dayAndTime', // 'dayOnly', 'timeOnly', or 'dayAndTime'
    },
  },
  // Optional: Add custom validation
  validate: (value) => {
    const date = new Date(value);
    if (date < new Date()) {
      return 'Date must be in the future';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'email') {
            template = `{
  name: '{name}', // Database field name
  type: 'email',
  label: 'Email Field', // Label shown in the admin UI
  required: true,
  // Optional: Add custom validation beyond the built-in email validation
  validate: (value) => {
    if (value && !value.includes('@example.com')) {
      return 'Only example.com email addresses are allowed';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'textarea') {
            template = `{
  name: '{name}', // Database field name
  type: 'textarea',
  label: 'Textarea Field', // Label shown in the admin UI
  required: true,
  minLength: 10,
  maxLength: 1000,
  // Optional: Add custom validation
  validate: (value) => {
    if (value && value.split('\\n').length < 2) {
      return 'Please include at least two paragraphs';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'relationship' || fieldType === 'polymorphicrelationship') {
            template = `{
  name: '{name}', // Database field name
  type: 'relationship',
  label: 'Relationship Field', // Label shown in the admin UI
  required: true,
  relationTo: 'collection-slug', // The collection to relate to
  hasMany: false, // Set to true for multiple relationships
  // Optional: Add custom validation
  validate: async (value, { req }) => {
    if (value) {
      try {
        const doc = await req.payload.findByID({
          collection: 'collection-slug',
          id: value,
        });
        if (!doc) {
          return 'Related document not found';
        }
      } catch (err) {
        return 'Error validating relationship';
      }
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'array') {
            template = `{
  name: '{name}', // Database field name
  type: 'array',
  label: 'Array Field', // Label shown in the admin UI
  minRows: 1,
  maxRows: 10,
  labels: {
    singular: 'Item',
    plural: 'Items',
  },
  fields: [
    {
      name: 'itemName',
      type: 'text',
      required: true,
    },
    // Add more fields as needed
  ],
  // Optional: Add custom validation
  validate: (value) => {
    if (value && value.length > 0) {
      // Validate the array as a whole
      return true;
    }
    return 'Please add at least one item';
  },
}`;
        }
        else if (fieldType === 'richtext') {
            template = `{
  name: '{name}', // Database field name
  type: 'richText',
  label: 'Rich Text Field', // Label shown in the admin UI
  required: true,
  admin: {
    elements: ['h2', 'h3', 'link', 'ol', 'ul', 'indent'],
    leaves: ['bold', 'italic', 'underline'],
  },
  // Optional: Add custom validation
  validate: (value) => {
    if (value && JSON.stringify(value).length < 20) {
      return 'Please enter more content';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'select') {
            template = `{
  name: '{name}', // Database field name
  type: 'select',
  label: 'Select Field', // Label shown in the admin UI
  required: true,
  options: [
    {
      label: 'Option One',
      value: 'option-one',
    },
    {
      label: 'Option Two',
      value: 'option-two',
    },
  ],
  defaultValue: 'option-one',
  // Optional: Add custom validation
  validate: (value, { siblingData }) => {
    if (value === 'option-two' && !siblingData.requiredForOptionTwo) {
      return 'Additional field is required when Option Two is selected';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'radio') {
            template = `{
  name: '{name}', // Database field name
  type: 'radio',
  label: 'Radio Field', // Label shown in the admin UI
  required: true,
  options: [
    {
      label: 'Option One',
      value: 'option-one',
    },
    {
      label: 'Option Two',
      value: 'option-two',
    },
  ],
  defaultValue: 'option-one',
  // Optional: Add custom validation
  validate: (value) => {
    // Custom validation logic
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'checkbox') {
            template = `{
  name: '{name}', // Database field name
  type: 'checkbox',
  label: 'Checkbox Field', // Label shown in the admin UI
  defaultValue: false,
  // Optional: Add custom validation
  validate: (value, { siblingData }) => {
    if (siblingData.requiresAgreement && value !== true) {
      return 'You must agree to the terms';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'group') {
            template = `{
  name: '{name}', // Database field name
  type: 'group',
  label: 'Group Field', // Label shown in the admin UI
  fields: [
    {
      name: 'groupedField1',
      type: 'text',
      required: true,
    },
    {
      name: 'groupedField2',
      type: 'number',
    },
    // Add more fields as needed
  ],
  // Optional: Add custom validation for the entire group
  validate: (value) => {
    if (value && (!value.groupedField1 || !value.groupedField2)) {
      return 'Both fields in the group are required';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'blocks') {
            template = `{
  name: '{name}', // Database field name
  type: 'blocks',
  label: 'Blocks Field', // Label shown in the admin UI
  minRows: 1,
  maxRows: 10,
  blocks: [
    {
      slug: 'textBlock',
      fields: [
        {
          name: 'text',
          type: 'richText',
          required: true,
        },
      ],
    },
    {
      slug: 'imageBlock',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    // Add more block types as needed
  ],
  // Optional: Add custom validation
  validate: (value) => {
    if (value && value.length > 0) {
      // Validate the blocks as a whole
      return true;
    }
    return 'Please add at least one block';
  },
}`;
        }
        else if (fieldType === 'upload') {
            template = `{
  name: '{name}', // Database field name
  type: 'upload',
  label: 'Upload Field', // Label shown in the admin UI
  relationTo: 'media', // The collection to upload to
  required: true,
  // Optional: Add custom validation
  validate: (value) => {
    if (!value) {
      return 'Please upload a file';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'code') {
            template = `{
  name: '{name}', // Database field name
  type: 'code',
  label: 'Code Field', // Label shown in the admin UI
  admin: {
    language: 'javascript', // The language for syntax highlighting
  },
  // Optional: Add custom validation
  validate: (value) => {
    if (value && value.length < 10) {
      return 'Please enter more code';
    }
    return true; // Return true if valid
  },
}`;
        }
        else if (fieldType === 'json') {
            template = `{
  name: '{name}', // Database field name
  type: 'json',
  label: 'JSON Field', // Label shown in the admin UI
  // Optional: Add custom validation
  validate: (value) => {
    try {
      if (typeof value === 'string') {
        JSON.parse(value);
      }
      return true; // Return true if valid
    } catch (err) {
      return 'Invalid JSON format';
    }
  },
}`;
        }
        else {
            template = `{
  name: '{name}', // Database field name
  type: '${fieldType || '{type}'}',
  label: '${fieldType ? fieldType.charAt(0).toUpperCase() + fieldType.slice(1) : 'Custom'} Field', // Label shown in the admin UI
  required: true,
  // Add field-specific properties here
  
  // Optional: Add custom validation
  validate: (value, { siblingData, operation }) => {
    // Custom validation logic based on the value, sibling data, or operation
    if (!value && operation === 'create') {
      return 'This field is required for new records';
    }
    return true; // Return true if valid
  },
  ...{rest}
}`;
        }
        if (schema.type === 'any' || !schema.properties) {
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
            if (baseName === 'TextField' || baseName === 'EmailField' || baseName === 'TextareaField') {
                schema.properties.minLength = { type: 'number', description: 'Minimum length of the text' };
                schema.properties.maxLength = { type: 'number', description: 'Maximum length of the text' };
                schema.properties.validate = {
                    type: 'string',
                    description: 'Custom validation function that returns true if valid or an error message string if invalid'
                };
            }
            else if (baseName === 'NumberField') {
                schema.properties.min = { type: 'number', description: 'Minimum value' };
                schema.properties.max = { type: 'number', description: 'Maximum value' };
                schema.properties.validate = {
                    type: 'string',
                    description: 'Custom validation function that returns true if valid or an error message string if invalid'
                };
            }
            else if (baseName === 'DateField') {
                schema.properties.defaultValue = { type: 'string', description: 'Default date value' };
                schema.properties.validate = {
                    type: 'string',
                    description: 'Custom validation function that returns true if valid or an error message string if invalid'
                };
            }
            else if (baseName === 'RelationshipField' || baseName === 'PolymorphicRelationshipField') {
                schema.properties.relationTo = {
                    oneOf: [
                        { type: 'string', description: 'Collection to relate to' },
                        { type: 'array', items: { type: 'string' }, description: 'Collections to relate to' }
                    ]
                };
                schema.properties.hasMany = { type: 'boolean', description: 'Whether this field can relate to multiple documents' };
                schema.properties.validate = {
                    type: 'string',
                    description: 'Custom validation function that returns true if valid or an error message string if invalid'
                };
            }
            else if (baseName === 'ArrayField') {
                schema.properties.minRows = { type: 'number', description: 'Minimum number of rows' };
                schema.properties.maxRows = { type: 'number', description: 'Maximum number of rows' };
                schema.properties.validate = {
                    type: 'string',
                    description: 'Custom validation function that returns true if valid or an error message string if invalid'
                };
            }
            else if (baseName === 'SelectField' || baseName === 'RadioField') {
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
                schema.properties.validate = {
                    type: 'string',
                    description: 'Custom validation function that returns true if valid or an error message string if invalid'
                };
            }
            else {
                schema.properties.validate = {
                    type: 'string',
                    description: 'Custom validation function that returns true if valid or an error message string if invalid'
                };
            }
            schema.required = ['name', 'type'];
        }
        else if (typeProp) {
            schema.properties.type = {
                type: 'string',
                enum: typeEnum.filter(Boolean),
                description: 'The type of field'
            };
            schema.required = schema.required?.includes('type') ? ['name', 'type'] : ['name'];
            if (!schema.properties.validate) {
                schema.properties.validate = {
                    type: 'string',
                    description: 'Custom validation function that returns true if valid or an error message string if invalid'
                };
            }
        }
    }
    let description = `Creates a Payload CMS 3.0 ${baseName} configuration`;
    if (jsDocDescription) {
        description = `${description}\n\n${jsDocDescription}`;
    }
    let examples = '';
    if (baseName === 'CollectionConfig') {
        examples = `
Example:
\`\`\`typescript
// Collection for a basic blog post
export const Posts = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
\`\`\``;
    }
    else if (baseName.endsWith('Field')) {
        const fieldType = baseName.replace('Field', '').toLowerCase();
        if (fieldType === 'text') {
            examples = `
Example:
\`\`\`typescript
{
  name: 'title',
  type: 'text',
  required: true,
  label: 'Post Title',
  minLength: 10,
  maxLength: 100,
  // Custom validation example
  validate: (value, { siblingData }) => {
    if (value && value.toLowerCase().includes('forbidden')) {
      return 'Title cannot contain the word "forbidden"';
    }
    return true;
  }
}
\`\`\``;
        }
        else if (fieldType === 'relationship') {
            examples = `
Example:
\`\`\`typescript
{
  name: 'author',
  type: 'relationship',
  relationTo: 'users',
  hasMany: false,
  required: true,
  // Custom validation example
  validate: async (value, { req }) => {
    // Check if the related document exists and is published
    if (value) {
      const relatedDoc = await req.payload.findByID({
        collection: 'users',
        id: value,
      });
      
      if (!relatedDoc) {
        return 'Selected user does not exist';
      }
    }
    return true;
  }
}
\`\`\``;
        }
        else if (fieldType === 'number') {
            examples = `
Example:
\`\`\`typescript
{
  name: 'price',
  type: 'number',
  required: true,
  label: 'Product Price',
  min: 0,
  max: 1000,
  // Custom validation example
  validate: (value) => {
    if (value && value % 1 !== 0) {
      return 'Price must be a whole number';
    }
    return true;
  }
}
\`\`\``;
        }
        else if (fieldType === 'select') {
            examples = `
Example:
\`\`\`typescript
{
  name: 'status',
  type: 'select',
  required: true,
  label: 'Status',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' }
  ],
  defaultValue: 'draft',
  // Custom validation example
  validate: (value, { siblingData }) => {
    if (value === 'published' && !siblingData.publishedAt) {
      return 'Cannot set status to published without a publish date';
    }
    return true;
  }
}
\`\`\``;
        }
        else if (fieldType === 'array') {
            examples = `
Example:
\`\`\`typescript
{
  name: 'items',
  type: 'array',
  label: 'Items',
  minRows: 1,
  maxRows: 10,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 1
    }
  ],
  // Custom validation example
  validate: (value) => {
    if (value && value.length > 0) {
      const totalQuantity = value.reduce((sum, item) => sum + (item.quantity || 0), 0);
      if (totalQuantity > 100) {
        return 'Total quantity cannot exceed 100';
      }
    }
    return true;
  }
}
\`\`\``;
        }
        else {
            examples = `
Example:
\`\`\`typescript
{
  name: '${fieldType}Field',
  type: '${fieldType}',
  required: true,
  label: '${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field',
  // Custom validation example
  validate: (value, { siblingData, operation }) => {
    // Validation logic based on the value, sibling data, or operation
    if (operation === 'create' && !value) {
      return 'This field is required for new records';
    }
    return true;
  }
}
\`\`\``;
        }
    }
    else if (baseName.includes('Hook')) {
        if (baseName.includes('BeforeChange')) {
            template = `/**
 * This hook runs before a document is saved to the database
 * It allows you to modify the data or perform validation
 */
const beforeChangeHook = ({ data, req, operation, originalDoc }) => {
  // 'data' contains the data being saved
  // 'req' is the Express request object with the Payload instance
  // 'operation' is either 'create' or 'update'
  // 'originalDoc' is the document before changes (for updates)
  
  // Example: Add a timestamp
  return {
    ...data,
    modifiedAt: new Date().toISOString(),
    modifiedBy: req.user?.id,
  };
};`;
        }
        else if (baseName.includes('AfterChange')) {
            template = `/**
 * This hook runs after a document has been saved to the database
 * It allows you to perform side effects but cannot modify the saved data
 */
const afterChangeHook = ({ doc, req, operation, previousDoc }) => {
  // 'doc' contains the saved document
  // 'req' is the Express request object with the Payload instance
  // 'operation' is either 'create' or 'update'
  // 'previousDoc' is the document before changes (for updates)
  
  // Example: Send a notification
  if (operation === 'create') {
    // Send notification about new document
    logger.info(\`New document created: \${doc.id}\`);
  }
  
  // Return the document (cannot be modified)
  return doc;
};`;
        }
        else if (baseName.includes('BeforeDelete')) {
            template = `/**
 * This hook runs before a document is deleted
 * It allows you to perform validation or prevent deletion
 */
const beforeDeleteHook = ({ req, id }) => {
  // 'req' is the Express request object with the Payload instance
  // 'id' is the ID of the document being deleted
  
  // Example: Check if deletion is allowed
  // If you return a string, it will prevent deletion with that error message
  // If you throw an error, it will prevent deletion with that error
  
  // To allow deletion, return undefined or void
  return;
};`;
        }
        else if (baseName.includes('AfterDelete')) {
            template = `/**
 * This hook runs after a document has been deleted
 * It allows you to perform side effects
 */
const afterDeleteHook = ({ req, id, doc }) => {
  // 'req' is the Express request object with the Payload instance
  // 'id' is the ID of the document that was deleted
  // 'doc' is the document that was deleted
  
  // Example: Clean up related data
  logger.info(\`Document deleted: \${id}\`);
  
  // No return value is expected
};`;
        }
        else if (baseName.includes('BeforeValidate')) {
            template = `/**
 * This hook runs before validation occurs
 * It allows you to modify the data before validation
 */
const beforeValidateHook = ({ data, req, operation, originalDoc }) => {
  // 'data' contains the data to be validated
  // 'req' is the Express request object with the Payload instance
  // 'operation' is either 'create' or 'update'
  // 'originalDoc' is the document before changes (for updates)
  
  // Example: Set default values
  return {
    ...data,
    status: data.status || 'draft',
  };
};`;
        }
        else if (baseName.includes('BeforeRead') || baseName.includes('AfterRead')) {
            template = `/**
 * This hook runs before/after documents are returned from the database
 * It allows you to modify the data before it's sent to the client
 */
const readHook = ({ doc, req }) => {
  // 'doc' contains the document(s) being read
  // 'req' is the Express request object with the Payload instance
  
  // Example: Add computed properties
  return {
    ...doc,
    computedProperty: \`\${doc.firstName} \${doc.lastName}\`,
  };
};`;
        }
        else {
            template = `/**
 * Generic Payload CMS hook
 * See documentation for specific hook parameters
 */
const hook = (args) => {
  // Extract relevant properties from args based on hook type
  const { req } = args;
  
  // Example: Log hook execution
  logger.info('Hook executed');
  
  // For hooks that modify data, return the modified data
  // For other hooks, return as appropriate for the hook type
  return args.data ? { ...args.data, modified: true } : undefined;
};`;
        }
        if (schema.type === 'any' || !schema.properties) {
            schema.type = 'object';
            schema.properties = {
                description: { type: 'string', description: 'Description of what this hook does' }
            };
        }
    }
    else if (baseName === 'Access') {
        template = `/**
 * Access control function to determine if the operation is allowed
 * Returns true if access is granted, false if denied
 * Can also return a string with an error message if denied
 */
const accessControl = ({ req, id, data, doc }) => {
  // 'req' is the Express request object with the Payload instance and user
  // 'id' is the ID of the document being accessed (for operations on existing documents)
  // 'data' contains the data for create/update operations
  // 'doc' is the existing document for update operations
  
  // Example: Only allow access if user is logged in
  if (!req.user) {
    return false; // Or return 'You must be logged in'
  }
  
  // Example: Check user roles
  if (req.user.role === 'admin') {
    return true; // Admins have full access
  }
  
  // Example: Users can only access their own documents
  if (id && doc && doc.createdBy === req.user.id) {
    return true;
  }
  
  // Deny access with a custom message
  return 'You do not have permission to access this resource';
};`;
        if (schema.type === 'any' || !schema.properties) {
            schema.type = 'object';
            schema.properties = {
                description: { type: 'string', description: 'Description of this access control function' }
            };
        }
    }
    else if (baseName === 'CollectionAdminOptions') {
        template = `/**
 * Admin UI options for a collection
 */
{
  // Field to use as the title in the admin UI
  useAsTitle: 'title',
  
  // Default columns to show in the admin UI list view
  defaultColumns: ['title', 'status', 'createdAt'],
  
  // Group collections in the admin UI sidebar
  group: 'Content',
  
  // Custom admin components (requires importing from your components)
  // components: {
  //   views: {
  //     List: MyCustomListView,
  //   },
  // },
  
  // Additional options
  ...{rest}
}`;
    }
    if (examples) {
        description = `${description}\n${examples}`;
    }
    toolsArray.push({
        name: toolName,
        description: description,
        inputSchema: schema,
        template
    });
}
generatePayloadTools().catch(error => {
    console.error('Failed to generate tools:', error.message);
    process.exit(1);
});
//# sourceMappingURL=generate-tools.js.map