import * as React from "react"
import { EditorView, basicSetup } from "codemirror"
import { ViewUpdate } from "@codemirror/view"
import { Line, TreeView } from "./tree"
import { syntaxTree } from "@codemirror/language"
import { EditorSelection } from "@codemirror/state"
import { SyntaxNode, Tree } from "@lezer/common"
import { tailwind } from "./tailwind"
import { oneDark } from './ondark'

interface EditorProps {
  value: string
  debugging?: boolean
  onChange: (content: string) => void
}

export function Editor(props: EditorProps) {
  const ref = React.useRef()

  const [tree, setTree] = React.useState<Tree>()
  const [code, setCode] = React.useState(props.value)
  const [head, setHead] = React.useState(0)
  const [node, setNode] = React.useState<SyntaxNode>()

  React.useEffect(() => {
    if (editor.current && !editor.current.hasFocus) {
      editor.current.dispatch(
        editor.current.state.update({
          changes: {
            from: 0,
            to: editor.current.state.doc.length,
            insert: props.value || "",
          },
        }),
      )
    }
  }, [props.value])

  const editor = React.useRef<EditorView>()

  React.useEffect(() => {
    if (!ref.current) {
      return
    }

    if (editor.current) {
      editor.current.destroy()
    }

    editor.current = new EditorView({
      doc: props.value,
      extensions: [
        basicSetup,
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            const code = editor.current!.state.doc.toString()
            setCode(code)
            props.onChange(code)
            setTree(syntaxTree(update.state))
          }

          if (update.selectionSet) {
            setHead(update.state.selection.main.head)
          }
        }),
        tailwind(),
        EditorView.lineWrapping,
        oneDark,

        EditorView.theme({
          ".cm-scroller": {height: "100vh"},
          "&": {
            fontSize: '14px',
          }
        })

      ],
      parent: ref.current,
    })
  }, [ref])

  React.useEffect(() => {
    if (head && tree) {
      const node = tree.resolve(head, -1)
      setNode(node)
    }
  }, [head, tree])

  const onLocate = (line: Line) => {
    editor.current?.dispatch({
      selection: { anchor: line.start, head: line.end },
      effects: EditorView.scrollIntoView(
        EditorSelection.range(line.start, line.end),
        { y: "center" },
      ),
    })
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        overflow: 'auto',
      }}
    >
      <div
        style={{
          width: props.debugging ? "50%" : "100%",
          height: "100%",
          overflow: "auto",
        }}
        ref={ref}
      ></div>
      {props.debugging && (
        <TreeView
          style={{
            width: "50%",
            height: "100%",
            fontSize: "12px",
            fontFamily: "monospace",
            overflow: "auto",
          }}
          tree={tree}
          node={node}
          code={code}
          onLocate={onLocate}
        />
      )}
    </div>
  )
}
