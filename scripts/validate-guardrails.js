#!/usr/bin/env node

/**
 * OnePixel Studio - Architectural Fitness Tests & Guardrails Validator
 * This script runs static analysis over the codebase to enforce structural boundaries,
 * detect circular dependencies, analyze subsystem health, and generate the 
 * Architecture Health Report.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

console.log('\n\x1b[1m\x1b[36m======================================================================\x1b[0m');
console.log('\x1b[1m\x1b[36m🛡️  ONEPIXEL STUDIO - ARCHITECTURAL FITNESS & HEALTH REPORT SYSTEM\x1b[0m');
console.log('\x1b[1m\x1b[36m======================================================================\x1b[0m\n');

// Helper to list all TS/TSX files recursively
function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '__tests__' && file !== 'tests') {
        getFilesRecursively(filePath, fileList);
      }
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getFilesRecursively(SRC_DIR);
console.log(`🔍 Found \x1b[1m${allFiles.length}\x1b[0m source files to analyze.`);

// Map of file path -> list of absolute resolved imported file paths
const dependencyGraph = {};
const originalImports = {}; // path -> list of raw import strings
const fileLOC = {};

// Regexes to extract imports
const importRegex = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:["'])([^"'\n]+)(?:["'])/g;
const sideEffectImportRegex = /import\s+?(?:["'])([^"'\n]+)(?:["'])/g;

for (const filePath of allFiles) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  dependencyGraph[relativePath] = [];
  originalImports[relativePath] = [];

  const content = fs.readFileSync(filePath, 'utf-8');
  fileLOC[relativePath] = content.split('\n').length;

  let match;
  // Reset regex state
  importRegex.lastIndex = 0;
  sideEffectImportRegex.lastIndex = 0;

  // Extract standard imports
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    originalImports[relativePath].push(importPath);
  }

  // Extract side-effect imports
  while ((match = sideEffectImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (!originalImports[relativePath].includes(importPath)) {
      originalImports[relativePath].push(importPath);
    }
  }

  // Resolve imports to actual files
  for (const imp of originalImports[relativePath]) {
    if (imp.startsWith('.')) {
      // Relative local import
      const dirOfFile = path.dirname(filePath);
      let resolvedPath = path.resolve(dirOfFile, imp);
      
      // Try resolving extensions
      const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
      let found = false;
      
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        found = true;
      } else {
        for (const ext of extensions) {
          const testPath = resolvedPath + ext;
          if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
            resolvedPath = testPath;
            found = true;
            break;
          }
        }
      }

      if (found) {
        const resolvedRelative = path.relative(ROOT_DIR, resolvedPath);
        if (!dependencyGraph[relativePath].includes(resolvedRelative)) {
          dependencyGraph[relativePath].push(resolvedRelative);
        }
      }
    }
  }
}

// ============================================================================
// SYSTEM SUBSYSTEMS MAPPING
// ============================================================================
const SUBSYSTEMS = {
  Canvas: {
    name: 'Canvas Subsystem',
    match: (p) => p.includes('CanvasArea') || p.includes('utils/canvas') || p.includes('guide') || p.includes('Ruler'),
    publicApiInterface: 'CanvasSubsystemAPI',
    violations: [],
    files: []
  },
  Layers: {
    name: 'Layers Subsystem',
    match: (p) => p.includes('LayerManager') || p.includes('MoveManager'),
    publicApiInterface: 'LayersSubsystemAPI',
    violations: [],
    files: []
  },
  History: {
    name: 'History Subsystem',
    match: (p) => p.includes('useUndoRedo') || p.includes('saveDebug') || p.includes('saveManager') || p.includes('storage'),
    publicApiInterface: 'HistorySubsystemAPI',
    violations: [],
    files: []
  },
  Timeline: {
    name: 'Timeline Subsystem',
    match: (p) => p.includes('Timeline'),
    publicApiInterface: 'TimelineSubsystemAPI',
    violations: [],
    files: []
  },
  Animation: {
    name: 'Animation Subsystem',
    match: (p) => p.includes('utils/animation') && !p.includes('SelectionService'),
    publicApiInterface: 'AnimationSubsystemAPI',
    violations: [],
    files: []
  },
  Selection: {
    name: 'Selection Subsystem',
    match: (p) => p.includes('SelectionService') || (p.includes('core/selection') && !p.includes('transform')),
    publicApiInterface: 'SelectionSubsystemAPI',
    violations: [],
    files: []
  },
  Transform: {
    name: 'Transform Subsystem',
    match: (p) => p.includes('core/transform') || p.includes('transformUtils') || p.includes('transformRenderer'),
    publicApiInterface: 'TransformSubsystemAPI',
    violations: [],
    files: []
  },
  Export: {
    name: 'Export Subsystem',
    match: (p) => p.includes('export') || p.includes('gifEncoder') || p.includes('apngEncoder') || p.includes('spriteSheetBuilder') || p.includes('atlasSerializers') || p.includes('ExportModal') || p.includes('frameRenderer'),
    publicApiInterface: 'ExportSubsystemAPI',
    violations: [],
    files: []
  },
  QA: {
    name: 'QA & Diagnostics',
    match: (p) => p.startsWith('src/qa/') || p.includes('QAPanel') || p.includes('DiagnosticsPanel') || p.includes('telemetry'),
    publicApiInterface: 'N/A (Passive Observer)',
    violations: [],
    files: []
  }
};

// Map each file to its corresponding subsystem
for (const relPath of Object.keys(dependencyGraph)) {
  let matched = false;
  for (const [key, sub] of Object.entries(SUBSYSTEMS)) {
    if (sub.match(relPath)) {
      sub.files.push(relPath);
      matched = true;
      break;
    }
  }
}

// ============================================================================
// GUARDRAIL ASSERTIONS
// ============================================================================
let violationsCount = 0;

function reportViolation(ruleId, filePath, message) {
  violationsCount++;
  const errorMsg = `[${ruleId}] in ${filePath}: ${message}`;
  console.error(`\x1b[31m❌ [VIOLATION] ${errorMsg}\x1b[0m`);
  
  // Assign violation to the matching subsystem
  let assigned = false;
  for (const [key, sub] of Object.entries(SUBSYSTEMS)) {
    if (sub.match(filePath)) {
      sub.violations.push(errorMsg);
      assigned = true;
      break;
    }
  }
}

for (const filePath of allFiles) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = originalImports[relPath] || [];

  // RULE 2.6: Export system must be completely headless and decoupled from React
  const isExportModule = relPath.includes('src/utils/gifEncoder') || 
                         relPath.includes('src/utils/apngEncoder') || 
                         relPath.includes('src/utils/spriteSheetBuilder') || 
                         relPath.includes('src/utils/exportRegistry') ||
                         relPath.includes('src/utils/exportSystem');

  if (isExportModule) {
    for (const imp of imports) {
      if (imp === 'react' || imp.startsWith('react-') || imp.includes('components/CanvasArea')) {
        reportViolation(
          'EXPORT_REACT_DECOUPLED',
          relPath,
          `Export modules must be headless. Forbidden import of '${imp}' detected.`
        );
      }
    }
  }

  // RULE 2.5: QA system must be a passive observer (no direct state mutator modifications)
  const isQAModule = relPath.startsWith('src/qa/');
  if (isQAModule) {
    if (content.includes('setProject(') || content.includes('setUndoStack(') || content.includes('setRedoStack(')) {
      reportViolation(
        'QA_PASSIVE_OBSERVER',
        relPath,
        `QA modules must act as passive observers. Direct state overriding or mutation detected.`
      );
    }
  }

  // RULE 2.2: UI modules should not do direct pixel mutations or drawing logic
  const isStrictUIModule = relPath.includes('src/components/Timeline') ||
                           relPath.includes('src/components/LayerManager') ||
                           relPath.includes('src/components/ColorPanel');
  if (isStrictUIModule) {
    if (content.includes('floodFill') || content.includes('getMagicWandSelection') || content.includes('transformPixels')) {
      reportViolation(
        'UI_LOGIC_SEPARATION',
        relPath,
        `UI components must not execute drawing engine logic or direct pixel manipulations directly.`
      );
    }
  }
}

// ============================================================================
// CYCLE DETECTION & MODULE TRACKING
// ============================================================================
console.log('🔄 Performing circular dependency analysis...');
const visited = {}; // 'unvisited' | 'visiting' | 'visited'
const pathStack = [];
let circularsCount = 0;
const circularFiles = new Set();

function dfsDetectCycle(node) {
  visited[node] = 'visiting';
  pathStack.push(node);

  const neighbors = dependencyGraph[node] || [];
  for (const neighbor of neighbors) {
    if (visited[neighbor] === 'visiting') {
      circularsCount++;
      const cycleStartIndex = pathStack.indexOf(neighbor);
      const cyclePath = pathStack.slice(cycleStartIndex).concat(neighbor);
      console.error(`\x1b[31m❌ [CIRCULAR DEPENDENCY] detected:\x1b[0m\n   ${cyclePath.join(' ──> ')}`);
      cyclePath.forEach(f => circularFiles.add(f));
    } else if (!visited[neighbor]) {
      dfsDetectCycle(neighbor);
    }
  }

  pathStack.pop();
  visited[node] = 'visited';
}

for (const file of Object.keys(dependencyGraph)) {
  if (!visited[file]) {
    dfsDetectCycle(file);
  }
}

// ============================================================================
// GENERATING ARCHITECTURE HEALTH REPORT
// ============================================================================
console.log('\n\x1b[1m\x1b[34m====================================================================================================\x1b[0m');
console.log('\x1b[1m\x1b[34m📋 ARCHITECTURE HEALTH REPORT (AUTOMATED METRICS)\x1b[0m');
console.log('\x1b[1m\x1b[34m====================================================================================================\x1b[0m');

// Print table header
console.log(
  `\x1b[1m${'Subsystem'.padEnd(23)} | ${'Files'.padEnd(5)} | ${'Complexity (LOC)'.padEnd(16)} | ${'Out-Deps'.padEnd(8)} | ${'In-Deps'.padEnd(7)} | ${'Cycles'.padEnd(6)} | ${'Guardrails'.padEnd(10)} | ${'Status'.padEnd(10)}\x1b[0m`
);
console.log('-'.repeat(100));

const publicApisContent = fs.readFileSync(path.join(SRC_DIR, 'api', 'publicApis.ts'), 'utf-8');

for (const [key, sub] of Object.entries(SUBSYSTEMS)) {
  // Total Complexity
  let locSum = 0;
  for (const file of sub.files) {
    locSum += fileLOC[file] || 0;
  }

  // Subsystem external outgoing dependencies (unique)
  const outgoing = new Set();
  for (const file of sub.files) {
    const deps = dependencyGraph[file] || [];
    for (const dep of deps) {
      if (!sub.files.includes(dep)) {
        outgoing.add(dep);
      }
    }
  }

  // Incoming references from files outside the subsystem
  const incoming = new Set();
  for (const file of allFiles) {
    const relFile = path.relative(ROOT_DIR, file);
    if (!sub.files.includes(relFile)) {
      const deps = dependencyGraph[relFile] || [];
      for (const dep of deps) {
        if (sub.files.includes(dep)) {
          incoming.add(relFile);
        }
      }
    }
  }

  // Does any file in this subsystem have a circular dependency?
  let hasCycles = 'Clean';
  for (const file of sub.files) {
    if (circularFiles.has(file)) {
      hasCycles = 'YES';
      break;
    }
  }

  // Public API Status (v1 verification)
  let publicApiOk = false;
  if (key === 'QA') {
    publicApiOk = true; // Passive observer
  } else if (publicApisContent.includes(sub.publicApiInterface)) {
    publicApiOk = true;
  }

  // Determine General Status
  let status = '\x1b[32mHealthy\x1b[0m';
  if (sub.violations.length > 0 || hasCycles === 'YES' || !publicApiOk) {
    status = '\x1b[31mCritical\x1b[0m';
  } else if (locSum > 4000 || outgoing.size > 20) {
    status = '\x1b[33mWarning\x1b[0m';
  }

  const guardrailsStatus = sub.violations.length > 0 ? `\x1b[31mFail (${sub.violations.length})\x1b[0m` : '\x1b[32mPassed\x1b[0m';
  const cyclesLabel = hasCycles === 'YES' ? '\x1b[31mYES\x1b[0m' : '\x1b[32mClean\x1b[0m';

  console.log(
    `${sub.name.padEnd(23)} | ${String(sub.files.length).padEnd(5)} | ${String(locSum).padEnd(16)} | ${String(outgoing.size).padEnd(8)} | ${String(incoming.size).padEnd(7)} | ${cyclesLabel.padEnd(15)} | ${guardrailsStatus.padEnd(19)} | ${status}`
  );
}
console.log('-'.repeat(100));

// ============================================================================
// FINAL VERDICT
// ============================================================================
console.log('\n====================================================================================================');
console.log(`📊 Guardrails Verification Summary:`);
console.log(`   - Total Boundary Violations: ${violationsCount}`);
console.log(`   - Total Circular Dependencies: ${circularsCount}`);
console.log('====================================================================================================');

if (violationsCount > 0 || circularsCount > 0) {
  console.error('\n🛑 \x1b[1m\x1b[31mArchitectural Fitness Tests FAILED. Please resolve the violations listed above.\x1b[0m');
  process.exit(1);
} else {
  console.log('\n🟢 \x1b[1m\x1b[32mArchitectural Fitness Tests PASSED. Guardrails and Public APIs are fully respected!\x1b[0m\n');
  process.exit(0);
}
