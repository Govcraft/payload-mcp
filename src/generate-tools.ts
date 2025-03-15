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
    return { type: 'array', items: elementType ? typeToJsonSchema(elementType) : { type: 'any' } };
  }
  if (type.isObject()) {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    type.getProperties().forEach((prop: any) => {
      const propName = prop.getName();
      let propType;
      try {
        const declarations = prop.getDeclarations();
        propType = declarations.length > 0 ? prop.getTypeAtLocation(declarations[0]) : prop.getType();
        properties[propName] = typeToJsonSchema(propType);
        if (!prop.isOptional()) required.push(propName);
      } catch (error) {
        logger.warn(`Failed to process property ${propName} in type ${type.getText()}: ${error instanceof Error ? error.message : String(error)}`);
        properties[propName] = { type: 'any' };
      }
    });
    return { type: 'object', properties, required: required.length ? required : undefined };
  }
  if (type.isUnion()) {
    const types = type.getUnionTypes().map((t: Type) => typeToJsonSchema(t));
    return { oneOf: types };
  }
  if (type.isEnum()) {
    const enumMembers = type.getSymbol()?.getDeclarations()?.[0]?.getType().getUnionTypes() || [];
    const enumValues = enumMembers.map((t: Type) => t.getLiteralValueOrThrow());
    return { type: 'string', enum: enumValues };
  }
  return { type: 'any' };
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
  const toolsOutput = { tools: Object.fromEntries(tools.map(t => [t.name, t])) };
  writeFileSync(path.join(OUTPUT_DIR, 'payload-tools.json'), JSON.stringify(toolsOutput, null, 2));
  logger.info('Generated payload-tools.json');
}

function addTool(decl: InterfaceDeclaration | TypeAliasDeclaration, name: string, toolsArray: any[]) {
  const params = typeToJsonSchema(decl.getType());
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
    if (typeProp) {
      params.properties.type = { type: 'string', enum: typeEnum.filter(Boolean) };
      params.required = params.required?.includes('type') ? ['name', 'type'] : ['name'];
    }
    template = "{ name: '{name}', type: '{type}', ...{rest} }";
  } else if (baseName.includes('Hook')) {
    template = "({ data }) => { return { ...data, modified: true }; }";
  } else if (baseName === 'Access') {
    template = "({ req }) => !!req.user;";
  } else if (baseName === 'CollectionAdminOptions') {
    template = "{ ...{rest} }";
  }

  toolsArray.push({
    name: toolName,
    description: `Creates a Payload CMS 3.0 ${baseName} configuration`,
    parameters: params,
    execute: 'code_gen',
    template
  });
}

generatePayloadTools().catch(error => {
  console.error('Failed to generate tools:', error.message);
  process.exit(1);
});