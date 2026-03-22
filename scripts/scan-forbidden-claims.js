#!/usr/bin/env node
/**
 * Forbidden Claims Scanner (Dev-Only)
 * 
 * Scans codebase for forbidden medical/therapy claims.
 * Run: node scripts/scan-forbidden-claims.js
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_TERMS = [
  // English
  'therapy',
  'treatment',
  'cure',
  'heal',
  'diagnose',
  'diagnosis',
  'treat',
  'medical',
  'therapist',
  'therapeutic',
  
  // Turkish
  'terapi',
  'tedavi',
  'şifa',
  'iyileştir',
  'teşhis',
  'tanı',
  'tıbbi',
  'terapist',
  'terapötik',
];

const ALLOWED_CONTEXTS = [
  'disclaimer',
  'notTherapy',
  'notMedical',
  'supportTool',
  'notTreatment',
  'notCure',
  'notDiagnosis',
  'notHeal',
  'notTherapist',
  'notTherapeutic',
  'notTerapi',
  'notTedavi',
  'notTıbbi',
  'notTerapist',
];

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.expo/,
  /dist/,
  /build/,
  /coverage/,
  /\.next/,
  /\.cache/,
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function isAllowedContext(text, term) {
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  
  // Check if term appears in an allowed context (e.g., "not therapy", "not treatment")
  return ALLOWED_CONTEXTS.some(context => {
    const contextPattern = new RegExp(`not${context}|${context}`, 'i');
    const termIndex = lowerText.indexOf(lowerTerm);
    if (termIndex === -1) return false;
    
    // Check surrounding context
    const before = lowerText.substring(Math.max(0, termIndex - 20), termIndex);
    const after = lowerText.substring(termIndex, Math.min(lowerText.length, termIndex + term.length + 20));
    
    return contextPattern.test(before + after);
  });
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    FORBIDDEN_TERMS.forEach(term => {
      const regex = new RegExp(term, 'gi');
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          // Check if it's in an allowed context
          if (!isAllowedContext(line, term)) {
            issues.push({
              file: filePath,
              line: index + 1,
              term,
              content: line.trim(),
            });
          }
        }
      });
    });
    
    return issues;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (shouldIgnoreFile(filePath)) {
      return;
    }
    
    if (stat.isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (stat.isFile()) {
      // Only scan relevant file types
      if (/\.(ts|tsx|js|jsx|json|md)$/.test(filePath)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function main() {
  console.log('🔍 Scanning for forbidden claims...\n');
  
  const rootDir = path.join(__dirname, '..');
  const files = scanDirectory(rootDir);
  
  const allIssues = [];
  files.forEach(file => {
    const issues = scanFile(file);
    allIssues.push(...issues);
  });
  
  if (allIssues.length === 0) {
    console.log('✅ No forbidden claims found!\n');
    process.exit(0);
  }
  
  console.log(`❌ Found ${allIssues.length} potential issue(s):\n`);
  
  // Group by file
  const issuesByFile = {};
  allIssues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  Object.entries(issuesByFile).forEach(([file, issues]) => {
    console.log(`📄 ${file}`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: "${issue.term}" - ${issue.content.substring(0, 60)}...`);
    });
    console.log('');
  });
  
  console.log('⚠️  Please review these occurrences and ensure they are in allowed contexts (disclaimers, "not therapy", etc.)\n');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, FORBIDDEN_TERMS };
