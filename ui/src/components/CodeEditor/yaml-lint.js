import CodeMirror from 'codemirror';
import { load } from 'js-yaml';
import 'codemirror/addon/lint/lint';

/*
  Override 'codemirror/addon/lint/yaml-lint' registerHelper
  so that it doesn't use window.jsyaml
  https://github.com/codemirror/CodeMirror/blob/master/addon/lint/yaml-lint.js
 */
CodeMirror.registerHelper('lint', 'yaml', text => {
  // js-yaml v5 throws on an empty/whitespace-only stream (v4 returned
  // undefined). An empty editor is not a lint error, so skip parsing it.
  if (!text.trim()) {
    return [];
  }

  try {
    load(text);
  } catch (e) {
    // Some exceptions (e.g. the empty-document error) carry no `mark`, so
    // fall back to the start of the buffer rather than throwing on `loc.line`.
    const loc = e.mark || { line: 0, column: 0 };

    return [
      {
        from: CodeMirror.Pos(loc.line, loc.column),
        to: CodeMirror.Pos(loc.line, loc.column),
        message: e.message,
      },
    ];
  }
});
