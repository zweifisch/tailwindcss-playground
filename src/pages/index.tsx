import * as React from 'react'
import { Editor } from '../editor'
import { placeholder } from '../placeholder'
import '../preview'

export default function() {

  const [code, setCode] = React.useState(placeholder)

  const handleEditorChange = (code: string) => {
    setCode(code)
    localStorage.setItem('code', code)
  }

  React.useEffect(() => {
    if (localStorage.getItem('code')) {
      setCode(localStorage.getItem('code'))
    }
  }, [])

  React.useEffect(() => {
    document.title = 'Tailwind Playground'
  }, [])


  const style = `
div::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

div::-webkit-scrollbar-track-piece {
  background: #efefef;
}

div::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

html {
  font-family: monospace;
}
`

  return <>
    <style>{style}</style>
    <div style={{height: '100vh', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr'}}>

      <Editor value={code} onChange={handleEditorChange} debugging={false} />

      <div
        style={{
          background: '#fff',
          width: "50vw",
          height: "100vh",
          overflow: "auto",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <html-preview html={code} style={{maxWidth: '80%'}} />
      </div>

    </div>
    <div style={{position: 'fixed', right: '1em', bottom: '0.8em', color: 'gray'}}><a href="https://github.com/zweifisch/tailwindcss-playground">GitHub</a></div>
  </>
}
