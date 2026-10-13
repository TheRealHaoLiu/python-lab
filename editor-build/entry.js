// Everything the lab page needs from CodeMirror 6, exposed as window.CM.
export { EditorView, keymap, placeholder, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
export { EditorState, Compartment, Prec } from '@codemirror/state';
export { defaultKeymap, history, historyKeymap, indentWithTab, indentMore } from '@codemirror/commands';
export { indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, indentUnit } from '@codemirror/language';
export { python, localCompletionSource } from '@codemirror/lang-python';
export { autocompletion, acceptCompletion, completionStatus, closeBrackets, closeBracketsKeymap, completeFromList, startCompletion } from '@codemirror/autocomplete';
export { tags } from '@lezer/highlight';
