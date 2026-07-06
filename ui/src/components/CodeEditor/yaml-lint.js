import CodeMirror from 'codemirror';
import { load } from 'js-yaml';
import 'codemirror/addon/lint/lint';

/*
  Override 'codemirror/addon/lint/yaml-lint' registerHelper
  so that it doesn't use window.jsyaml
  https://github.com/codemirror/CodeMirror/blob/master/addon/lint/yaml-lint.js
 */
CodeMirror.registerHelper('lint', 'yaml', text => {
  try {
    load(text);
  } catch (e) {
    const loc = e.mark;

    // js-yaml v5 throws on empty input ("expected a document, but the input
    // is empty"), whereas v4 returned undefined. This error has no `mark`, so
    // guard against dereferencing it and produce no marker — matching v4's
    // silent behavior for an empty editor (a common, reachable state).
    if (!loc) {
      return [];
    }

    return [
      {
        from: CodeMirror.Pos(loc.line, loc.column),
        to: CodeMirror.Pos(loc.line, loc.column),
        message: e.message,
      },
    ];
  }
});
