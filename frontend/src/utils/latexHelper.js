/**
 * Preprocesses text containing raw LaTeX math syntax into standard KaTeX delimiters ($...$ for inline, $$...$$ for block math).
 * Also normalizes raw <br> / <br/> tags into clean HTML line breaks.
 */
export function preprocessLaTeX(text) {
  if (!text || typeof text !== "string") return "";

  let str = text;

  // 0. Normalize raw <br>, <br/>, <br /> tags into clean self-closing <br /> tags
  str = str.replace(/<br\s*\/?>/gi, "<br />");

  // 1. Strip any invalid inner $ or $$ symbols inside LaTeX braces or subscripts (e.g. _{\$$...} or {\$$...})
  str = str.replace(/\{(?:\s*\$\$|\s*\$)+(.*?)(?:\s*\$\$|\s*\$)+\}/g, "{$1}");

  // 2. Convert standard LaTeX delimiters \[ ... \] -> $$ ... $$, \( ... \) -> $ ... $
  str = str.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n\n$$${math.trim()}$$\n\n`);
  str = str.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 3. Fix misplaced [ \cmd ... ] or ( \cmd ... ) enclosing LaTeX commands
  str = str.replace(/(?<!\$)(?<!\\)\[\s*(\\[a-zA-Z]+[\s\S]*?)\s*\](?!\$)/g, (_, math) => `\n\n$$${math.trim()}$$\n\n`);
  str = str.replace(/(?<!\$)(?<!\\)\(\s*(\\[a-zA-Z]+[\s\S]*?)\s*\)(?!\$)/g, (_, math) => `$${math.trim()}$`);

  // 4. Fix malformed \boxed{$\text{...}$} -> \boxed{\text{...}}
  str = str.replace(/\\boxed\{\$([\s\S]*?)\$\}/g, (_, inner) => `\\boxed{${inner}}`);

  // 5. Clean up any accidental quadruple or triple dollars ($$$$, $$$) -> $$
  str = str.replace(/\${3,}/g, "$$");

  // 6. Protect ALL existing math blocks ($...$ and $$...$$) using placeholder tokens
  const mathBlocks = [];
  str = str.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g, (match) => {
    mathBlocks.push(match);
    return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
  });

  // 7. Find un-delimited math expressions (statements containing \frac, \sum, \sigma, \mu, \boxed, \le, \ge, \rightarrow, x_{)
  // Wrap the ENTIRE equation in $ ... $ after stripping any stray inner $ signs
  str = str.replace(/(?:\b[a-zA-Z0-9_\-\s]+=\s*)?\\(?:frac|sum|sqrt|boxed|sigma|mu|alpha|beta|int|le|ge|rightarrow|leftarrow|lfloor|rfloor|dots)\b[^\n$,;.]*/g, (match) => {
    const trimmed = match.trim();
    if (!trimmed) return match;
    const cleanMath = trimmed.replace(/\$/g, "");
    return `$${cleanMath}$`;
  });

  // Wrap remaining bare subscript formulas like x_{...} or F_{\text{...}} if not inside math
  str = str.replace(/\b[a-zA-Z]_(?:\{[^{}\n]+\}|\w+)/g, (match) => {
    const cleanMath = match.replace(/\$/g, "");
    return `$${cleanMath}$`;
  });

  // 8. Restore protected math blocks
  str = str.replace(/___MATH_BLOCK_(\d+)___/g, (_, idx) => mathBlocks[parseInt(idx, 10)]);

  // Final cleanup of any stray triple/quad dollars and inner subscript dollar leaks
  str = str.replace(/\${3,}/g, "$$");
  str = str.replace(/_\{\$+/g, "_{");
  str = str.replace(/\$+\}/g, "}");

  return str;
}
