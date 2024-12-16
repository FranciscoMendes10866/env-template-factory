import fs from "fs";
import path from "path";

const outputPath = process.argv[2] || process.cwd();
const envPath = path.resolve(process.cwd(), ".env");
const envContents = fs.readFileSync(envPath, "utf-8");

const envValues = envContents
  .split("\n")
  .reduce<Record<string, any>>((acc, line) => {
    const [key, value] = line.split("=");
    if (!key || !value) return acc;

    const trimmedKey = key.trim();
    const trimmedValue = value.trim().replace(/['"]/g, "");
    acc[trimmedKey] = trimmedValue;
    return acc;
  }, {});

const getTypeValue = (value: string): string | number | boolean => {
  if (!isNaN(Number(value)) && value.trim() !== "") {
    return value;
  } else if (/^(?:true|false)$/i.test(value)) {
    return value === "true";
  }
  return `"${value}"`;
};

const typeDefinition = Object.entries(envValues)
  .map(([key, value]) => `  ${key}: ${getTypeValue(value)};`)
  .join("\n");

const envExport = Object.keys(envValues)
  .map((key) => `  ${key}: process.env.${key}`)
  .join(",\n");

const envTsContent =
  `type AppEnvGenType = {\n${typeDefinition}\n};\n\n` +
  `export const APP_ENV = {\n${envExport}\n} as unknown as AppEnvGenType;\n`;

const envTsPath = path.resolve(outputPath, "env.ts");
fs.mkdirSync(path.dirname(envTsPath), { recursive: true });
fs.writeFileSync(envTsPath, envTsContent);

console.log("Generated env.ts file with TypeScript definitions");
