#!/usr/bin/env node
 

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");

const STRICT_FLAG = "--strict";
const JSON_FLAG = "--json";
const OUTPUT_FLAG = "--output";

function parseArgs(argv) {
  const args = {
    strictMode: false,
    jsonMode: false,
    outputPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === STRICT_FLAG) {
      args.strictMode = true;
      continue;
    }

    if (token === JSON_FLAG) {
      args.jsonMode = true;
      continue;
    }

    if (token === OUTPUT_FLAG) {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        throw new Error(`${OUTPUT_FLAG} requires a file path value.`);
      }
      args.outputPath = next;
      index += 1;
      continue;
    }
  }

  return args;
}

function resolveModulePath(baseFilePath, request) {
  const baseDir = path.dirname(baseFilePath);
  const candidate = path.resolve(baseDir, request);
  const extensions = ["", ".ts", ".tsx", ".js", ".mjs", ".cjs"];

  for (const extension of extensions) {
    const fullPath = `${candidate}${extension}`;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }

  throw new Error(`Unable to resolve local module "${request}" from ${baseFilePath}`);
}

function loadTranslationsModule(filePath, moduleCache = new Map()) {
  const resolvedFilePath = path.resolve(filePath);
  if (moduleCache.has(resolvedFilePath)) {
    return moduleCache.get(resolvedFilePath).exports;
  }

  const source = fs.readFileSync(resolvedFilePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });

  const moduleRef = { exports: {} };
  moduleCache.set(resolvedFilePath, moduleRef);
  const sandbox = {
    module: moduleRef,
    exports: moduleRef.exports,
    require: (id) => {
      if (id.startsWith("./") || id.startsWith("../")) {
        const nextModulePath = resolveModulePath(resolvedFilePath, id);
        return loadTranslationsModule(nextModulePath, moduleCache);
      }

      throw new Error(`Unexpected import in ${resolvedFilePath}: ${id}`);
    },
    __filename: resolvedFilePath,
    __dirname: path.dirname(resolvedFilePath),
    process,
    console,
  };

  vm.runInNewContext(transpiled.outputText, sandbox, { filename: resolvedFilePath });
  return moduleRef.exports;
}

function pad(value, size) {
  const text = String(value);
  if (text.length >= size) return text;
  return `${text}${" ".repeat(size - text.length)}`;
}

function printReport(report) {
  const headers = [
    ["Language", 10],
    ["Fallback", 10],
    ["Locale", 10],
    ["Core", 12],
    ["Coverage", 10],
  ];

  const headerRow = headers.map(([label, width]) => pad(label, width)).join(" ");
  console.log(headerRow);
  console.log("-".repeat(headerRow.length));

  for (const item of report) {
    const core = `${item.localizedCoreKeys}/${item.totalCoreKeys}`;
    const coverage = `${item.coreCoveragePercent.toFixed(2)}%`;
    console.log(
      [
        pad(item.language, 10),
        pad(item.fallbackLanguage, 10),
        pad(item.locale, 10),
        pad(core, 12),
        pad(coverage, 10),
      ].join(" ")
    );
  }
}

function toJsonPayload(report, strictMode) {
  const generatedAt = new Date().toISOString();
  const uncovered = report
    .filter((item) => item.localizedCoreKeys < item.totalCoreKeys || item.coreCoveragePercent < 100)
    .map((item) => item.language);

  return {
    generatedAt,
    strictMode,
    languages: report.length,
    uncoveredLanguages: uncovered,
    report,
  };
}

function writeOutputFile(outputPath, content) {
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  const directory = path.dirname(resolvedPath);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(resolvedPath, content, "utf8");
}

function main() {
  const { strictMode, jsonMode, outputPath } = parseArgs(process.argv.slice(2));
  const translationsPath = path.resolve(process.cwd(), "i18n/translations.ts");

  if (!fs.existsSync(translationsPath)) {
    throw new Error(`Translations file not found: ${translationsPath}`);
  }

  const mod = loadTranslationsModule(translationsPath);
  if (typeof mod.getTranslationCoverageReport !== "function") {
    throw new Error("getTranslationCoverageReport export not found.");
  }

  const report = mod.getTranslationCoverageReport();
  if (!Array.isArray(report)) {
    throw new Error("Translation coverage report is not an array.");
  }

  const payload = toJsonPayload(report, strictMode);
  const jsonContent = `${JSON.stringify(payload, null, 2)}\n`;

  if (jsonMode) {
    console.log(jsonContent.trimEnd());
  } else {
    printReport(report);
  }

  if (outputPath) {
    writeOutputFile(outputPath, jsonContent);
  }

  const uncovered = payload.uncoveredLanguages;

  if (uncovered.length > 0) {
    const uncoveredList = uncovered.join(", ");
    const message = `Translation core coverage below 100%: ${uncoveredList}`;
    if (strictMode) {
      throw new Error(message);
    }
    console.warn(message);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
