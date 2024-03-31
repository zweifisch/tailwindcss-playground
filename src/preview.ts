import { twind, cssom, observe } from "@twind/core"

import { defineConfig } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";
import presetAutoprefix from "@twind/preset-autoprefix";


const config = defineConfig({
  presets: [presetAutoprefix(), presetTailwind()]
});


class HTMLPreview extends HTMLElement {

  static observedAttributes = ['html']

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })

    const template = document.createElement('template')
    template.innerHTML = `
       <div class="preview-container"></div>`

    // const script = document.createElement('script')
    // script.src = 'https://cdn.twind.style'
    // this.shadowRoot.appendChild(script)

    this.shadowRoot.appendChild(template.content.cloneNode(true))

    const sheet = cssom(new CSSStyleSheet())
    const tw = twind(config, sheet)
    this.shadowRoot.adoptedStyleSheets = [sheet.target]
    observe(tw, this.shadowRoot)

    this.update()
  }

  update() {
    this.shadowRoot.querySelector('.preview-container').innerHTML = this.getAttribute('html')
  }

  attributeChangedCallback() {
    this.update()
  }
}

customElements.define('html-preview', HTMLPreview)
